import type { GenerateInput, GenerateResult, RefineInput } from "@/types/project";

type AiResponse = {
  html?: string;
  summary?: string;
  sections?: string[];
  palette?: string[];
  fonts?: string[];
  improvements?: string[];
  error?: string;
};

export type RefineResult = { html: string; summary: string };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

async function callAi(payload: Record<string, string>): Promise<AiResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: AiResponse = await res.json().catch(() => ({ error: "The server returned an invalid response." }));

  if (!res.ok || data.error || !data.html) {
    throw new Error(data.error ?? "The AI request failed. Please try again.");
  }
  return data;
}

export async function generateSite(input: GenerateInput): Promise<GenerateResult> {
  if (input.kind === "url") {
    throw new Error("Rebuilding from a link isn't available yet. Upload a screenshot of the page instead.");
  }

  const image = await fileToBase64(input.file);
  const data = await callAi({ action: "generate", image, mimeType: input.file.type });

  return {
    id: crypto.randomUUID(),
    sourcePreview: URL.createObjectURL(input.file),
    analysis: {
      sections: data.sections ?? [],
      palette: data.palette ?? [],
      fonts: data.fonts ?? [],
    },
    code: { html: data.html ?? "" },
    improvements: data.improvements ?? [],
  };
}

export async function refineSite(input: RefineInput): Promise<RefineResult> {
  const data = await callAi({ action: "refine", code: input.currentCode, message: input.message });
  return {
    html: data.html ?? "",
    summary: data.summary ?? "Done!",
  };
}