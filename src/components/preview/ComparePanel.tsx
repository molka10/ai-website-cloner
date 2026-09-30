import PreviewFrame from "@/components/preview/PreviewFrame";
import type { GenerateInput } from "@/types/project";

type Props = { input: GenerateInput | null; source: string; html: string };

export default function ComparePanel({ input, source, html }: Props) {
  return (
    <div className="grid min-h-0 flex-1 grid-rows-2 gap-3 md:grid-cols-2 md:grid-rows-1">
      <figure className="flex min-h-0 flex-col gap-2">
        <figcaption className="text-sm font-medium text-muted-foreground">Original</figcaption>
        {source ? (
          <div className="flex-1 overflow-auto rounded-xl border bg-muted/40 p-2">
            <img src={source} alt="Original page" className="w-full rounded-lg" />
          </div>
        ) : (
          <div className="grid flex-1 place-items-center rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">
                {input?.kind === "url" ? input.url : "Original not available"}
              </p>
              <p className="mt-1">No capture of the original page is stored for this project.</p>
            </div>
          </div>
        )}
      </figure>

      <figure className="flex min-h-0 flex-col gap-2">
        <figcaption className="text-sm font-medium">Rebuilt</figcaption>
        <PreviewFrame html={html} viewport="desktop" />
      </figure>
    </div>
  );
}