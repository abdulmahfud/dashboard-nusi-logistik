import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Info,
  Truck,
  XCircle,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** "17 April 2026 12.22" — tanggal & jam panjang bahasa Indonesia. */
export function formatDateTimeLong(value: string | null | undefined): string {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export type TrackingKind =
  | "delivered"
  | "transit"
  | "pending"
  | "problem"
  | "cancelled"
  | "unknown";

/** Menafsirkan teks status vendor/standar menjadi satu kategori tampilan. */
export function trackingKind(status: string | null | undefined): TrackingKind {
  if (!status) return "unknown";
  const s = status.toLowerCase();
  if (
    s.includes("sampai_tujuan") ||
    s.includes("delivered") ||
    s.includes("sukses")
  )
    return "delivered";
  if (
    s.includes("kendala") ||
    s.includes("problem") ||
    s.includes("failed")
  )
    return "problem";
  if (
    s.includes("proses_pengiriman") ||
    s.includes("in_transit") ||
    s.includes("on_delivery")
  )
    return "transit";
  if (
    s.includes("belum_proses") ||
    s.includes("pending") ||
    s.includes("belum_di_expedisi")
  )
    return "pending";
  if (s.includes("dibatalkan") || s.includes("cancel")) return "cancelled";
  return "unknown";
}

export const KIND_STYLE: Record<
  TrackingKind,
  { icon: LucideIcon; tile: string; pill: string; dot: string; label: string }
> = {
  delivered: {
    icon: CheckCircle2,
    tile: "bg-emerald-50 text-emerald-600",
    pill: "bg-emerald-50 text-emerald-700",
    dot: "bg-emerald-500",
    label: "Terkirim",
  },
  transit: {
    icon: Truck,
    tile: "bg-blue-50 text-blue-600",
    pill: "bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
    label: "Dalam perjalanan",
  },
  pending: {
    icon: Clock,
    tile: "bg-amber-50 text-amber-600",
    pill: "bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
    label: "Menunggu proses",
  },
  problem: {
    icon: AlertCircle,
    tile: "bg-rose-50 text-rose-600",
    pill: "bg-rose-50 text-rose-700",
    dot: "bg-rose-500",
    label: "Ada kendala",
  },
  cancelled: {
    icon: XCircle,
    tile: "bg-slate-100 text-slate-500",
    pill: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    label: "Dibatalkan",
  },
  unknown: {
    icon: Info,
    tile: "bg-slate-100 text-slate-500",
    pill: "bg-slate-100 text-slate-600",
    dot: "bg-slate-400",
    label: "Status",
  },
};

/** Kartu putih dengan header ikon (dipakai semua kartu hasil tracking). */
export function TrackCard({
  icon: Icon,
  title,
  tone = "bg-blue-50 text-blue-600",
  action,
  className,
  children,
}: {
  icon: LucideIcon;
  title: ReactNode;
  tone?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6",
        className
      )}
    >
      <header className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
              tone
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <h2 className="text-lg font-semibold leading-tight text-slate-900">
            {title}
          </h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

/** Satu pasang label kecil + nilai. */
export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-900">
        {children}
      </dd>
    </div>
  );
}

export const chipCls =
  "inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700";
