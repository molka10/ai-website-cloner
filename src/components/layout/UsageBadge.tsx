import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useUsageStore } from "@/store/usageStore";

export function UsageBadge() {
  const user = useAuthStore((s) => s.user);
  const used = useUsageStore((s) => s.used);
  const limit = useUsageStore((s) => s.limit);
  const load = useUsageStore((s) => s.load);
  const clear = useUsageStore((s) => s.clear);

  useEffect(() => {
    if (user) load();
    else clear();
  }, [user, load, clear]);

  if (!user || used === null || limit === null) return null;

  const left = Math.max(limit - used, 0);
  const color = left === 0 ? "border-red-500/40 text-red-500" : "text-muted-foreground";

  return (
    <span
      title="Generations left today"
      className={`hidden items-center rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex ${color}`}
    >
      {left} / {limit} left today
    </span>
  );
}