import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
        Turn any website into clean code
      </h1>
      <p className="text-lg text-muted-foreground max-w-xl">
        Paste a link or drop a screenshot. The AI rebuilds it, better.
      </p>
      <Link to="/app">
        <Button size="lg">Try it</Button>
      </Link>
    </main>
  );
}