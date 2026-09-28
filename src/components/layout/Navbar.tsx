import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground text-sm">
            R
          </span>
          ReSite
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#examples" className="hover:text-foreground transition-colors">Examples</a>
          <Link to="/history" className="hover:text-foreground transition-colors">History</Link>
        </div>

        <Link to="/app" className={buttonVariants({ size: "sm" })}>
          Try it
        </Link>
      </nav>
    </header>
  );
}