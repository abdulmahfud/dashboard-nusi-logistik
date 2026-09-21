"use client";

import { Check } from "lucide-react";
import type { CurrentStatus } from "@/types/tracking";
import { cn } from "@/lib/utils";
import {
  KIND_STYLE,
  chipCls,
  formatDateTimeLong,
  trackingKind,
  type TrackingKind,
} from "./tracking-ui";

interface CurrentStatusCardProps {
  currentStatus: CurrentStatus;
}

const STEPS = ["Diproses", "Dalam Perjalanan", "Terkirim"];

/** Langkah aktif (0..2) untuk indikator progres; null = tidak ditampilkan. */
function activeStep(kind: TrackingKind): number | null {
  switch (kind) {
    case "pending":
      return 0;
    case "transit":
    case "problem":
      return 1;
    case "delivered":
      return 2;
    default:
      return null;
  }
}

/** "proses_pengiriman" -> "Proses pengiriman" */
function prettyStatus(status: string | null): string {
  if (!status) return "N/A";
  const t = status.replace(/_/g, " ").trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const CurrentStatusCard: React.FC<CurrentStatusCardProps> = ({
  currentStatus,
}) => {
  const kind = trackingKind(currentStatus.status);
  const { icon: Icon, tile, pill } = KIND_STYLE[kind];
  const step = activeStep(kind);
  const isProblem = kind === "problem";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex flex-col gap-5 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-start gap-4">
          <span
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
              tile
            )}
          >
            <Icon className="h-7 w-7" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Status Terkini
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">
                {prettyStatus(currentStatus.status)}
              </h2>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium",
                  pill
                )}
              >
                {KIND_STYLE[kind].label}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {currentStatus.description || currentStatus.status || "N/A"}
            </p>
          </div>
        </div>

        <dl className="flex shrink-0 flex-wrap gap-x-8 gap-y-3 md:text-right">
          {currentStatus.datetime && (
            <div>
              <dt className="text-xs text-slate-500">Waktu Update</dt>
              <dd className="mt-1 text-sm font-semibold text-slate-900">
                {formatDateTimeLong(currentStatus.datetime)}
              </dd>
            </div>
          )}
          {currentStatus.code && (
            <div>
              <dt className="text-xs text-slate-500">Kode Status</dt>
              <dd className="mt-1">
                <span className={cn(chipCls, "font-mono")}>
                  {currentStatus.code}
                </span>
              </dd>
            </div>
          )}
        </dl>
      </div>

      {step !== null && (
        <ol
          className="grid grid-cols-3 border-t border-slate-100 bg-slate-50/60 px-5 py-4 md:px-6"
          aria-label="Progres pengiriman"
        >
          {STEPS.map((label, i) => {
            const done = i <= step;
            const current = i === step;
            const showCheck = done && !(current && kind !== "delivered");
            return (
              <li key={label} className="flex flex-col items-center gap-2">
                <div className="flex w-full items-center">
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      i === 0
                        ? "bg-transparent"
                        : done
                          ? "bg-blue-500"
                          : "bg-slate-200"
                    )}
                  />
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                      done
                        ? current && isProblem
                          ? "bg-rose-500 text-white"
                          : "bg-blue-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    {showCheck ? (
                      <Check className="h-4 w-4" aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span
                    className={cn(
                      "h-0.5 flex-1",
                      i === STEPS.length - 1
                        ? "bg-transparent"
                        : i < step
                          ? "bg-blue-500"
                          : "bg-slate-200"
                    )}
                  />
                </div>
                <span
                  className={cn(
                    "text-xs",
                    current
                      ? "font-semibold text-slate-900"
                      : done
                        ? "text-slate-700"
                        : "text-slate-400"
                  )}
                >
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
