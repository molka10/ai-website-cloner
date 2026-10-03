import { useState } from "react";
import { Atom, Check, Copy, Download, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CodeEditor from "@/components/code/CodeEditor";
import { useProjectStore } from "@/store/projectStore";

export default function ReactPanel() {
  const { versions, currentVersion, reactCode, converting, convertCurrentToReact, status } = useProjectStore();
  const [copied, setCopied] = useState(false);

  const html = versions[currentVersion] ?? "";
  const upToDate = reactCode !== null && reactCode.html === html;

  async function copyCode() {
    if (!reactCode) return;
    await navigator.clipboard.writeText(reactCode.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadFile() {
    if (!reactCode) return;
    const blob = new Blob([reactCode.code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Page.tsx";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!upToDate) {
    return (
      <div className="grid flex-1 place-items-center rounded-xl border border-dashed p-8 text-center">
        <div className="flex max-w-sm flex-col items-center gap-3">
          <Atom className="size-8 text-muted-foreground" />
          <h3 className="text-lg font-semibold">React + Tailwind version</h3>
          <p className="text-sm text-muted-foreground">
            Convert the current version into a React component styled with Tailwind classes, ready to paste into a
            project.
          </p>
          {reactCode && <p className="text-xs text-muted-foreground">The page changed since the last conversion.</p>}
          <Button onClick={convertCurrentToReact} disabled={converting || status !== "ready"}>
            {converting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Converting…
              </>
            ) : (
              <>
                <Atom className="size-4" />
                Convert to React
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Page.tsx · React + Tailwind</p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={copyCode}>
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button size="sm" onClick={downloadFile}>
            <Download className="size-4" />
            Page.tsx
          </Button>
        </div>
      </div>
      <CodeEditor code={reactCode.code} language="typescript" readOnly />
    </div>
  );
}