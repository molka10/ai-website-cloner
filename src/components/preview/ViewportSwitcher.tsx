import { Monitor, Smartphone, Tablet } from "lucide-react";
import type { Viewport } from "@/types/project";

const OPTIONS = [
  { value: "desktop" as Viewport, label: "Desktop", icon: Monitor },
  { value: "tablet" as Viewport, label: "Tablet", icon: Tablet },
  { value: "mobile" as Viewport, label: "Mobile", icon: Smartphone },
];

type Props = { value: Viewport; onChange: (v: Viewport) => void };

export default function ViewportSwitcher({ value, onChange }: Props) {
  return (
    <div className="flex rounded-lg border p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-label={opt.label}
          aria-pressed={value === opt.value}
          className={`grid size-8 place-items-center rounded-md transition-colors ${
            value === opt.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
          }`}
        >
          <opt.icon className="size-4" />
        </button>
      ))}
    </div>
  );
}