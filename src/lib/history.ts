import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SavedProject } from "@/types/project";

const KEY = "resite-projects";

function loadLocal(): SavedProject[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveLocal(projects: SavedProject[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(projects));
  } catch {
    // storage full or unavailable
  }
}

function projectsCollection(uid: string) {
  if (!db) throw new Error("Cloud saving isn't configured.");
  return collection(db, "users", uid, "projects");
}

function forCloud(project: SavedProject): SavedProject {
  return { ...project, result: { ...project.result, code: { html: "" } } };
}

export async function loadProjects(uid: string | null): Promise<SavedProject[]> {
  if (!uid) return loadLocal();
  const snapshot = await getDocs(query(projectsCollection(uid), orderBy("savedAt", "desc")));
  return snapshot.docs.map((d) => d.data() as SavedProject);
}

export async function saveProject(uid: string | null, project: SavedProject) {
  if (!uid) {
    saveLocal([project, ...loadLocal().filter((p) => p.id !== project.id)]);
    return;
  }
  await setDoc(doc(projectsCollection(uid), project.id), forCloud(project));
}

export async function deleteProject(uid: string | null, id: string) {
  if (!uid) {
    saveLocal(loadLocal().filter((p) => p.id !== id));
    return;
  }
  await deleteDoc(doc(projectsCollection(uid), id));
}