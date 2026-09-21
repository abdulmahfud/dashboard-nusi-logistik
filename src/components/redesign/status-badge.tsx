import { CheckCircle2, CircleHelp, Clock, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type Tone = "success" | "pending" | "failed" | "neutral";

const TONE_CLASS: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-rose-50 text-rose-700",
  neutral: "bg-slate-100 text-slate-600",
};

const TONE_ICON: Record<Tone, LucideIcon> = {
  success: CheckCircle2,
  pending: Clock,
  failed: XCircle,
  neutral: CircleHelp,
};

function resolveTone(status: string): Tone {
  const s = status.trim().toLowerCase();
  if (["success", "paid", "approved", "completed", "settled"].includes(s))
    return "success";
  if (["pending", "waiting", "processing"].includes(s)) return "pending";
  if (["failed", "expired", "rejected", "cancelled", "canceled"].includes(s))
    return "failed";
  return "neutral";
}

function capitalize(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

type StatusBadgeProps = {
  status: string | null | undefined;
  /** Teks yang ditampilkan; default: status dengan huruf awal kapital. */
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  if (!status) return <span className="text-slate-400">—</span>;
  const tone = resolveTone(status);
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_CLASS[tone],
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label ?? capitalize(status)}
    </span>
  );
}
