import { Check, Circle, LoaderCircle } from "lucide-react";
import { MAX_CHECK_ROUNDS, useProjectStore } from "@/store/projectStore";

const STEPS = [
  { label: "Building the page", detail: "Capturing, analyzing the design and writing the code" },
  { label: "Checking against the original", detail: "Comparing the result with the original and fixing differences" },
];

export default function AgentProgress() {
  const { input, stage, round, checkLog } = useProjectStore();

  const source = input?.kind === "url" ? new URL(input.url).hostname : "your screenshot";
  const activeIndex = stage === "check" ? 1 : 0;
  const percent = stage === "check" ? 40 + (round / MAX_CHECK_ROUNDS) * 55 : 25;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 py-16">
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">Rebuilding {source}</h2>
        <p className="mt-1 text-sm text-muted-foreground">This can take a minute or two.</p>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${percent}%` }} />
      </div>

      <ol className="flex flex-col gap-4">
        {STEPS.map((step, i) => {
          const done = i < activeIndex;
          const current = i === activeIndex;
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
                {i === 1 && current && (
                  <p className="mt-1 text-sm">
                    Round {round} of {MAX_CHECK_ROUNDS}
                  </p>
                )}
                {i === 1 &&
                  checkLog.map((line) => (
                    <p key={line} className="text-sm text-muted-foreground">
                      {line}
                    </p>
                  ))}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}