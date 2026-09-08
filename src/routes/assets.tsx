import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Music, Trash2, Upload as UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, Shell } from "@/components/Shell";
import { store, uid } from "@/lib/db";
import { fileToDataUrl } from "@/lib/audio";
import type { Asset } from "@/lib/types";
import { cn } from "@/lib/utils";

const KINDS = ["all", "audio", "cover", "logo", "background"] as const;

export const Route = createFileRoute("/assets")({
  head: () => ({
    meta: [
      { title: "My assets · Quran Player Studio" },
      { name: "description", content: "Store recitation audio, cover art, logos and backgrounds to reuse in any project." },
      { property: "og:title", content: "My assets · Quran Player Studio" },
      { property: "og:description", content: "Your reusable audio and image library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [kind, setKind] = useState<(typeof KINDS)[number]>("all");
  const [uploadKind, setUploadKind] = useState<Asset["kind"]>("cover");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    store.assets().then(setAssets);
  }, []);

  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    for (const f of Array.from(files)) {
      const url = await fileToDataUrl(f);
      await store.addAsset({ id: uid(), kind: uploadKind, name: f.name, url, createdAt: Date.now() });
    }
    setAssets(await store.assets());
    toast.success("Added to your assets");
  };

  const remove = async (id: string) => {
    await store.saveAssets((await store.assets()).filter((a) => a.id !== id));
    setAssets(await store.assets());
  };

  const list = kind === "all" ? assets : assets.filter((a) => a.kind === kind);

  return (
    <Shell>
      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <PageHeader
          title="My assets"
          subtitle="Audio, covers, logos and backgrounds saved on this device."
          action={
            <div className="flex items-center gap-2">
              <select
                value={uploadKind}
                onChange={(e) => setUploadKind(e.target.value as Asset["kind"])}
                className="h-9 rounded-lg border border-border bg-card px-2 text-sm"
              >
                <option value="cover">Cover</option>
                <option value="logo">Logo</option>
                <option value="background">Background</option>
                <option value="audio">Audio</option>
              </select>
              <Button onClick={() => input.current?.click()}>
                <UploadIcon className="size-4" /> Upload
              </Button>
              <input
                ref={input}
                type="file"
                multiple
                accept={uploadKind === "audio" ? "audio/*" : "image/*"}
                className="hidden"
                onChange={(e) => add(e.target.files)}
              />
            </div>
          }
        />

        <div className="mb-5 flex flex-wrap gap-2">
          {KINDS.map((k) => (
            <button
              key={k}
              onClick={() => setKind(k)}
              className={cn(
                "rounded-full border border-border px-3 py-1.5 text-xs capitalize text-muted-foreground transition hover:text-foreground",
                kind === k && "border-primary/60 bg-primary/15 text-foreground",
              )}
            >
              {k}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing here yet — upload your first file.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {list.map((a) => (
              <div key={a.id} className="glass overflow-hidden rounded-2xl p-2">
                <div className="grid aspect-square place-items-center overflow-hidden rounded-xl bg-black/40">
                  {a.kind === "audio" ? (
                    <Music className="size-8 text-primary" />
                  ) : (
                    <img src={a.url} alt={a.name} className="size-full object-cover" />
                  )}
                </div>
                {a.kind === "audio" && <audio src={a.url} controls className="mt-2 w-full" />}
                <div className="flex items-center gap-1 px-1 pt-2 pb-1">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{a.name}</p>
                    <p className="text-[10px] capitalize text-muted-foreground">{a.kind}</p>
                  </div>
                  <button
                    aria-label="Delete asset"
                    onClick={() => remove(a.id)}
                    className="grid size-7 place-items-center rounded-md hover:bg-sidebar-accent"
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
