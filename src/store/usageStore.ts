import { create } from "zustand";
import { auth } from "@/lib/firebase";

type UsageState = {
  used: number | null;
  limit: number | null;
  set: (used: number, limit: number) => void;
  load: () => Promise<void>;
  clear: () => void;
};

export const useUsageStore = create<UsageState>((set) => ({
  used: null,
  limit: null,

  set: (used, limit) => set({ used, limit }),

  // Asks the server how many generations the user has used today.
  load: async () => {
    const user = auth?.currentUser;
    if (!user) return set({ used: null, limit: null });
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/usage", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return;
      const data = (await res.json()) as { used: number; limit: number };
      set({ used: data.used, limit: data.limit });
    } catch {
      // The counter is only a hint: if it fails, we simply don't show it.
    }
  },

  clear: () => set({ used: null, limit: null }),
}));