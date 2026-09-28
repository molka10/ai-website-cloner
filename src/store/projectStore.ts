import { create } from "zustand";
import type { GenerateInput, GenerateResult, Status } from "@/types/project";
import { generateSite } from "@/services/api";

type Message = { role: "user" | "agent"; text: string };

type ProjectState = {
  status: Status;
  input: GenerateInput | null;
  result: GenerateResult | null;
  versions: string[];
  currentVersion: number;
  messages: Message[];
  error: string | null;
  generate: (input: GenerateInput) => Promise<void>;
  reset: () => void;
};

const initialState = {
  status: "idle" as Status,
  input: null,
  result: null,
  versions: [],
  currentVersion: -1,
  messages: [],
  error: null,
};

export const useProjectStore = create<ProjectState>((set) => ({
  ...initialState,

  generate: async (input) => {
    set({ ...initialState, status: "generating", input });
    try {
      const result = await generateSite(input);
      set({
        status: "ready",
        result,
        versions: [result.code.html],
        currentVersion: 0,
        messages: [
          {
            role: "agent",
            text: `Done! I found ${result.analysis.sections.length} sections and made ${result.improvements.length} improvements.`,
          },
        ],
      });
    } catch {
      set({ status: "error", error: "Something went wrong. Please try again." });
    }
  },

  reset: () => set(initialState),
}));