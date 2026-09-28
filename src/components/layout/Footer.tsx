import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";

const GITHUB_URL = "https://github.com/molka10/ai-website-cloner";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          Ready to rebuild a website?
        </h2>
        <p className="text-muted-foreground">
          Paste a link or a screenshot and get clean code in about a minute.
        </p>
        <Link to="/app" className={buttonVariants({ size: "lg" })}>
          Try it now
        </Link>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-muted-foreground md:flex-row">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="grid size-6 place-items-center rounded-md bg-primary text-xs text-primary-foreground">R</span>
            ReSite
          </Link>

          <nav className="flex gap-6">
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#examples" className="hover:text-foreground">Examples</a>
            <Link to="/history" className="hover:text-foreground">History</Link>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-foreground">GitHub</a>
          </nav>

          <p>© {year} ReSite</p>
        </div>
      </div>
    </footer>
  );
}