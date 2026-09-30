const BRANDING_RULES = `Branding rules (very important):
- Never copy real brand names, company names, product names, logos, photos or slogans.
- Replace brand and company names with a generic name such as "Brand" or "Acme".
- Replace product, app or service names with generic labels such as "App 1", "Service" or "Product".
- Replace logos with a simple text logo or a plain shape, and photos with gray boxes that have a short alt text.
- Before answering, re-read your HTML and replace any real brand or company name that is still there.`;

const GENERATE_PROMPT = `You are an expert front-end developer. Recreate the web page shown in this screenshot.

Rules for the HTML:
- One complete HTML document, starting with <!DOCTYPE html>, with all CSS in a single <style> tag in the head. No external CSS, no JavaScript, no frameworks.
- Match the layout, sections, colors, font styles and spacing as closely as possible.
- Make it responsive (mobile first) and accessible (semantic tags, alt text, good contrast).

${BRANDING_RULES}

Return ONLY a JSON object with these keys:
- "html": the full HTML document as a string
- "sections": array of short section names in order, e.g. ["navbar", "hero", "features", "footer"]
- "palette": array of the main colors as hex codes
- "fonts": array of font family names you used
- "improvements": array of short sentences describing what you improved`;

const REFINE_PROMPT = `You are an expert front-end developer. Below is the current HTML of a web page and a change request from the user.

Apply the change request to the HTML and keep everything else the same.

Rules for the HTML:
- One complete HTML document, starting with <!DOCTYPE html>, with all CSS in a single <style> tag in the head. No external CSS, no JavaScript, no frameworks.
- Keep the page responsive and accessible.

${BRANDING_RULES}

Return ONLY a JSON object with these keys:
- "html": the full updated HTML document as a string
- "summary": one short sentence describing what you changed`;

type Body = {
  action?: "generate" | "refine" | "url";
  image?: string;
  mimeType?: string;
  code?: string;
  message?: string;
  url?: string;
};

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

type MicrolinkResponse = {
  status?: string;
  code?: string;
  data?: { screenshot?: { url?: string } };
};

const MODELS = [process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-3.5-flash-lite"];

const MAX_CODE_LENGTH = 200_000;
const MAX_MESSAGE_LENGTH = 1_000;
const BLOCKED_PAGES = /(login|log-in|signin|sign-in|signup|sign-up|checkout|payment|billing|password|account)/i;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function callGemini(model: string, apiKey: string, parts: Part[]) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
}

async function captureUrl(url: string): Promise<{ image: string; mimeType: string; screenshotUrl: string } | string> {
  const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`);
  const data = (await res.json().catch(() => ({}))) as MicrolinkResponse;
  const screenshotUrl = data.data?.screenshot?.url;

  if (!res.ok || data.status !== "success" || !screenshotUrl) {
    console.error("Microlink error", res.status, data.code);
    if (data.code === "EPROXYNEEDED") return "This site blocks automated captures. Upload a screenshot of it instead.";
    if (res.status === 429) return "The free capture quota is used up for today. Upload a screenshot instead.";
    return "Could not capture this page. Check the link, or upload a screenshot instead.";
  }

  const img = await fetch(screenshotUrl);
  if (!img.ok) return "Could not download the page capture. Please try again.";

  const type = img.headers.get("content-type") ?? "";
  const mimeType = type.startsWith("image/") ? type.split(";")[0] : "image/png";
  const image = Buffer.from(await img.arrayBuffer()).toString("base64");

  return { image, mimeType, screenshotUrl };
}

function buildParts(body: Body): Part[] | string {
  if (body.action === "refine") {
    if (!body.code || !body.message?.trim()) return "Please send the current code and a change request.";
    if (body.code.length > MAX_CODE_LENGTH) return "The page is too large to edit.";
    if (body.message.length > MAX_MESSAGE_LENGTH) return "The change request is too long.";
    return [
      { text: REFINE_PROMPT },
      { text: `Change request: ${body.message.trim()}` },
      { text: `Current HTML:\n${body.code}` },
    ];
  }

  if (!body.image || !body.mimeType?.startsWith("image/")) return "Please send an image.";
  return [{ text: GENERATE_PROMPT }, { inline_data: { mime_type: body.mimeType, data: body.image } }];
}

export default {
  async fetch(request: Request) {
    if (request.method !== "POST") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "The server is missing its GEMINI_API_KEY." }, { status: 500 });
    }

    let body: Body;
    try {
      body = (await request.json()) as Body;
    } catch {
      return Response.json({ error: "Invalid request." }, { status: 400 });
    }

    let screenshotUrl: string | undefined;

    if (body.action === "url") {
      if (!body.url || !/^https?:\/\/.+\..+/.test(body.url)) {
        return Response.json({ error: "Please send a valid link." }, { status: 400 });
      }
      if (BLOCKED_PAGES.test(body.url)) {
        return Response.json(
          { error: "For safety, login, account and payment pages can't be rebuilt." },
          { status: 400 },
        );
      }
      const capture = await captureUrl(body.url);
      if (typeof capture === "string") {
        return Response.json({ error: capture }, { status: 502 });
      }
      screenshotUrl = capture.screenshotUrl;
      body = { action: "generate", image: capture.image, mimeType: capture.mimeType };
    }

    const parts = buildParts(body);
    if (typeof parts === "string") {
      return Response.json({ error: parts }, { status: 400 });
    }

    let res: Response | undefined;

    for (const model of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        res = await callGemini(model, apiKey, parts);
        if (res.status !== 503) break;
        console.warn(`Gemini ${model} busy (attempt ${attempt})`);
        await wait(1500);
      }
      if (res && res.status !== 503) break;
    }

    if (!res || !res.ok) {
      const status = res?.status ?? 502;
      const detail = res ? (await res.text()).slice(0, 500) : "No response";
      console.error("Gemini error", status, detail);

      if (status === 429) {
        return Response.json(
          { error: "The free AI quota is used up for now. Wait a minute and try again.", detail },
          { status: 429 },
        );
      }
      if (status === 503) {
        return Response.json(
          { error: "The AI is very busy right now. Please try again in a few minutes.", detail },
          { status: 503 },
        );
      }
      return Response.json({ error: "The AI request failed.", detail }, { status: 502 });
    }

    const data = (await res.json()) as GeminiResponse;
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");

    try {
      const result = JSON.parse(text) as Record<string, unknown>;
      if (screenshotUrl) result.screenshotUrl = screenshotUrl;
      return Response.json(result);
    } catch {
      return Response.json(
        { error: "The AI answered in an unexpected format. Please try again.", detail: text.slice(0, 500) },
        { status: 502 },
      );
    }
  },
};