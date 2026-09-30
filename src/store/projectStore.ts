import { create } from "zustand";
import type { GenerateInput, GenerateResult, SavedProject, Status } from "@/types/project";
import { generateSite, refineSite } from "@/services/api";

type Message = { role: "user" | "agent"; text: string };

type ProjectState = {
  status: Status;
  name: string;
  input: GenerateInput | null;
  result: GenerateResult | null;
  versions: string[];
  currentVersion: number;
  messages: Message[];
  error: string | null;
  generate: (input: GenerateInput) => Promise<void>;
  refine: (message: string) => Promise<void>;
  updateCode: (html: string) => void;
  undo: () => void;
  redo: () => void;
  openProject: (project: SavedProject) => void;
  reset: () => void;
};

const initialState = {
  status: "idle" as Status,
  name: "",
  input: null,
  result: null,
  versions: [],
  currentVersion: -1,
  messages: [],
  error: null,
};

function nameFromInput(input: GenerateInput) {
  return input.kind === "url" ? new URL(input.url).hostname.replace(/\./g, "-") : "my-site";
}

function errorText(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  generate: async (input) => {
    set({ ...initialState, status: "generating", input, name: nameFromInput(input) });
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
            text: `Done! I found ${result.analysis.sections.length} sections and made ${result.improvements.length} improvements. Ask me for any change.`,
          },
        ],
      });
    } catch (e) {
      set({ status: "error", error: errorText(e) });
    }
  },

  refine: async (message) => {
    const { result, versions, currentVersion } = get();
    if (!result) return;

    set((s) => ({ status: "refining", messages: [...s.messages, { role: "user", text: message }] }));

    try {
      const next = await refineSite({
        projectId: result.id,
        message,
        currentCode: versions[currentVersion],
      });
      set((s) => {
        const kept = s.versions.slice(0, s.currentVersion + 1);
        const newVersions = [...kept, next.html];
        return {
          status: "ready",
          versions: newVersions,
          currentVersion: newVersions.length - 1,
          messages: [...s.messages, { role: "agent", text: `${next.summary} (version ${newVersions.length})` }],
        };
      });
    } catch (e) {
      set((s) => ({
        status: "ready",
        messages: [...s.messages, { role: "agent", text: `Sorry — ${errorText(e)}` }],
      }));
    }
  },

  updateCode: (html) =>
    set((s) => {
      const versions = [...s.versions];
      versions[s.currentVersion] = html;
      return { versions };
    }),

  undo: () => set((s) => ({ currentVersion: Math.max(0, s.currentVersion - 1) })),

  redo: () => set((s) => ({ currentVersion: Math.min(s.versions.length - 1, s.currentVersion + 1) })),

  openProject: (project) =>
    set({
      ...initialState,
      status: "ready",
      name: project.name,
      result: project.result,
      versions: [project.html],
      currentVersion: 0,
      messages: [{ role: "agent", text: `Opened "${project.name}". Ask me for any change.` }],
    }),

  reset: () => set(initialState),
}));