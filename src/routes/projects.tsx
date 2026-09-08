import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Plus, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, Shell } from "@/components/Shell";
import { TemplateThumb } from "@/components/TemplateThumb";
import { store, uid } from "@/lib/db";
import { DEMO_PROJECTS, newProject } from "@/lib/project";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "My projects · Quran Player Studio" },
      { name: "description", content: "Open, duplicate or delete your saved Quran player video projects." },
      { property: "og:title", content: "My projects · Quran Player Studio" },
      { property: "og:description", content: "All your saved player designs in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const p = await store.projects();
      if (p.length === 0) {
        await store.saveProjects(DEMO_PROJECTS);
        setProjects(DEMO_PROJECTS);
      } else setProjects(p);
    })();
  }, []);

  const refresh = async () => setProjects(await store.projects());

  const remove = async (id: string) => {
    await store.deleteProject(id);
    await refresh();
    toast.success("Project deleted");
  };

  const duplicate = async (p: Project) => {
    await store.upsertProject({ ...structuredClone(p), id: uid(), name: `${p.name} copy`, updatedAt: Date.now() });
    await refresh();
    toast.success("Project duplicated");
  };

  const fav = async (p: Project) => {
    await store.upsertProject({ ...p, favorite: !p.favorite });
    await refresh();
  };

  const create = async () => {
    const p = newProject();
    await store.upsertProject(p);
    navigate({ to: "/editor", search: { project: p.id, template: undefined } });
  };

  const list = projects.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="My projects"
          subtitle="Saved on this device."
          action={
            <Button onClick={create}>
              <Plus className="size-4" /> New project
            </Button>
          }
        />

        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search projects…"
          className="mb-5 max-w-sm"
        />

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">No projects found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.map((p) => (
              <div key={p.id} className="glass overflow-hidden rounded-2xl p-2">
                <Link
                  to="/editor"
                  search={{ project: p.id, template: undefined }}
                  className="block overflow-hidden rounded-xl bg-black/40"
                >
                  <TemplateThumb config={p.config} />
                </Link>
                <div className="px-1 pt-2">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(p.updatedAt).toLocaleString()} · {p.quality}p · {p.fps}fps
                  </p>
                </div>
                <div className="mt-2 mb-1 flex gap-1">
                  <Button asChild size="sm" className="flex-1">
                    <Link to="/editor" search={{ project: p.id, template: undefined }}>
                      Open
                    </Link>
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Favourite" onClick={() => fav(p)}>
                    <Star className={cn("size-4", p.favorite && "fill-primary text-primary")} />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Duplicate" onClick={() => duplicate(p)}>
                    <Copy className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => remove(p.id)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
