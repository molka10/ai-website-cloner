import { useEffect } from "react";

type Options = {
  enabled: boolean;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.closest(".monaco-editor") !== null
  );
}

export function useShortcuts({ enabled, onSave, onUndo, onRedo }: Options) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();

      if (key === "s") {
        e.preventDefault();
        onSave();
        return;
      }

      if (isTyping(e.target)) return;

      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        onRedo();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, onSave, onUndo, onRedo]);
}