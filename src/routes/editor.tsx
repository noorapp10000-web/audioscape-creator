import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Loader2,
  Pause,
  Play,
  Redo2,
  Save,
  Undo2,
  Move,
  Grid3x3,
  Trash2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Shell } from "@/components/Shell";
import { PlayerStage, useImage, type LayerKey } from "@/components/PlayerStage";
import { Choice, ColorField, Num, Section, Text as TextField, Toggle, Upload } from "@/components/controls";
import { analyzeAudio, fileToDataUrl, fmtTime } from "@/lib/audio";
import { store, uid } from "@/lib/db";
import { downloadBlob, exportVideo, pickMime } from "@/lib/export";
import { newProject } from "@/lib/project";
import { TEMPLATES, getTemplate } from "@/lib/templates";
import {
  ARABIC_FONTS,
  ASPECTS,
  LATIN_FONTS,
  PALETTES,
  type Aspect,
  type Colors,
  type PlayerConfig,
  type Project,
  type TextLayer,
  type WaveStyle,
} from "@/lib/types";

export const Route = createFileRoute("/editor")({
  validateSearch: (s: Record<string, unknown>) => ({
    project: typeof s.project === "string" ? s.project : undefined,
    template: typeof s.template === "string" ? s.template : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Video Editor · Quran Player Studio" },
      { name: "description", content: "Upload audio, pick a player template, customise every element and export an MP4 video." },
      { property: "og:title", content: "Video Editor · Quran Player Studio" },
      { property: "og:description", content: "Design a music-player style Quran video and export it in minutes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditorPage,
});

function useHistory<T>(initial: T) {
  const [state, setState] = useState<T>(initial);
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  const [, tick] = useState(0);

  const set = useCallback((updater: T | ((prev: T) => T), record = true) => {
    setState((prev) => {
      const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
      if (record) {
        past.current.push(prev);
        if (past.current.length > 80) past.current.shift();
        future.current = [];
      }
      return next;
    });
    tick((n) => n + 1);
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev) return;
    setState((cur) => {
      future.current.push(cur);
      return prev;
    });
    tick((n) => n + 1);
  }, []);

  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next) return;
    setState((cur) => {
      past.current.push(cur);
      return next;
    });
    tick((n) => n + 1);
  }, []);

  const reset = useCallback((v: T) => {
    past.current = [];
    future.current = [];
    setState(v);
    tick((n) => n + 1);
  }, []);

  return { state, set, undo, redo, reset, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}

const TEXT_KEYS = ["title", "subtitle", "reciter", "verse"] as const;
type TextKey = (typeof TEXT_KEYS)[number];

function EditorPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { state: project, set, undo, redo, reset, canUndo, canRedo } = useHistory<Project>(
    useMemo(() => newProject(search.template ?? "cupertino"), []),
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [snap, setSnap] = useState(true);
  const [safeArea, setSafeArea] = useState(false);
  const [selected, setSelected] = useState<LayerKey | null>(null);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const cancelRef = useRef(false);
  const [analyzing, setAnalyzing] = useState(false);

  const cover = useImage(project.coverUrl);
  const logo = useImage(project.logoUrl);
  const bg = useImage(project.bgUrl);
  const duration = project.audio?.duration ?? 30;

  /* load existing project */
  useEffect(() => {
    if (!search.project) return;
    void store.projects().then((all) => {
      const p = all.find((x) => x.id === search.project);
      if (p) reset(p);
    });
  }, [search.project, reset]);

  /* audio element wiring */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setTime(a.currentTime);
    const onEnd = () => setPlaying(false);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => {
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
  }, [project.audio?.url]);

  /* smooth animation clock while playing */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => {
      const a = audioRef.current;
      if (a) setTime(a.currentTime);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  /* preview clock without audio, so animations are still visible */
  useEffect(() => {
    if (!playing || project.audio) return;
    const id = setInterval(() => setTime((t) => (t + 0.05 > duration ? 0 : t + 0.05)), 50);
    return () => clearInterval(id);
  }, [playing, project.audio, duration]);

  /* autosave */
  useEffect(() => {
    const id = setTimeout(() => {
      void store.upsertProject({ ...project, updatedAt: Date.now() });
    }, 1500);
    return () => clearTimeout(id);
  }, [project]);

  const patch = useCallback(
    <K extends keyof PlayerConfig>(k: K, p: Partial<PlayerConfig[K]>) =>
      set((prev) => ({ ...prev, config: { ...prev.config, [k]: { ...(prev.config[k] as object), ...p } } })),
    [set],
  );
  const patchColors = (p: Partial<Colors>) => patch("colors", p);

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (project.audio && a) {
      if (a.paused) {
        void a.play();
        setPlaying(true);
      } else {
        a.pause();
        setPlaying(false);
      }
    } else setPlaying((p) => !p);
  }, [project.audio]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (a) a.currentTime = t;
    setTime(t);
  }, []);

  const onMove = useCallback(
    (k: LayerKey, x: number, y: number) => {
      set((prev) => ({ ...prev, config: { ...prev.config, [k]: { ...(prev.config[k] as object), x, y } } }), false);
    },
    [set],
  );

  const handleAudio = async (f: File) => {
    setAnalyzing(true);
    try {
      const [url, info] = await Promise.all([fileToDataUrl(f), analyzeAudio(f)]);
      set((p) => ({ ...p, audio: { name: f.name, url, duration: info.duration, peaks: info.peaks } }));
      void store.addAsset({ id: uid(), kind: "audio", name: f.name, url, createdAt: Date.now() });
      setTime(0);
      toast.success(`Audio loaded · ${fmtTime(info.duration)}`);
    } catch {
      toast.error("Could not read that audio file.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImage = async (f: File, kind: "cover" | "logo" | "background") => {
    const url = await fileToDataUrl(f);
    set((p) => ({ ...p, ...(kind === "cover" ? { coverUrl: url } : kind === "logo" ? { logoUrl: url } : { bgUrl: url }) }));
    void store.addAsset({ id: uid(), kind, name: f.name, url, createdAt: Date.now() });
    if (kind === "background") patch("background", { type: "image" });
    toast.success(`${kind} updated`);
  };

  const applyTemplate = (id: string) => {
    const t = getTemplate(id);
    set((p) => {
      const cfg = structuredClone(t.config);
      // keep the user's own words when switching designs
      TEXT_KEYS.forEach((k) => {
        cfg[k] = { ...cfg[k], text: p.config[k].text };
      });
      cfg.aspect = p.config.aspect;
      return { ...p, templateId: id, config: cfg };
    });
    toast.success(`Template: ${t.name}`);
  };

  const doExport = async () => {
    if (!project.audio) {
      toast.error("Upload an audio file first — the video length comes from it.");
      return;
    }
    const a = audioRef.current;
    if (a) {
      a.pause();
      setPlaying(false);
    }
    setExporting(true);
    setProgress(0);
    cancelRef.current = false;
    try {
      const { blob, ext } = await exportVideo(
        project,
        { cover, logo, bg },
        setProgress,
        () => cancelRef.current,
      );
      if (cancelRef.current) {
        toast.info("Export cancelled");
        return;
      }
      downloadBlob(blob, `${project.name.replace(/[^\w\u0600-\u06FF -]/g, "") || "player"}.${ext}`);
      toast.success(`Video ready · ${(blob.size / 1e6).toFixed(1)} MB`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const layer = (k: TextKey) => project.config[k];
  const setLayer = (k: TextKey, p: Partial<TextLayer>) => patch(k, p as Partial<PlayerConfig[TextKey]>);

  return (
    <Shell>
      {project.audio && <audio ref={audioRef} src={project.audio.url} preload="auto" className="hidden" />}
      <div className="px-4 py-5 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Input
            value={project.name}
            onChange={(e) => set((p) => ({ ...p, name: e.target.value }))}
            className="h-9 w-44 sm:w-64"
          />
          <Badge variant="secondary" className="h-8 rounded-lg px-2 font-normal">
            {getTemplate(project.templateId).name}
          </Badge>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} aria-label="Undo">
              <Undo2 className="size-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} aria-label="Redo">
              <Redo2 className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void store.upsertProject({ ...project, updatedAt: Date.now() });
                toast.success("Project saved");
              }}
            >
              <Save className="size-4" /> Save
            </Button>
            <Button size="sm" onClick={doExport} disabled={exporting}>
              {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Export
            </Button>
          </div>
        </div>

        {exporting && (
          <div className="mb-4 rounded-2xl border border-border bg-panel p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>
                Rendering {project.quality}p · {project.fps} fps · {pickMime().ext.toUpperCase()}
              </span>
              <span className="tabular-nums">{Math.round(progress * 100)}%</span>
            </div>
            <Progress value={progress * 100} />
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => (cancelRef.current = true)}>
              Cancel
            </Button>
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          {/* preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-center rounded-3xl border border-border bg-panel/60 p-3">
              <PlayerStage
                project={project}
                time={time}
                duration={duration}
                playing={playing}
                cover={cover}
                logo={logo}
                bg={bg}
                editMode={editMode}
                selected={selected}
                onSelect={setSelected}
                onMove={onMove}
                onSeek={seek}
                onTogglePlay={togglePlay}
                showSafeArea={safeArea}
                snap={snap}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-panel p-3">
              <Button size="icon" onClick={togglePlay} aria-label="Play or pause">
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
              <span className="tabular-nums text-sm text-muted-foreground">
                {fmtTime(time)} / {project.config.timeline.remaining ? fmtTime(duration - time, true) : fmtTime(duration)}
              </span>
              <input
                type="range"
                min={0}
                max={duration}
                step={0.01}
                value={time}
                onChange={(e) => seek(Number(e.target.value))}
                className="h-1.5 min-w-32 flex-1 cursor-pointer accent-primary"
                aria-label="Seek"
              />
              <Button variant={editMode ? "default" : "outline"} size="sm" onClick={() => setEditMode((v) => !v)}>
                <Move className="size-4" /> {editMode ? "Editing layout" : "Move elements"}
              </Button>
              <Button variant={snap ? "secondary" : "outline"} size="icon" onClick={() => setSnap((v) => !v)} aria-label="Snap to grid">
                <Grid3x3 className="size-4" />
              </Button>
              <Button variant={safeArea ? "secondary" : "outline"} size="sm" onClick={() => setSafeArea((v) => !v)}>
                Safe area
              </Button>
            </div>
            {editMode && (
              <p className="text-xs text-muted-foreground">
                Drag any element in the preview to reposition it{selected ? ` · selected: ${selected}` : ""}. Turn moving off to use
                the player (tap to play, drag the bar to seek).
              </p>
            )}
          </div>

          {/* panels */}
          <div className="lg:max-h-[calc(100vh-160px)] lg:overflow-y-auto lg:pr-1">
            <Tabs defaultValue="audio">
              <TabsList className="mb-3 flex h-auto w-full flex-wrap justify-start gap-1 bg-transparent p-0">
                {["audio", "design", "cover", "text", "colors", "wave", "timing", "verses", "export"].map((t) => (
                  <TabsTrigger key={t} value={t} className="rounded-lg border border-border bg-panel px-3 py-1.5 text-xs capitalize">
                    {t}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* AUDIO */}
              <TabsContent value="audio" className="space-y-3">
                <Section title="Audio track">
                  <Upload
                    label={analyzing ? "Analysing audio…" : project.audio ? "Replace audio file" : "Upload audio"}
                    hint="MP3 · WAV · M4A · AAC · OGG"
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
                    onFile={(f) => void handleAudio(f)}
                  />
                  {project.audio && (
                    <div className="rounded-xl bg-background/60 p-3 text-sm">
                      <p className="truncate font-medium">{project.audio.name}</p>
                      <p className="text-muted-foreground">
                        Duration {fmtTime(project.audio.duration)} · {project.audio.peaks.length} waveform samples
                      </p>
                    </div>
                  )}
                </Section>
                <Section title="Canvas">
                  <Choice
                    label="Aspect ratio"
                    value={project.config.aspect}
                    options={(Object.keys(ASPECTS) as Aspect[]).map((a) => ({ value: a, label: `${a} · ${ASPECTS[a].label}` }))}
                    onChange={(v) => set((p) => ({ ...p, config: { ...p.config, aspect: v } }))}
                  />
                </Section>
                <Section title="Logo / avatar">
                  <Upload label="Upload logo" hint="PNG · JPG · WEBP" accept="image/*" onFile={(f) => void handleImage(f, "logo")} />
                  <Toggle label="Show logo" checked={project.config.logo.show} onChange={(v) => patch("logo", { show: v })} />
                  <Num label="Size" value={project.config.logo.size} min={0.03} max={0.35} step={0.005} onChange={(v) => patch("logo", { size: v })} />
                  <Num label="Opacity" value={project.config.logo.opacity} min={0} max={1} step={0.05} onChange={(v) => patch("logo", { opacity: v })} />
                  <Num label="Glow" value={project.config.logo.glow} min={0} max={1} step={0.05} onChange={(v) => patch("logo", { glow: v })} />
                  <Toggle label="Circular mask" checked={project.config.logo.round} onChange={(v) => patch("logo", { round: v })} />
                  <Choice
                    label="Position preset"
                    value="custom"
                    options={[
                      { value: "custom", label: "Custom (drag in preview)" },
                      { value: "tl", label: "Top left" },
                      { value: "tc", label: "Top center" },
                      { value: "tr", label: "Top right" },
                      { value: "bl", label: "Bottom left" },
                      { value: "bc", label: "Bottom center" },
                      { value: "br", label: "Bottom right" },
                    ]}
                    onChange={(v) => {
                      const map: Record<string, [number, number]> = {
                        tl: [0.12, 0.07],
                        tc: [0.5, 0.07],
                        tr: [0.88, 0.07],
                        bl: [0.12, 0.95],
                        bc: [0.5, 0.95],
                        br: [0.88, 0.95],
                      };
                      const pos = map[v];
                      if (pos) patch("logo", { x: pos[0], y: pos[1] });
                    }}
                  />
                  <Choice label="Logo animation" value={project.config.logo.anim} options={["none", "fade", "pulse", "float"] as const} onChange={(v) => patch("logo", { anim: v })} />
                </Section>
              </TabsContent>

              {/* DESIGN / TEMPLATES + BACKGROUND + ELEMENTS */}
              <TabsContent value="design" className="space-y-3">
                <Section title="Template">
                  <div className="grid grid-cols-2 gap-2">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t.id)}
                        className={`rounded-xl border p-2 text-left text-xs transition-colors ${
                          project.templateId === t.id ? "border-primary bg-elevated" : "border-border hover:bg-elevated"
                        }`}
                      >
                        <span className="block font-medium">{t.name}</span>
                        <span className="text-muted-foreground">{t.category}</span>
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => applyTemplate(project.templateId)}>
                    <RotateCcw className="size-4" /> Reset template
                  </Button>
                </Section>
                <Section title="Background">
                  <Choice
                    label="Type"
                    value={project.config.background.type}
                    options={[
                      { value: "solid", label: "Solid colour" },
                      { value: "gradient", label: "Gradient" },
                      { value: "animatedGradient", label: "Animated gradient" },
                      { value: "coverBlur", label: "Blurred cover" },
                      { value: "image", label: "Uploaded image" },
                    ]}
                    onChange={(v) => patch("background", { type: v })}
                  />
                  <Upload label="Upload background" hint="PNG · JPG · WEBP" accept="image/*" onFile={(f) => void handleImage(f, "background")} />
                  <Num label="Blur" value={project.config.background.blur} min={0} max={160} onChange={(v) => patch("background", { blur: v })} />
                  <Num label="Brightness" value={project.config.background.brightness} min={0.1} max={1.6} step={0.05} onChange={(v) => patch("background", { brightness: v })} />
                  <Num label="Saturation" value={project.config.background.saturation} min={0} max={2.5} step={0.05} onChange={(v) => patch("background", { saturation: v })} />
                  <Num label="Overlay" value={project.config.background.overlay} min={0} max={0.9} step={0.05} onChange={(v) => patch("background", { overlay: v })} />
                  <Num label="Vignette" value={project.config.background.vignette} min={0} max={1} step={0.05} onChange={(v) => patch("background", { vignette: v })} />
                  <Toggle label="Islamic geometric pattern" checked={project.config.background.pattern} onChange={(v) => patch("background", { pattern: v })} />
                  <Toggle label="Particles / bokeh" checked={project.config.background.particles} onChange={(v) => patch("background", { particles: v })} />
                  <Choice label="Motion" value={project.config.background.anim} options={["none", "zoom", "kenburns", "moving"] as const} onChange={(v) => patch("background", { anim: v })} />
                </Section>
                <Section title="Elements on / off">
                  <Toggle label="Glass card" checked={project.config.card.show} onChange={(v) => patch("card", { show: v })} />
                  <Toggle label="Cover" checked={project.config.cover.show} onChange={(v) => patch("cover", { show: v })} />
                  <Toggle label="Logo" checked={project.config.logo.show} onChange={(v) => patch("logo", { show: v })} />
                  <Toggle label="Title" checked={project.config.title.show} onChange={(v) => patch("title", { show: v })} />
                  <Toggle label="Subtitle" checked={project.config.subtitle.show} onChange={(v) => patch("subtitle", { show: v })} />
                  <Toggle label="Reciter / artist" checked={project.config.reciter.show} onChange={(v) => patch("reciter", { show: v })} />
                  <Toggle label="Verse / lyrics" checked={project.config.verse.show} onChange={(v) => patch("verse", { show: v })} />
                  <Toggle label="Progress bar" checked={project.config.timeline.show} onChange={(v) => patch("timeline", { show: v })} />
                  <Toggle label="Times" checked={project.config.timeline.showTimes} onChange={(v) => patch("timeline", { showTimes: v })} />
                  <Toggle label="Player buttons" checked={project.config.controls.show} onChange={(v) => patch("controls", { show: v })} />
                  <Toggle label="Previous / next" checked={project.config.controls.prevNext} onChange={(v) => patch("controls", { prevNext: v })} />
                  <Toggle label="Volume icon" checked={project.config.controls.volume} onChange={(v) => patch("controls", { volume: v })} />
                  <Toggle label="Heart icon" checked={project.config.controls.heart} onChange={(v) => patch("controls", { heart: v })} />
                  <Toggle label="Waveform" checked={project.config.waveform.show} onChange={(v) => patch("waveform", { show: v })} />
                </Section>
              </TabsContent>

              {/* COVER */}
              <TabsContent value="cover" className="space-y-3">
                <Section title="Cover artwork">
                  <Upload label="Upload cover image" hint="PNG · JPG · JPEG · WEBP" accept="image/*" onFile={(f) => void handleImage(f, "cover")} />
                  <Choice label="Shape" value={project.config.cover.shape} options={["square", "rounded", "circle"] as const} onChange={(v) => patch("cover", { shape: v })} />
                  <Num label="Size" value={project.config.cover.size} min={0.2} max={1} step={0.01} onChange={(v) => patch("cover", { size: v })} />
                  <Num label="Corner radius" value={project.config.cover.radius} min={0} max={120} onChange={(v) => patch("cover", { radius: v })} />
                  <Num label="Rotation" value={project.config.cover.rotate} min={-45} max={45} onChange={(v) => patch("cover", { rotate: v })} suffix="°" />
                  <Num label="Zoom / crop" value={project.config.cover.zoom} min={1} max={2.5} step={0.05} onChange={(v) => patch("cover", { zoom: v })} />
                  <Num label="Opacity" value={project.config.cover.opacity} min={0.1} max={1} step={0.05} onChange={(v) => patch("cover", { opacity: v })} />
                  <Num label="Shadow" value={project.config.cover.shadow} min={0} max={1} step={0.05} onChange={(v) => patch("cover", { shadow: v })} />
                  <Num label="Glow" value={project.config.cover.glow} min={0} max={1} step={0.05} onChange={(v) => patch("cover", { glow: v })} />
                  <Num label="Border width" value={project.config.cover.border} min={0} max={16} onChange={(v) => patch("cover", { border: v })} />
                  <Choice label="Animation" value={project.config.cover.anim} options={["none", "zoom", "pulse", "rotate", "float", "glow"] as const} onChange={(v) => patch("cover", { anim: v })} />
                </Section>
                <Section title="Glass card">
                  <Toggle label="Show card" checked={project.config.card.show} onChange={(v) => patch("card", { show: v })} />
                  <Num label="Width" value={project.config.card.w} min={0.4} max={1} step={0.01} onChange={(v) => patch("card", { w: v })} />
                  <Num label="Height" value={project.config.card.h} min={0.2} max={1} step={0.01} onChange={(v) => patch("card", { h: v })} />
                  <Num label="Radius" value={project.config.card.radius} min={0} max={120} onChange={(v) => patch("card", { radius: v })} />
                  <Num label="Opacity" value={project.config.card.opacity} min={0} max={0.6} step={0.01} onChange={(v) => patch("card", { opacity: v })} />
                </Section>
              </TabsContent>

              {/* TEXT */}
              <TabsContent value="text" className="space-y-3">
                {TEXT_KEYS.map((k) => (
                  <Section key={k} title={k === "verse" ? "Verse / lyrics text" : k}>
                    <Toggle label="Visible" checked={layer(k).show} onChange={(v) => setLayer(k, { show: v })} />
                    <TextField
                      label="Content"
                      value={layer(k).text}
                      rtl={layer(k).rtl}
                      multiline={k === "verse"}
                      onChange={(v) => setLayer(k, { text: v })}
                    />
                    <Choice
                      label="Font"
                      value={layer(k).font}
                      options={[...LATIN_FONTS, ...ARABIC_FONTS]}
                      onChange={(v) => setLayer(k, { font: v })}
                    />
                    <Toggle label="Arabic / RTL" checked={layer(k).rtl} onChange={(v) => setLayer(k, { rtl: v })} />
                    <Num label="Size" value={layer(k).size} min={14} max={140} onChange={(v) => setLayer(k, { size: v })} />
                    <Num label="Weight" value={layer(k).weight} min={300} max={900} step={100} onChange={(v) => setLayer(k, { weight: v })} />
                    <Num label="Letter spacing" value={layer(k).letter} min={-4} max={16} step={0.5} onChange={(v) => setLayer(k, { letter: v })} />
                    <Num label="Line height" value={layer(k).lineHeight} min={1} max={2.4} step={0.05} onChange={(v) => setLayer(k, { lineHeight: v })} />
                    <Num label="Max width" value={layer(k).maxWidth} min={0.2} max={1} step={0.02} onChange={(v) => setLayer(k, { maxWidth: v })} />
                    <Num label="Max lines" value={layer(k).maxLines} min={1} max={6} onChange={(v) => setLayer(k, { maxLines: v })} />
                    <Num label="Opacity" value={layer(k).opacity} min={0.1} max={1} step={0.05} onChange={(v) => setLayer(k, { opacity: v })} />
                    <Num label="Glow" value={layer(k).glow} min={0} max={1} step={0.05} onChange={(v) => setLayer(k, { glow: v })} />
                    <Num label="Shadow" value={layer(k).shadow} min={0} max={1} step={0.05} onChange={(v) => setLayer(k, { shadow: v })} />
                    <Choice label="Alignment" value={layer(k).align} options={["left", "center", "right"] as const} onChange={(v) => setLayer(k, { align: v })} />
                    <Choice label="Animation" value={layer(k).anim} options={["none", "fade", "slideUp", "slideDown", "typewriter"] as const} onChange={(v) => setLayer(k, { anim: v })} />
                    <ColorField label="Colour" value={layer(k).color || "#ffffff"} onChange={(v) => setLayer(k, { color: v })} />
                  </Section>
                ))}
              </TabsContent>

              {/* COLORS */}
              <TabsContent value="colors" className="space-y-3">
                <Section title="Preset palettes">
                  <div className="grid grid-cols-2 gap-2">
                    {PALETTES.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => patchColors(p.colors)}
                        className="flex items-center gap-2 rounded-xl border border-border p-2 text-left text-xs hover:bg-elevated"
                      >
                        <span className="flex gap-1">
                          {[p.colors.bg, p.colors.bg2, p.colors.accent].map((c, i) => (
                            <span key={i} className="size-4 rounded-full border border-border" style={{ background: c }} />
                          ))}
                        </span>
                        {p.name}
                      </button>
                    ))}
                  </div>
                </Section>
                <Section title="Colours">
                  {(Object.keys(project.config.colors) as (keyof Colors)[]).map((k) => (
                    <ColorField key={k} label={k} value={project.config.colors[k]} onChange={(v) => patchColors({ [k]: v } as Partial<Colors>)} />
                  ))}
                </Section>
              </TabsContent>

              {/* WAVE */}
              <TabsContent value="wave" className="space-y-3">
                <Section title="Waveform">
                  <Toggle label="Show waveform" checked={project.config.waveform.show} onChange={(v) => patch("waveform", { show: v })} />
                  <Choice
                    label="Style"
                    value={project.config.waveform.style}
                    options={["bars", "roundedBars", "line", "dots", "mirror", "circular", "minimal", "equalizer", "spectrum"] as WaveStyle[]}
                    onChange={(v) => patch("waveform", { style: v })}
                  />
                  <Num label="Bars" value={project.config.waveform.bars} min={8} max={160} onChange={(v) => patch("waveform", { bars: v })} />
                  <Num label="Bar width" value={project.config.waveform.barW} min={1} max={30} onChange={(v) => patch("waveform", { barW: v })} />
                  <Num label="Width" value={project.config.waveform.w} min={0.2} max={1} step={0.01} onChange={(v) => patch("waveform", { w: v })} />
                  <Num label="Height" value={project.config.waveform.h} min={0.01} max={0.3} step={0.005} onChange={(v) => patch("waveform", { h: v })} />
                  <Num label="Opacity" value={project.config.waveform.opacity} min={0.1} max={1} step={0.05} onChange={(v) => patch("waveform", { opacity: v })} />
                  <Num label="Animation speed" value={project.config.waveform.speed} min={0.2} max={3} step={0.1} onChange={(v) => patch("waveform", { speed: v })} />
                  <Num label="Smoothing" value={project.config.waveform.smoothing} min={0} max={1} step={0.05} onChange={(v) => patch("waveform", { smoothing: v })} />
                  <ColorField label="Waveform colour" value={project.config.colors.wave} onChange={(v) => patchColors({ wave: v })} />
                </Section>
              </TabsContent>

              {/* TIMING */}
              <TabsContent value="timing" className="space-y-3">
                <Section title="Progress bar & timer">
                  <Toggle label="Show progress bar" checked={project.config.timeline.show} onChange={(v) => patch("timeline", { show: v })} />
                  <Toggle label="Circular progress around cover" checked={project.config.timeline.circular} onChange={(v) => patch("timeline", { circular: v })} />
                  <Toggle label="Show times" checked={project.config.timeline.showTimes} onChange={(v) => patch("timeline", { showTimes: v })} />
                  <Toggle label="Remaining time mode (-00:49)" checked={project.config.timeline.remaining} onChange={(v) => patch("timeline", { remaining: v })} />
                  <Toggle label="Drag handle" checked={project.config.timeline.thumb} onChange={(v) => patch("timeline", { thumb: v })} />
                  <Num label="Bar width" value={project.config.timeline.w} min={0.2} max={1} step={0.01} onChange={(v) => patch("timeline", { w: v })} />
                  <Num label="Bar thickness" value={project.config.timeline.h} min={2} max={30} onChange={(v) => patch("timeline", { h: v })} />
                  <Num label="Time font size" value={project.config.timeline.timeSize} min={14} max={60} onChange={(v) => patch("timeline", { timeSize: v })} />
                  <ColorField label="Progress" value={project.config.colors.progress} onChange={(v) => patchColors({ progress: v })} />
                  <ColorField label="Progress track" value={project.config.colors.progressBg} onChange={(v) => patchColors({ progressBg: v })} />
                </Section>
                <Section title="Player buttons">
                  <Num label="Button size" value={project.config.controls.size} min={0.03} max={0.16} step={0.005} onChange={(v) => patch("controls", { size: v })} />
                  <Num label="Gap" value={project.config.controls.gap} min={0.02} max={0.2} step={0.005} onChange={(v) => patch("controls", { gap: v })} />
                  <Toggle label="Filled play button" checked={project.config.controls.filled} onChange={(v) => patch("controls", { filled: v })} />
                </Section>
              </TabsContent>

              {/* VERSES */}
              <TabsContent value="verses" className="space-y-3">
                <Section title="Verse timing">
                  <Toggle label="Show verse layer" checked={project.config.verse.show} onChange={(v) => patch("verse", { show: v })} />
                  <p className="text-xs text-muted-foreground">
                    Add your own Arabic text and timings. The active verse is highlighted automatically during playback and export.
                  </p>
                  {project.verses.map((v, i) => (
                    <div key={v.id} className="space-y-2 rounded-xl border border-border bg-background/60 p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Verse {i + 1}</span>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => set((p) => ({ ...p, verses: p.verses.map((x) => (x.id === v.id ? { ...x, start: time } : x)) }))}>
                            Set start
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => set((p) => ({ ...p, verses: p.verses.map((x) => (x.id === v.id ? { ...x, end: time } : x)) }))}>
                            Set end
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => set((p) => ({ ...p, verses: p.verses.filter((x) => x.id !== v.id) }))}>
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                      <textarea
                        dir="rtl"
                        value={v.ar}
                        onChange={(e) => set((p) => ({ ...p, verses: p.verses.map((x) => (x.id === v.id ? { ...x, ar: e.target.value } : x)) }))}
                        rows={2}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 font-arabic text-base leading-loose"
                        placeholder="النص العربي"
                      />
                      <Input
                        value={v.tr}
                        onChange={(e) => set((p) => ({ ...p, verses: p.verses.map((x) => (x.id === v.id ? { ...x, tr: e.target.value } : x)) }))}
                        placeholder="Your own translation (optional)"
                      />
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          step="0.1"
                          value={v.start}
                          onChange={(e) => set((p) => ({ ...p, verses: p.verses.map((x) => (x.id === v.id ? { ...x, start: Number(e.target.value) } : x)) }))}
                        />
                        <Input
                          type="number"
                          step="0.1"
                          value={v.end}
                          onChange={(e) => set((p) => ({ ...p, verses: p.verses.map((x) => (x.id === v.id ? { ...x, end: Number(e.target.value) } : x)) }))}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      set((p) => ({
                        ...p,
                        verses: [...p.verses, { id: uid(), start: time, end: Math.min(duration, time + 8), ar: "", tr: "" }],
                      }))
                    }
                  >
                    <Plus className="size-4" /> Add verse
                  </Button>
                </Section>
              </TabsContent>

              {/* EXPORT */}
              <TabsContent value="export" className="space-y-3">
                <Section title="Export settings">
                  <Choice
                    label="Resolution"
                    value={String(project.quality) as "720" | "1080"}
                    options={[
                      { value: "720", label: "720p (fastest)" },
                      { value: "1080", label: "1080p (recommended)" },
                    ]}
                    onChange={(v) => set((p) => ({ ...p, quality: Number(v) as 720 | 1080 }))}
                  />
                  <Choice
                    label="Frame rate"
                    value={String(project.fps) as "30" | "60"}
                    options={[
                      { value: "30", label: "30 fps" },
                      { value: "60", label: "60 fps (smoother)" },
                    ]}
                    onChange={(v) => set((p) => ({ ...p, fps: Number(v) as 30 | 60 }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Output: {pickMime().ext.toUpperCase()} · AAC/Opus audio · length exactly {fmtTime(duration)}. Rendering runs at real
                    speed on your device, so a 1-minute track takes about a minute. Keep this tab open while it renders.
                  </p>
                  <Button className="w-full" onClick={doExport} disabled={exporting}>
                    {exporting ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />} Render & download
                  </Button>
                </Section>
                <Section title="Project">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const copy = { ...project, id: uid(), name: `${project.name} copy`, updatedAt: Date.now() };
                      void store.upsertProject(copy).then(() => {
                        toast.success("Project duplicated");
                        void navigate({ to: "/editor", search: { project: copy.id, template: undefined } });
                      });
                    }}
                  >
                    Duplicate project
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => reset({ ...newProject(project.templateId, project.name), audio: project.audio, coverUrl: project.coverUrl, logoUrl: project.logoUrl })}>
                    Reset all customisation
                  </Button>
                </Section>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Shell>
  );
}
