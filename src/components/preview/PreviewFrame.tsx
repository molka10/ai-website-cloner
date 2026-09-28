import type { Viewport } from "@/types/project";

const WIDTHS: Record<Viewport, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

type Props = { html: string; viewport: Viewport };

export default function PreviewFrame({ html, viewport }: Props) {
  return (
    <div className="flex flex-1 justify-center overflow-auto rounded-xl border bg-muted/40 p-4">
      <iframe
        title="Generated website preview"
        srcDoc={html}
        sandbox="allow-scripts"
        className="h-full max-w-full rounded-lg border bg-white shadow-sm transition-all duration-300"
        style={{ width: WIDTHS[viewport] }}
      />
    </div>
  );
}