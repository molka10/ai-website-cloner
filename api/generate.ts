import { parse } from "@babel/parser";
import { verifyUser } from "./_lib/auth.js";

const HTML_RULES = `Rules for the HTML:
- One complete HTML document, starting with <!DOCTYPE html>, with all CSS in a single <style> tag in the head. No external CSS, no JavaScript, no frameworks.
- Responsive (mobile first) and accessible (semantic tags, alt text, good contrast).`;

const BRANDING_RULES = `Branding rules (very important):
- Never copy real brand names, company names, product names, logos, photos or slogans.
- Replace brand and company names with a generic name such as "Brand" or "Acme".
- Replace product, app or service names with generic labels such as "App 1", "Service" or "Product".
- Replace personal data (usernames, emails, file names, hostnames) with neutral placeholders such as "user", "file.txt" or "host".
- Never reproduce third-party logos or brand icons (for example Google, Apple, GitHub or social media icons): use a generic icon shape or plain text instead.
- Replace logos with a simple text logo or a plain shape, and photos with gray boxes that have a short alt text.
- Before answering, re-read your output and replace any real brand, company or personal name that is still there.`;

const GENERATE_PROMPT = `You are an expert front-end developer. Recreate the web page shown in this screenshot.
Match the layout, sections, colors, font styles and spacing as closely as possible.

${HTML_RULES}

${BRANDING_RULES}

Return ONLY a JSON object with these keys:
- "html": the full HTML document as a string
- "sections": array of short section names in order, e.g. ["navbar", "hero", "features", "footer"]
- "palette": array of the main colors as hex codes
- "fonts": array of font family names you used
- "improvements": array of short sentences describing what you improved`;

const REFINE_PROMPT = `You are an expert front-end developer. Below is the current HTML of a web page and a change request from the user.
Apply the change request to the HTML and keep everything else the same.

${HTML_RULES}

${BRANDING_RULES}

Return ONLY a JSON object with these keys:
- "html": the full updated HTML document as a string
- "summary": one short sentence describing what you changed`;

const CHECK_PROMPT = `You are a meticulous front-end QA reviewer.
Image 1 is the ORIGINAL page. Image 2 is a screenshot of our REBUILT page, rendered from the HTML below at the same size.

IMPORTANT: text is NOT part of this review. The rebuilt page uses placeholder texts on purpose.
- Never change any text in the HTML: no words, names, usernames, file names, commands, numbers or labels.
- Never list a text or naming difference as a difference.
- If the only differences are about text, return an empty "differences" array and the HTML unchanged.

Compare only the visual design:
- layout and alignment, section order, sizes and spacing
- colors and backgrounds
- typography (size, weight, style), not the words themselves
- missing or extra visual elements (panels, columns, buttons, icons, image areas)

Then fix the HTML so the rebuilt page looks closer to the original. Keep everything that already matches.

${HTML_RULES}

${BRANDING_RULES}

Return ONLY a JSON object with these keys:
- "score": visual similarity from 0 to 100, for layout and style only
- "differences": array of short sentences describing the visual differences you fixed, most important first (empty if none)
- "html": the full corrected HTML document as a string`;

const REACT_PROMPT = `You are an expert React and Tailwind CSS developer. Convert the HTML page below into a single React function component written in TypeScript (TSX).

Rules:
- Export a default function component named Page.
- Replace all the CSS from the <style> tag with Tailwind CSS utility classes on the elements. Use arbitrary values such as bg-[#0f172a] or text-[15px] when needed to match the design exactly.
- Keep the same structure, texts and visual result. Keep it responsive and accessible.
- Use className, self-close void elements, and no external libraries or imports.
- If the page repeats similar items (cards, links, list rows), define them in an array at the top of the file and map over it.
- Do not include <html>, <head> or <body>: return only the page content.
- The code must compile: check every ternary (condition ? a : b), bracket and closing tag before answering.

${BRANDING_RULES}

Return ONLY a JSON object with one key:
- "code": the full contents of Page.tsx as a string`;

type Body = {
  action?: "generate" | "refine" | "url" | "check" | "react";
  image?: string;
  mimeType?: string;
  code?: string;
  message?: string;
  url?: string;
  original?: string;
  rebuilt?: string;
};

type Part = { text: string } | { inline_data: { mime_type: string; data: string } };

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

type GeminiResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; detail: string };

