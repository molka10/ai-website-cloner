import { Link } from "react-router";
import { buttonVariants } from "@/components/ui/button";
import ThemeToggle from "@/components/layout/ThemeToggle";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-sm text-primary-foreground">R</span>
          ReSite
        </Link>

        <div className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="/#how" className="transition-colors hover:text-foreground">How it works</a>
          <a href="/#examples" className="transition-colors hover:text-foreground">Examples</a>
          <Link to="/history" className="transition-colors hover:text-foreground">History</Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link to="/app" className={buttonVariants({ size: "sm" })}>
            Try it
          </Link>
        </div>
      </nav>
    </header>
  );
}