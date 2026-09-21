"use client";

import { ImageIcon, MapPin, Route, Truck, User } from "lucide-react";
import type { TrackingHistoryItem } from "@/types/tracking";
import { cn } from "@/lib/utils";
import {
  KIND_STYLE,
  TrackCard,
  chipCls,
  formatDateTimeLong,
  trackingKind,
} from "./tracking-ui";

interface TrackingHistoryCardProps {
  data: TrackingHistoryItem[];
}

export const TrackingHistoryCard: React.FC<TrackingHistoryCardProps> = ({
  data,
}) => {
  if (!data || data.length === 0) {
    return null;
  }

  return (
    <TrackCard
      icon={Route}
      title={`Riwayat Perjalanan Paket (${data.length} update)`}
    >
      <ol className="relative">
        {data.map((history, index) => {
          const kind = trackingKind(history.status);
          const dotCls =
            kind === "unknown" && !history.status
              ? "bg-blue-500"
              : KIND_STYLE[kind].dot;
          const place =
            history.location.store_name ||
            history.location.branch_name ||
            history.location.hub_name;
          const when = history.datetime || history.date_time;
          const isLast = index === data.length - 1;

          return (
            <li key={index} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Garis & titik timeline */}
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4 ring-white",
                    dotCls
                  )}
                />
                {!isLast && <span className="mt-1 w-px flex-1 bg-slate-200" />}
              </div>

              <div className="min-w-0 flex-1 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {history.status_name ||
                      history.description ||
                      history.message ||
                      "N/A"}
                  </p>
                  <span className="text-xs tabular-nums text-slate-500">
                    {when ? formatDateTimeLong(when) : "N/A"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(history.location.city || history.location.city_name) && (
                    <span className={cn(chipCls, "gap-1 bg-blue-50 text-blue-700")}>
                      <MapPin className="h-3 w-3" aria-hidden />
                      {history.location.city || history.location.city_name}
                    </span>
                  )}
                  {history.status_code && (
                    <span className={cn(chipCls, "font-mono")}>
                      Code: {history.status_code}
                    </span>
                  )}
                </div>

                {history.description &&
                  history.description !== history.status_name && (
                    <p className="mt-2 text-sm text-slate-600">
                      {history.description}
                    </p>
                  )}

                <div className="mt-2 space-y-1 text-xs text-slate-600">
                  {place && (
                    <p>
                      <span className="font-semibold">Lokasi:</span> {place}
                    </p>
                  )}
                  {history.location.next_site && (
                    <p>
                      <span className="font-semibold">Next Site:</span>{" "}
                      {history.location.next_site}
                    </p>
                  )}
                  {history.location.next_branch && (
                    <p>
                      <span className="font-semibold">Next Branch:</span>{" "}
                      {history.location.next_branch}
                    </p>
                  )}
                  {(history.driver.name || history.driver.phone) && (
                    <p className="flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                      <span className="font-semibold">Driver:</span>{" "}
                      {history.driver.name || "N/A"}
                      {history.driver.phone && ` (${history.driver.phone})`}
                    </p>
                  )}
                  {history.recipient && (
                    <p className="flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                      <span className="font-semibold">Penerima:</span>{" "}
                      {history.recipient.name}
                      {history.recipient.relationship &&
                        ` (${history.recipient.relationship})`}
                    </p>
                  )}
                  {history.note && (
                    <p>
                      <span className="font-semibold">Catatan:</span>{" "}
                      {history.note}
                    </p>
                  )}
                </div>

                {history.image_url && (
                  <a
                    href={history.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                  >
                    <ImageIcon className="h-3.5 w-3.5" aria-hidden />
                    Lihat Foto
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </TrackCard>
  );
};
