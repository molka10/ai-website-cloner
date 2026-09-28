import { Link as LinkIcon, Sparkles, Code } from "lucide-react";

const steps = [
  {
    icon: LinkIcon,
    title: "Paste a link or screenshot",
    text: "Any public page, or an image of a design you like.",
  },
  {
    icon: Sparkles,
    title: "The AI analyzes it",
    text: "It reads the layout, colors, fonts and components, then plans a cleaner version.",
  },
  {
    icon: Code,
    title: "Get editable code",
    text: "Preview it live, refine it by chatting, then copy or download the code.",
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-16 border-t bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          How it works
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          Three steps, about a minute.
        </p>

        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="rounded-xl border bg-background p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
                  <step.icon className="size-5" />
                </span>
                <span className="text-sm text-muted-foreground">Step {i + 1}</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}