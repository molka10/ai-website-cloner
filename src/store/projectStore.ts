import { create } from "zustand";
import type { CapturedImage, GenerateInput, GenerateResult, SavedProject, Status } from "@/types/project";
import { checkSite, convertToReact, generateSite, refineSite, type CheckResult } from "@/services/api";
import { captureHtml, pixelSimilarity } from "@/lib/capture";

export const MAX_CHECK_ROUNDS = 2;

type Message = { role: "user" | "agent"; text: string };
type Stage = "generate" | "check" | "done";
type CheckOutcome = CheckResult & { pixelScore: number | null };
type ReactConversion = { html: string; code: string };

type ProjectState = {
  status: Status;
  name: string;
  input: GenerateInput | null;
  result: GenerateResult | null;
  original: CapturedImage | null;
  versions: string[];
  currentVersion: number;
  messages: Message[];
  error: string | null;
  stage: Stage;
  round: number;
  checkLog: string[];
  reactCode: ReactConversion | null;
  converting: boolean;
  generate: (input: GenerateInput) => Promise<void>;
  refine: (message: string) => Promise<void>;
  runCheck: () => Promise<void>;
  convertCurrentToReact: () => Promise<void>;
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
  original: null,
  versions: [],
  currentVersion: -1,
  messages: [],
  error: null,
  stage: "done" as Stage,
  round: 0,
  checkLog: [],
  reactCode: null,
  converting: false,
};

function nameFromInput(input: GenerateInput) {
  return input.kind === "url" ? new URL(input.url).hostname.replace(/\./g, "-") : "my-site";
}

function errorText(e: unknown) {
  return e instanceof Error ? e.message : "Something went wrong. Please try again.";
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

async function pixelScoreOf(original: CapturedImage, html: string): Promise<number | null> {
  try {
    const rebuilt = await captureHtml(html, original.width, original.height);
    return await pixelSimilarity(original.data, rebuilt, original.height / original.width);
  } catch {
    return null;
  }
}

async function checkOnce(original: CapturedImage, html: string): Promise<CheckOutcome> {
  const rebuilt = await captureHtml(html, original.width, original.height);
  const pixelScore = await pixelSimilarity(original.data, rebuilt, original.height / original.width).catch(() => null);
  const check = await checkSite(original.data, rebuilt, html);
  return { ...check, pixelScore };
}

function scores(check: CheckOutcome) {
  const pixels = check.pixelScore === null ? "" : ` · pixels ${check.pixelScore}%`;
  return `AI ${check.score}/100${pixels}`;
}

function describeCheck(round: number | null, check: CheckOutcome) {
  const prefix = round ? `Self-check round ${round}` : "Check";
  if (check.differences.length === 0) {
    return `${prefix} (${scores(check)}): nothing to fix.`;
  }
  return `${prefix} (${scores(check)}): fixed ${plural(check.differences.length, "difference")}: ${check.differences.slice(0, 3).join(" · ")}`;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  generate: async (input) => {
    set({ ...initialState, status: "generating", input, name: nameFromInput(input), stage: "generate" });

    let generated;
    try {
      generated = await generateSite(input);
    } catch (e) {
      set({ status: "error", error: errorText(e), stage: "done" });
      return;
    }

    const { result, original } = generated;
    let versions = [result.code.html];
    let firstPixelScore: number | null = null;
    const notes: Message[] = [
      {
        role: "agent",
        text: `Done! I found ${plural(result.analysis.sections.length, "section")} and made ${plural(result.improvements.length, "improvement")}.`,
      },
    ];

    set({ result, original, stage: "check" });

    for (let round = 1; round <= MAX_CHECK_ROUNDS; round++) {
      set({ round });
      const current = versions[versions.length - 1];
      try {
        const check = await checkOnce(original, current);
        if (round === 1) firstPixelScore = check.pixelScore;
        set((s) => ({ checkLog: [...s.checkLog, `Round ${round}: ${scores(check)}`] }));
        if (check.differences.length > 0 && check.html !== current) {
          versions = [...versions, check.html];
        }
        notes.push({ role: "agent", text: describeCheck(round, check) });
        if (check.differences.length === 0) break;
      } catch (e) {
        notes.push({ role: "agent", text: `Self-check skipped: ${errorText(e)}` });
        break;
      }
    }

    if (versions.length > 1 && firstPixelScore !== null) {
      const finalPixelScore = await pixelScoreOf(original, versions[versions.length - 1]);
      if (finalPixelScore !== null) {
        notes.push({
          role: "agent",
          text: `Pixel similarity: ${firstPixelScore}% before the self-check, ${finalPixelScore}% after.`,
        });
      }
    }

    notes.push({ role: "agent", text: "Ask me for any change, or use Undo to see earlier versions." });

    set({
      status: "ready",
      stage: "done",
      versions,
      currentVersion: versions.length - 1,
      messages: notes,
    });
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

  runCheck: async () => {
    const { original, versions, currentVersion } = get();
    if (!original) return;

    set((s) => ({ status: "refining", messages: [...s.messages, { role: "user", text: "Check again" }] }));

    try {
      const current = versions[currentVersion];
      const check = await checkOnce(original, current);
      set((s) => {
        const kept = s.versions.slice(0, s.currentVersion + 1);
        const changed = check.differences.length > 0 && check.html !== current;
        const newVersions = changed ? [...kept, check.html] : kept;
        return {
          status: "ready",
          versions: newVersions,
          currentVersion: newVersions.length - 1,
          messages: [...s.messages, { role: "agent", text: describeCheck(null, check) }],
        };
      });
    } catch (e) {
      set((s) => ({
        status: "ready",
        messages: [...s.messages, { role: "agent", text: `Sorry — ${errorText(e)}` }],
      }));
    }
  },

  convertCurrentToReact: async () => {
    const { versions, currentVersion, converting } = get();
    const html = versions[currentVersion];
    if (!html || converting) return;

    set({ converting: true });
    try {
      const code = await convertToReact(html);
      set({ reactCode: { html, code } });
    } catch (e) {
      set((s) => ({ messages: [...s.messages, { role: "agent", text: `Sorry — React conversion failed: ${errorText(e)}` }] }));
    } finally {
      set({ converting: false });
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