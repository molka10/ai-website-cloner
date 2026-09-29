import type { SavedProject } from "@/types/project";

const KEY = "resite-projects";

export function loadProjects(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function saveProject(project: SavedProject) {
  const others = loadProjects().filter((p) => p.id !== project.id);
  localStorage.setItem(KEY, JSON.stringify([project, ...others]));
}

export function deleteProject(id: string) {
  localStorage.setItem(KEY, JSON.stringify(loadProjects().filter((p) => p.id !== id)));
}