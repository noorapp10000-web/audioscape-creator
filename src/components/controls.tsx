import type { ReactNode } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-panel p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function Num({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[13px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground/90">
          {Math.round(value * 100) / 100}
          {suffix}
        </span>
      </div>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} />
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <Label className="text-[13px] font-normal text-muted-foreground">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function Text({
  label,
  value,
  onChange,
  rtl,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rtl?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-normal text-muted-foreground">{label}</Label>
      {multiline ? (
        <textarea
          dir={rtl ? "rtl" : "ltr"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className={cn(
            "w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40",
            rtl && "font-arabic text-right text-base leading-loose",
          )}
        />
      ) : (
        <Input dir={rtl ? "rtl" : "ltr"} value={value} onChange={(e) => onChange(e.target.value)} className={cn(rtl && "font-arabic text-right")} />
      )}
    </div>
  );
}

export function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[] | { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const opts = (options as (T | { value: T; label: string })[]).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div className="space-y-1.5">
      <Label className="text-[13px] font-normal text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {opts.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const hex = value.startsWith("#") ? value.slice(0, 7) : "#ffffff";
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
        className="size-9 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5"
        aria-label={label}
      />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[12px] text-muted-foreground">{label}</div>
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-7 px-2 text-[12px]" />
      </div>
    </div>
  );
}

export function Upload({
  label,
  accept,
  onFile,
  hint,
}: {
  label: string;
  accept: string;
  onFile: (f: File) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border bg-background/60 px-4 py-6 text-center transition-colors hover:border-primary/60 hover:bg-elevated">
      <span className="text-sm font-medium">{label}</span>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.currentTarget.value = "";
        }}
      />
    </label>
  );
}
