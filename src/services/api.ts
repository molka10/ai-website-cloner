import { imageToBase64 } from "@/lib/capture";
import type { CapturedImage, GenerateInput, GenerateResult, RefineInput } from "@/types/project";

type AiResponse = {
  html?: string;
  code?: string;
  summary?: string;
  sections?: string[];
  palette?: string[];
  fonts?: string[];
  improvements?: string[];
  score?: number;
  differences?: string[];
  screenshotUrl?: string;
  screenshotBase64?: string;
  screenshotMime?: string;
  error?: string;
};

export type Generated = { result: GenerateResult; original: CapturedImage };
export type RefineResult = { html: string; summary: string };
export type CheckResult = { score: number; differences: string[]; html: string };

async function callAi(payload: Record<string, string>): Promise<AiResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: AiResponse = await res.json().catch(() => ({ error: "The server returned an invalid response." }));

  if (!res.ok || data.error) {
    throw new Error(data.error ?? "The AI request failed. Please try again.");
  }
  return data;
}

function requireHtml(data: AiResponse): string {
  if (!data.html) throw new Error("The AI returned an empty page. Please try again.");
  return data.html;
}

export async function generateSite(input: GenerateInput): Promise<Generated> {
  let data: AiResponse;
  let original: CapturedImage;
  let sourcePreview: string;

  if (input.kind === "url") {
    data = await callAi({ action: "url", url: input.url });
    if (!data.screenshotBase64) throw new Error("The page capture is missing. Please try again.");
    original = await imageToBase64(`data:${data.screenshotMime ?? "image/png"};base64,${data.screenshotBase64}`);
    sourcePreview = data.screenshotUrl ?? "";
  } else {
    sourcePreview = URL.createObjectURL(input.file);
    original = await imageToBase64(sourcePreview);
    data = await callAi({ action: "generate", image: original.data, mimeType: "image/jpeg" });
  }

  return {
    original,
    result: {
      id: crypto.randomUUID(),
      sourcePreview,
      analysis: {
        sections: data.sections ?? [],
        palette: data.palette ?? [],
        fonts: data.fonts ?? [],
      },
      code: { html: requireHtml(data) },
      improvements: data.improvements ?? [],
    },
  };
}

export async function refineSite(input: RefineInput): Promise<RefineResult> {
  const data = await callAi({ action: "refine", code: input.currentCode, message: input.message });
  return {
    html: requireHtml(data),
    summary: data.summary ?? "Done!",
  };
}

export async function checkSite(original: string, rebuilt: string, code: string): Promise<CheckResult> {
  const data = await callAi({ action: "check", original, rebuilt, code });
  return {
    score: typeof data.score === "number" ? Math.round(data.score) : 0,
    differences: data.differences ?? [],
    html: data.html ?? code,
  };
}

export async function convertToReact(html: string): Promise<string> {
  const data = await callAi({ action: "react", code: html });
  if (!data.code) throw new Error("The AI returned an empty component. Please try again.");
  return data.code;
}