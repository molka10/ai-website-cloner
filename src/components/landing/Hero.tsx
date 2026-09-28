import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Hero() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const value = url.trim();
    if (!/^https?:\/\/.+\..+/.test(value)) {
      setError("Enter a full link, like https://example.com");
      return;
    }
    navigate(`/app?url=${encodeURIComponent(value)}`);
  }

  return (
    <section className="mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 py-24 text-center md:py-32">
      <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
        AI agent · link or screenshot → code
      </span>

      <h1 className="text-4xl font-bold tracking-tight text-balance md:text-6xl">
        Turn any website into clean code
      </h1>

      <p className="max-w-xl text-lg text-muted-foreground">
        Paste a link or drop a screenshot. The AI rebuilds it — responsive,
        accessible, ready to edit.
      </p>

      <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-2 sm:flex-row">
        <Input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError("");
          }}
          className="h-11"
          aria-label="Website link"
        />
        <Button type="submit" size="lg" className="h-11">
          Generate
        </Button>
      </form>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Link
        to="/app"
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        or upload a screenshot instead
      </Link>
    </section>
  );
}