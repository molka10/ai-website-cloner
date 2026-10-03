import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Cloud, FolderOpen, HardDrive, LoaderCircle, Trash2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Button, buttonVariants } from "@/components/ui/button";
import { deleteProject, loadProjects } from "@/lib/history";
import { useAuthStore } from "@/store/authStore";
import { useProjectStore } from "@/store/projectStore";
import type { SavedProject } from "@/types/project";

export default function History() {
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const openProject = useProjectStore((s) => s.openProject);
  const navigate = useNavigate();

  const uid = user?.uid ?? null;
  const [projects, setProjects] = useState<SavedProject[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    loadProjects(uid)
      .then((list) => {
        if (!cancelled) {
          setProjects(list);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load your projects.");
      });
    return () => {
      cancelled = true;
    };
  }, [uid, authLoading]);

  function handleOpen(project: SavedProject) {
    openProject(project);
    navigate("/app");
  }

  async function handleDelete(id: string) {
    try {
      await deleteProject(uid, id);
      setProjects((list) => list?.filter((p) => p.id !== id) ?? null);
    } catch (e) {
      alert(`Could not delete: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">Your projects</h1>
        <p className="mt-2 flex items-center gap-2 text-muted-foreground">
          {user ? (
            <>
              <Cloud className="size-4" /> Synced with your Google account
            </>
          ) : (
            <>
              <HardDrive className="size-4" /> Saved in this browser. Sign in to keep your projects on every device.
            </>
          )}
        </p>

        {error && <p className="mt-6 text-destructive">{error}</p>}

        {projects === null && !error && (
          <div className="mt-12 flex items-center gap-2 text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            Loading your projects…
          </div>
        )}

        {projects !== null && projects.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-4 rounded-xl border border-dashed p-12 text-center">
            <p className="font-medium">No saved projects yet</p>
            <p className="text-sm text-muted-foreground">Generate a site, then click Save in the workspace.</p>
            <Link to="/app" className={buttonVariants()}>
              Rebuild a website
            </Link>
          </div>
        )}

        {projects !== null && projects.length > 0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => (
              <article key={p.id} className="overflow-hidden rounded-xl border">
                <div className="aspect-video overflow-hidden border-b bg-muted">
                  <iframe
                    title={`Preview of ${p.name}`}
                    srcDoc={p.html}
                    sandbox=""
                    tabIndex={-1}
                    scrolling="no"
                    className="pointer-events-none h-[400%] w-[400%] origin-top-left scale-25 bg-white"
                  />
                </div>
                <div className="flex flex-col gap-3 p-4">
                  <div>
                    <h2 className="font-semibold">{p.name}</h2>
                    <p className="text-xs text-muted-foreground">Saved {new Date(p.savedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1">
                    {p.result.analysis.palette.map((color) => (
                      <span key={color} className="size-4 rounded-full border" style={{ backgroundColor: color }} />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleOpen(p)}>
                      <FolderOpen className="size-4" />
                      Open
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(p.id)}
                      aria-label={`Delete ${p.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}