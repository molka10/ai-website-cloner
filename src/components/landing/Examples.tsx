const examples = [
  {
    title: "SaaS landing page",
    improvements: ["Mobile menu", "Better contrast"],
    accent: "bg-sky-500",
  },
  {
    title: "Photographer portfolio",
    improvements: ["Lazy images", "Alt text"],
    accent: "bg-rose-500",
  },
  {
    title: "Admin dashboard",
    improvements: ["Responsive grid", "Keyboard nav"],
    accent: "bg-emerald-500",
  },
];

function MiniPage({ accent, polished }: { accent: string; polished: boolean }) {
  const muted = "bg-muted-foreground/25";
  return (
    <div
      className={`flex aspect-[4/3] flex-col gap-2 rounded-md border p-3 ${
        polished ? "bg-background shadow-sm" : "bg-muted"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`h-2 w-8 rounded ${polished ? accent : muted}`} />
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-1.5 w-4 rounded ${muted}`} />
          ))}
        </div>
      </div>
      <div className={`mt-2 h-3 w-3/4 rounded ${polished ? "bg-foreground" : "bg-muted-foreground/40"}`} />
      <div className={`h-2 w-1/2 rounded ${muted}`} />
      <div className={`mt-1 h-4 w-12 rounded ${polished ? accent : muted}`} />
      <div className="mt-auto grid grid-cols-3 gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-6 rounded ${polished ? "border bg-muted/60" : "bg-muted-foreground/20"}`} />
        ))}
      </div>
    </div>
  );
}

export default function Examples() {
  return (
    <section id="examples" className="scroll-mt-16 border-t">
      <div className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Examples
        </h2>
        <p className="mt-3 text-center text-muted-foreground">
          Same layout, cleaner code, plus the fixes the original was missing.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {examples.map((ex) => (
            <article key={ex.title} className="rounded-xl border bg-background p-4">
              <div className="grid grid-cols-2 gap-3">
                <figure>
                  <MiniPage accent={ex.accent} polished={false} />
                  <figcaption className="mt-2 text-xs text-muted-foreground">Original</figcaption>
                </figure>
                <figure>
                  <MiniPage accent={ex.accent} polished={true} />
                  <figcaption className="mt-2 text-xs font-medium">Rebuilt</figcaption>
                </figure>
              </div>

              <h3 className="mt-4 font-semibold">{ex.title}</h3>
              <ul className="mt-2 flex flex-wrap gap-2">
                {ex.improvements.map((item) => (
                  <li key={item} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    + {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}