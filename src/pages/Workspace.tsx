import { useSearchParams } from "react-router";
import Navbar from "@/components/layout/Navbar";
import InputPanel from "@/components/input/InputPanel";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/store/projectStore";

export default function Workspace() {
  const [params] = useSearchParams();
  const { status, result, error, generate, reset } = useProjectStore();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12">
        {(status === "idle" || status === "error") && (
          <div className="flex flex-col items-center gap-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold tracking-tight">What do you want to rebuild?</h1>
              <p className="mt-2 text-muted-foreground">Paste a link or drop a screenshot.</p>
            </div>
            {error && <p className="text-destructive">{error}</p>}
            <InputPanel initialUrl={params.get("url") ?? ""} onSubmit={generate} />
          </div>
        )}

        {status === "generating" && (
          <p className="py-24 text-center text-lg text-muted-foreground">Generating… (about 3 seconds)</p>
        )}

        {status === "ready" && result && (
          <div className="flex flex-col items-center gap-6 py-12 text-center">
            <h2 className="text-2xl font-bold">Result ready ✅</h2>
            <p className="text-muted-foreground">Sections: {result.analysis.sections.join(", ")}</p>
            <div className="flex gap-2">
              {result.analysis.palette.map((color) => (
                <span key={color} className="size-8 rounded-full border" style={{ backgroundColor: color }} title={color} />
              ))}
            </div>
            <Button variant="outline" onClick={reset}>Start over</Button>
          </div>
        )}
      </main>
    </>
  );
}