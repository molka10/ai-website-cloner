const PROMPT = `You are an expert front-end developer. Recreate the web page shown in this screenshot.

Rules for the HTML:
- One complete HTML document, starting with <!DOCTYPE html>, with all CSS in a single <style> tag in the head. No external CSS, no JavaScript, no frameworks.
- Match the layout, sections, colors, font styles and spacing as closely as possible.
- Make it responsive (mobile first) and accessible (semantic tags, alt text, good contrast).
- Replace logos, brand names, photos and real text with neutral placeholders (a generic brand name, sample text, gray boxes for images).

Return ONLY a JSON object with these keys:
- "html": the full HTML document as a string
- "sections": array of short section names in order, e.g. ["navbar", "hero", "features", "footer"]
- "palette": array of the main colors as hex codes
- "fonts": array of font family names you used
- "improvements": array of short sentences describing what you improved`;

type Body = { image?: string; mimeType?: string };

type GeminiResponse = {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
};

const MODELS = [process.env.GEMINI_MODEL || "gemini-flash-latest", "gemini-3.5-flash-lite"];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function callGemini(model: string, apiKey: string, image: string, mimeType: string) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: image } }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
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

    if (!body.image || !body.mimeType?.startsWith("image/")) {
      return Response.json({ error: "Please send an image." }, { status: 400 });
    }

    let res: Response | undefined;

    for (const model of MODELS) {
      for (let attempt = 1; attempt <= 2; attempt++) {
        res = await callGemini(model, apiKey, body.image, body.mimeType);
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
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.map((p) => p.text ?? "").join("");

    try {
      return Response.json(JSON.parse(text));
    } catch {
      return Response.json(
        { error: "The AI answered in an unexpected format. Please try again.", detail: text.slice(0, 500) },
        { status: 502 },
      );
    }
  },
};