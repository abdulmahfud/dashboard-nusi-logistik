import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type StatTone =
  | "blue"
  | "green"
  | "red"
  | "violet"
  | "orange"
  | "slate";

const TONE_CLASS: Record<StatTone, string> = {
  blue: "bg-blue-50 text-blue-600",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-rose-50 text-rose-600",
  violet: "bg-violet-50 text-violet-600",
  orange: "bg-orange-50 text-orange-500",
  slate: "bg-slate-100 text-slate-500",
};

type StatCardProps = {
  icon: LucideIcon;
  tone: StatTone;
  title: string;
  value: string;
  hint?: string;
  className?: string;
  /** Jika diisi, kartu menjadi tombol (dengan tanda panah) — mis. untuk menerapkan filter. */
  onClick?: () => void;
  /** Sorot kartu (mis. filter yang sedang aktif). Hanya berlaku bila `onClick` diisi. */
  active?: boolean;
};

/** Kartu ringkasan angka (ikon bulat + judul kecil + nilai besar + keterangan). */
export function StatCard({
  icon: Icon,
  tone,
  title,
  value,
  hint,
  className,
  onClick,
  active,
}: StatCardProps) {
  const body = (
    <>
      <span
        className={cn(
          "flex h-14 w-14 shrink-0 items-center justify-center rounded-full",
          TONE_CLASS[tone]
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-500">{title}</p>
        <p className="truncate text-2xl font-bold tabular-nums text-slate-900">
          {value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
      {onClick && (
        <ChevronRight
          className="h-4 w-4 shrink-0 text-slate-400"
          aria-hidden
        />
      )}
    </>
  );

  const base =
    "flex items-center gap-4 rounded-2xl border bg-white p-5 shadow-sm";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className={cn(
          base,
          "text-left transition-colors hover:bg-slate-50",
          active ? "border-blue-300 ring-2 ring-blue-100" : "border-slate-100",
          className
        )}
      >
        {body}
      </button>
    );
  }

  return <div className={cn(base, "border-slate-100", className)}>{body}</div>;
}
