import { useEffect, useState } from "react";
import { Check, Circle, LoaderCircle } from "lucide-react";
import { useProjectStore } from "@/store/projectStore";

const STEPS = [
  { label: "Capturing the page", detail: "Taking screenshots and reading the structure" },
  { label: "Analyzing the design", detail: "Layout, colors, fonts and components" },
  { label: "Writing the code", detail: "Building each section and checking the result" },
];

const STEP_MS = 1000;

export default function AgentProgress() {
  const input = useProjectStore((s) => s.input);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => Math.min(a + 1, STEPS.length - 1));
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  const source = input?.kind === "url" ? new URL(input.url).hostname : "your screenshot";
  const percent = ((active + 1) / STEPS.length) * 100;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Rebuilding {source}</h2>
        <p className="mt-1 text-sm text-muted-foreground">This usually takes a few seconds.</p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>

      <ol className="flex flex-col gap-4">
        {STEPS.map((step, i) => {
          const done = i < active;
          const current = i === active;
          return (
            <li key={step.label} className="flex items-start gap-3">
              <span className="mt-0.5">
                {done && <Check className="size-5 text-primary" />}
                {current && <LoaderCircle className="size-5 animate-spin text-primary" />}
                {!done && !current && <Circle className="size-5 text-muted-foreground/40" />}
              </span>
              <div>
                <p className={current || done ? "font-medium" : "text-muted-foreground"}>{step.label}</p>
                <p className="text-sm text-muted-foreground">{step.detail}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}