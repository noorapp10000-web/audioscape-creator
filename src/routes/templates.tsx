import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Shell } from "@/components/Shell";
import { TemplateThumb } from "@/components/TemplateThumb";
import { store } from "@/lib/db";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Player templates · Quran Player Studio" },
      {
        name: "description",
        content: "Browse iPhone, Android, Spotify-inspired and Quran player designs and open any of them in the editor.",
      },
      { property: "og:title", content: "Player templates · Quran Player Studio" },
      { property: "og:description", content: "14 original animated audio-player designs, fully customisable." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const [cat, setCat] = useState<string>("All");
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    store.favTemplates().then(setFavs);
  }, []);

  const toggleFav = async (id: string) => {
    const next = favs.includes(id) ? favs.filter((f) => f !== id) : [...favs, id];
    setFavs(next);
    await store.saveFavTemplates(next);
  };

  const list = cat === "All" ? TEMPLATES : TEMPLATES.filter((t) => t.category === cat);

  return (
    <Shell>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader title="Templates" subtitle={`${TEMPLATES.length} original player designs — tap one to start.`} />

        <div className="mb-5 flex flex-wrap gap-2">
          {["All", ...TEMPLATE_CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={cn(
                "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition hover:text-foreground",
                cat === c && "border-primary/60 bg-primary/15 text-foreground",
              )}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {list.map((t) => (
            <div key={t.id} className="glass overflow-hidden rounded-2xl p-2">
              <div className="overflow-hidden rounded-xl bg-black/40">
                <TemplateThumb config={t.config} />
              </div>
              <div className="flex items-center gap-1 px-1 pt-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {t.category} · {t.config.aspect}
                  </p>
                </div>
                <button
                  aria-label="Favourite template"
                  onClick={() => toggleFav(t.id)}
                  className="grid size-8 place-items-center rounded-lg hover:bg-sidebar-accent"
                >
                  <Heart
                    className={cn("size-4", favs.includes(t.id) ? "fill-primary text-primary" : "text-muted-foreground")}
                  />
                </button>
              </div>
              <Button asChild size="sm" className="mt-2 mb-1 w-full">
                <Link to="/editor" search={{ template: t.id, project: undefined }}>
                  Use template
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}
