import { useState } from "react";
import { useSearchParams } from "react-router";
import { Code, Eye } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import InputPanel from "@/components/input/InputPanel";
import AgentProgress from "@/components/agent/AgentProgress";
import PreviewFrame from "@/components/preview/PreviewFrame";
import ViewportSwitcher from "@/components/preview/ViewportSwitcher";
import CodeEditor from "@/components/code/CodeEditor";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/projectStore";
import type { Viewport } from "@/types/project";

type Tab = "preview" | "code";

const TABS = [
  { value: "preview" as Tab, label: "Preview", icon: Eye },
  { value: "code" as Tab, label: "Code", icon: Code },
];

export default function Workspace() {
  const [params] = useSearchParams();
  const { status, result, error, versions, currentVersion, generate, updateCode, reset } = useProjectStore();
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [tab, setTab] = useState<Tab>("preview");

  const code = versions[currentVersion] ?? "";

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

        {status === "ready" && result && (
          <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
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
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors ${
                      tab === t.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <t.icon className="size-4" />
                    {t.label}
                  </button>
                ))}
              </div>

              <div className={tab === "preview" ? "" : "invisible"}>
                <ViewportSwitcher value={viewport} onChange={setViewport} />
              </div>
            </div>

            {tab === "preview" ? (
              <PreviewFrame html={code} viewport={viewport} />
            ) : (
              <CodeEditor code={code} onChange={updateCode} />
            )}
          </div>
        )}
      </main>
    </>
  );
}