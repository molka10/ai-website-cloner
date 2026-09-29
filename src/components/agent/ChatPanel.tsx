import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUp, LoaderCircle, Redo2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProjectStore } from "@/store/projectStore";

const SUGGESTIONS = ["Make the hero dark", "Add a pricing section", "Use a rounder font"];

export default function ChatPanel() {
  const { messages, status, versions, currentVersion, refine, undo, redo } = useProjectStore();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const busy = status === "refining";

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, busy]);

  function send(message: string) {
    const value = message.trim();
    if (!value || busy) return;
    setText("");
    refine(value);
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    send(text);
  }

  return (
    <aside className="flex min-h-0 flex-col rounded-xl border">
      <div className="flex items-center justify-between border-b px-3 py-2">
        <p className="text-sm font-medium">
          Version {currentVersion + 1} of {versions.length}
        </p>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={undo} disabled={busy || currentVersion <= 0} aria-label="Undo">
            <Undo2 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={busy || currentVersion >= versions.length - 1}
            aria-label="Redo"
          >
            <Redo2 className="size-4" />
          </Button>
        </div>
      </div>

      <div ref={listRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
              m.role === "user" ? "self-end bg-primary text-primary-foreground" : "self-start bg-muted"
            }`}
          >
            {m.text}
          </div>
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Updating the design…
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 px-3 pb-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => send(s)}
            disabled={busy}
            className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 border-t p-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask for a change…"
          disabled={busy}
          aria-label="Change request"
        />
        <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Send">
          <ArrowUp className="size-4" />
        </Button>
      </form>
    </aside>
  );
}