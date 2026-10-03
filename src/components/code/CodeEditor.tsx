import { useRef } from "react";
import Editor, { type Monaco } from "@monaco-editor/react";

type Props = {
  code: string;
  onChange?: (value: string) => void;
  language?: string;
  readOnly?: boolean;
};

function disableTypeErrors(monaco: Monaco) {
  monaco.languages.typescript?.typescriptDefaults?.setDiagnosticsOptions({
    noSemanticValidation: true,
    noSyntaxValidation: true,
  });
}

export default function CodeEditor({ code, onChange, language = "html", readOnly = false }: Props) {
  const timer = useRef<number | undefined>(undefined);

  function handleChange(value: string | undefined) {
    if (!onChange) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onChange(value ?? ""), 500);
  }

  return (
    <div className="flex-1 overflow-hidden rounded-xl border">
      <Editor
        height="100%"
        language={language}
        value={code}
        theme="vs-dark"
        beforeMount={disableTypeErrors}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: "on",
          scrollBeyondLastLine: false,
          readOnly,
        }}
      />
    </div>
  );
}