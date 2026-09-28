import { useRef } from "react";
import Editor from "@monaco-editor/react";

type Props = { code: string; onChange: (value: string) => void };

export default function CodeEditor({ code, onChange }: Props) {
  const timer = useRef<number | undefined>(undefined);

  function handleChange(value: string | undefined) {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(value ?? ""), 500);
  }

  return (
    <div className="flex-1 overflow-hidden rounded-xl border">
      <Editor
        height="100%"
        defaultLanguage="html"
        value={code}
        theme="vs-dark"
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
}