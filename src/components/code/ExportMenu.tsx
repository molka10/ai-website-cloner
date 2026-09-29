import { useState } from "react";
import { Check, Copy, Download } from "lucide-react";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";

type Props = { code: string; name: string };

export default function ExportMenu({ code, name }: Props) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function downloadZip() {
    const zip = new JSZip();
    zip.file("index.html", code);
    zip.file("README.md", `# ${name}\n\nGenerated with ReSite.\n\nOpen index.html in your browser to see the site.\n`);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${name}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={copyCode}>
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
      </Button>
      <Button size="sm" onClick={downloadZip}>
        <Download className="size-4" />
        <span className="hidden sm:inline">Download</span>
      </Button>
    </div>
  );
}