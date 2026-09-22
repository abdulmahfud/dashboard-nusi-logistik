import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type InlineStatTone =
  | "blue"
  | "green"
  | "red"
  | "violet"
  | "orange"
  | "amber"
  | "slate";

const TONE_CLASS: Record<InlineStatTone, string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  orange: "bg-orange-50 text-orange-500",
  amber: "bg-amber-50 text-amber-600",
  slate: "bg-slate-100 text-slate-500",
};

/** Kartu mini (ikon bulat + label + nilai) untuk grid ringkasan status di dashboard. */
export function InlineStat({
  icon: Icon,
  tone,
  label,
  value,
  loading,
}: {
  icon: LucideIcon;
  tone: InlineStatTone;
  label: string;
  value: number;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          TONE_CLASS[tone]
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-slate-500">{label}</p>
        <p className="text-lg font-bold tabular-nums text-slate-900">
          {loading ? "…" : value.toLocaleString("id-ID")}
        </p>
      </div>
    </div>
  );
}
