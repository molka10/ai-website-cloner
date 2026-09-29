import type { GenerateInput, GenerateResult, RefineInput } from "@/types/project";
import { sampleResult } from "@/mocks/sampleResult";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type AiResponse = {
  html?: string;
  sections?: string[];
  palette?: string[];
  fonts?: string[];
  improvements?: string[];
  error?: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the image."));
    reader.readAsDataURL(file);
  });
}

export async function generateSite(input: GenerateInput): Promise<GenerateResult> {
  if (input.kind === "url") {
    throw new Error("Rebuilding from a link isn't available yet. Upload a screenshot of the page instead.");
  }

  const image = await fileToBase64(input.file);

  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image, mimeType: input.file.type }),
  });

  const data: AiResponse = await res.json().catch(() => ({ error: "The server returned an invalid response." }));

  if (!res.ok || data.error || !data.html) {
    throw new Error(data.error ?? "Generation failed. Please try again.");
  }

  return {
    id: crypto.randomUUID(),
    sourcePreview: URL.createObjectURL(input.file),
    analysis: {
      sections: data.sections ?? [],
      palette: data.palette ?? [],
      fonts: data.fonts ?? [],
    },
    code: { html: data.html },
    improvements: data.improvements ?? [],
  };
}

export async function refineSite(input: RefineInput): Promise<GenerateResult> {
  await wait(2000);
  const note = `<p style="background:#fef3c7;padding:8px;text-align:center;margin:0">Change applied: ${input.message}</p>`;
  return {
    ...sampleResult,
    id: input.projectId,
    code: { html: input.currentCode.replace("<body>", "<body>" + note) },
  };
}