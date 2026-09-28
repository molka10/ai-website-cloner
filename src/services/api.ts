import type { GenerateInput, GenerateResult, RefineInput } from "@/types/project";
import { sampleResult } from "@/mocks/sampleResult";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function generateSite(input: GenerateInput): Promise<GenerateResult> {
  await wait(3000);
  return {
    ...sampleResult,
    id: crypto.randomUUID(),
    sourcePreview: input.kind === "url" ? input.url : URL.createObjectURL(input.file),
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