type MicrolinkResponse = {
  status?: string;
  code?: string;
  data?: { screenshot?: { url?: string } };
};

type Capture = { image: string; mimeType: string; screenshotUrl: string };

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

async function askGemini(apiKey: string, parts: Part[]): Promise<GeminiResult> {
  let res: Response | undefined;

  for (const model of MODELS) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      res = await callGemini(model, apiKey, parts);
      if (res.status !== 503) break;
      console.warn(`Gemini ${model} busy (attempt ${attempt})`);
      await wait(1500);
    }
    if (res && res.status !== 503 && res.status !== 429) break;
    console.warn(`Gemini ${model} unavailable (${res?.status}), trying the next model`);
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 502;
    const detail = res ? (await res.text()).slice(0, 500) : "No response";
    console.error("Gemini error", status, detail);
    return { ok: false, status, detail };
  }

  const json = (await res.json()) as GeminiResponse;
  const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");

  try {
    return { ok: true, data: JSON.parse(text) as Record<string, unknown> };
  } catch {
    return { ok: false, status: 422, detail: text.slice(0, 500) };
  }
}

function errorResponse(failure: { status: number; detail: string }) {
  const { status, detail } = failure;
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
  if (status === 422) {
    return Response.json(
      { error: "The AI answered in an unexpected format. Please try again.", detail },
      { status: 502 },
    );
  }
  return Response.json({ error: "The AI request failed.", detail }, { status: 502 });
}

function syntaxError(code: string): string | null {
  try {
    parse(code, { sourceType: "module", plugins: ["jsx", "typescript"] });
    return null;
  } catch (e) {
    return e instanceof Error ? e.message : String(e);
  }
}

async function captureUrl(url: string): Promise<Capture | string> {
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
  if (body.action === "react") {
    if (!body.code) return "Please send the HTML to convert.";
    if (body.code.length > MAX_CODE_LENGTH) return "The page is too large to convert.";
    return [{ text: REACT_PROMPT }, { text: `HTML to convert:\n${body.code}` }];
  }

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

  if (body.action === "check") {
    if (!body.original || !body.rebuilt || !body.code) return "Please send both images and the current code.";
    if (body.code.length > MAX_CODE_LENGTH) return "The page is too large to check.";
    return [
      { text: CHECK_PROMPT },
      { text: "Image 1, the original page:" },
      { inline_data: { mime_type: "image/jpeg", data: body.original } },
      { text: "Image 2, our rebuilt page:" },
      { inline_data: { mime_type: "image/jpeg", data: body.rebuilt } },
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

    // v2: only signed-in users can use the AI
    let uid: string | null;
    try {
      uid = await verifyUser(request.headers.get("authorization"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Server configuration error.";
      return Response.json({ error: message }, { status: 500 });
    }
    if (!uid) {
      return Response.json({ error: "Please sign in with Google to use ReSite." }, { status: 401 });
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

    let capture: Capture | undefined;

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
      const result = await captureUrl(body.url);
      if (typeof result === "string") {
        return Response.json({ error: result }, { status: 502 });
      }
      capture = result;
      body = { action: "generate", image: capture.image, mimeType: capture.mimeType };
    }

    const parts = buildParts(body);
    if (typeof parts === "string") {
      return Response.json({ error: parts }, { status: 400 });
    }

    const answer = await askGemini(apiKey, parts);
    if (!answer.ok) return errorResponse(answer);
    let data = answer.data;

    if (body.action === "react") {
      const code = typeof data.code === "string" ? data.code : "";
      const problem = syntaxError(code);

      if (problem) {
        console.warn("React code has a syntax error, asking for a fix:", problem);
        const retry = await askGemini(apiKey, [
          ...parts,
          {
            text: `Your previous answer had this syntax error: ${problem}\n\nHere is the code you returned:\n${code}\n\nFix the error and return the same JSON format.`,
          },
        ]);
        if (!retry.ok) return errorResponse(retry);

        const fixed = typeof retry.data.code === "string" ? retry.data.code : "";
        if (syntaxError(fixed)) {
          return Response.json(
            { error: "The AI produced invalid React code twice. Please try again." },
            { status: 502 },
          );
        }
        data = retry.data;
      }
    }

    if (capture) {
      data.screenshotUrl = capture.screenshotUrl;
      data.screenshotBase64 = capture.image;
      data.screenshotMime = capture.mimeType;
    }

    return Response.json(data);
  },
};