import { useState } from "react";
import { useSearchParams } from "react-router";
import { Code, Columns2, Eye, GitCompare } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import InputPanel from "@/components/input/InputPanel";
import AgentProgress from "@/components/agent/AgentProgress";
import ChatPanel from "@/components/agent/ChatPanel";
import PreviewFrame from "@/components/preview/PreviewFrame";
import ViewportSwitcher from "@/components/preview/ViewportSwitcher";
import ComparePanel from "@/components/preview/ComparePanel";
import CodeEditor from "@/components/code/CodeEditor";
import ExportMenu from "@/components/code/ExportMenu";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/projectStore";
import { saveProject } from "@/lib/history";
import type { Viewport } from "@/types/project";

type Tab = "preview" | "code" | "split" | "compare";

const TABS = [
  { value: "preview" as Tab, label: "Preview", icon: Eye },
  { value: "code" as Tab, label: "Code", icon: Code },
  { value: "split" as Tab, label: "Split", icon: Columns2 },
  { value: "compare" as Tab, label: "Compare", icon: GitCompare },
];

export default function Workspace() {
  const [params] = useSearchParams();
  const { status, input, result, error, versions, currentVersion, generate, updateCode, reset } = useProjectStore();
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [tab, setTab] = useState<Tab>("preview");

  const code = versions[currentVersion] ?? "";
  const projectName = input?.kind === "url" ? new URL(input.url).hostname.replace(/\./g, "-") : "my-site";
  const showWorkspace = (status === "ready" || status === "refining") && result;

  function handleSave() {
    if (!result) return;
    saveProject({
      id: result.id,
      name: projectName,
      savedAt: new Date().toISOString(),
      html: code,
      result,
    });
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-6">
        {(status === "idle" || status === "error") && (
          <div className="flex flex-col items-center gap-8 py-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">What do you want to rebuild?</h1>
              <p className="mt-2 text-muted-foreground">Paste a link or drop a screenshot.</p>
            </div>
            {error && <p className="text-destructive">{error}</p>}
            <InputPanel initialUrl={params.get("url") ?? ""} onSubmit={generate} />
          </div>
        )}

        {status === "generating" && <AgentProgress />}

        {showWorkspace && (
          <div className="flex flex-col gap-3 lg:h-[calc(100vh-7rem)]">
            <div className="flex items-center justify-between gap-2">
              <Button variant="outline" size="sm" onClick={reset}>
                Start over
              </Button>

              <div className="flex rounded-lg border p-1">
                {TABS.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setTab(t.value)}
                    aria-pressed={tab === t.value}
                    aria-label={t.label}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      tab === t.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <t.icon className="size-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <div className={tab === "preview" ? "" : "invisible"}>
                  <ViewportSwitcher value={viewport} onChange={setViewport} />
                </div>
                <ExportMenu code={code} name={projectName} onSave={handleSave} />
              </div>
            </div>

            <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[320px_1fr]">
              <div className="order-2 h-96 lg:order-1 lg:h-auto lg:min-h-0">
                <ChatPanel />
              </div>

              <div className="order-1 flex h-[70vh] min-h-0 flex-col lg:order-2 lg:h-auto">
                {tab === "preview" && <PreviewFrame html={code} viewport={viewport} />}

                {tab === "code" && <CodeEditor code={code} onChange={updateCode} />}

                {tab === "split" && (
                  <div className="grid min-h-0 flex-1 grid-rows-2 gap-3 md:grid-cols-2 md:grid-rows-1">
                    <CodeEditor code={code} onChange={updateCode} />
                    <PreviewFrame html={code} viewport="desktop" />
                  </div>
                )}

                {tab === "compare" && <ComparePanel input={input} source={result.sourcePreview} html={code} />}
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}