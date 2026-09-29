import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { ImageUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { GenerateInput } from "@/types/project";

const MAX_SIZE = 3 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

type Props = {
  initialUrl?: string;
  onSubmit: (input: GenerateInput) => void;
};

export default function InputPanel({ initialUrl = "", onSubmit }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File | undefined) => {
    if (!f) return;
    if (!IMAGE_TYPES.includes(f.type)) {
      setError("Use a PNG, JPG or WEBP image.");
      return;
    }
    if (f.size > MAX_SIZE) {
      setError("The image must be 5 MB or less.");
      return;
    }
    setError("");
    setUrl("");
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }, []);

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const pasted = e.clipboardData?.files[0];
      if (pasted) handleFile(pasted);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  function removeFile() {
    setFile(null);
    setPreview(null);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (file) {
      onSubmit({ kind: "image", file });
      return;
    }
    const value = url.trim();
    if (!/^https?:\/\/.+\..+/.test(value)) {
      setError("Enter a full link like https://example.com, or add an image.");
      return;
    }
    onSubmit({ kind: "url", url: value });
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-4">
      <Input
        type="text"
        placeholder="https://example.com"
        value={url}
        disabled={!!file}
        onChange={(e) => {
          setUrl(e.target.value);
          setError("");
        }}
        className="h-11"
        aria-label="Website link"
      />

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border">
          <img src={preview} alt="Screenshot to rebuild" className="max-h-64 w-full object-cover object-top" />
          <button
            type="button"
            onClick={removeFile}
            className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-background/90 shadow"
            aria-label="Remove image"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
            dragging ? "border-primary bg-muted" : "hover:bg-muted/50"
          }`}
        >
          <ImageUp className="size-8 text-muted-foreground" />
          <p className="font-medium">Drop a screenshot here</p>
          <p className="text-sm text-muted-foreground">or click to browse · or paste with Ctrl+V</p>
          <p className="text-xs text-muted-foreground">PNG, JPG or WEBP · max 5 MB</p>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" size="lg" className="h-11">
        Generate
      </Button>
    </form>
  );
}