export type GenerateInput =
  | { kind: "url"; url: string }
  | { kind: "image"; file: File };

export type GenerateResult = {
  id: string;
  sourcePreview: string;
  analysis: {
    sections: string[];
    palette: string[];
    fonts: string[];
  };
  code: { html: string };
  improvements: string[];
};

export type RefineInput = {
  projectId: string;
  message: string;
  currentCode: string;
};

export type Status = "idle" | "generating" | "ready" | "refining" | "error";

export type Viewport = "desktop" | "tablet" | "mobile";