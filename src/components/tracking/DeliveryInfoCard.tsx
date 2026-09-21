"use client";

import { CheckCircle2, FileText, ImageIcon } from "lucide-react";
import type { DeliveryInfo } from "@/types/tracking";
import { Field, TrackCard, chipCls, formatDateTimeLong } from "./tracking-ui";

interface DeliveryInfoCardProps {
  delivery: DeliveryInfo;
}

const proofLink =
  "inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50";

export const DeliveryInfoCard: React.FC<DeliveryInfoCardProps> = ({
  delivery,
}) => {
  if (
    !delivery.delivered_at &&
    !delivery.delivered_to &&
    !delivery.proof_of_delivery.signature_url &&
    !delivery.proof_of_delivery.photo_url
  ) {
    return null;
  }

  const pod = delivery.proof_of_delivery;
  const hasProof =
    pod.signature_url ||
    pod.photo_url ||
    pod.signature_pod.length > 0 ||
    pod.photo_pod.length > 0;

  return (
    <TrackCard
      icon={CheckCircle2}
      title="Informasi Pengiriman"
      tone="bg-emerald-50 text-emerald-600"
    >
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {delivery.delivered_at && (
          <Field label="Dikirim Pada">
            {formatDateTimeLong(delivery.delivered_at)}
          </Field>
        )}
        {delivery.delivered_to && (
          <Field label="Diterima Oleh">
            {delivery.delivered_to}
            {delivery.delivery_relationship && (
              <span className="mt-0.5 block text-xs font-normal text-slate-600">
                Hubungan: {delivery.delivery_relationship}
              </span>
            )}
          </Field>
        )}
        {delivery.pod_status_code && (
          <Field label="POD Status Code">
            <span className={`${chipCls} font-mono`}>
              {delivery.pod_status_code}
            </span>
          </Field>
        )}
        {delivery.pod_status_name && (
          <Field label="POD Status">{delivery.pod_status_name}</Field>
        )}
      </dl>

      {hasProof && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <p className="mb-2 text-xs text-slate-500">Bukti Pengiriman</p>
          <div className="flex flex-wrap gap-2">
            {pod.signature_url && (
              <a
                href={pod.signature_url}
                target="_blank"
                rel="noopener noreferrer"
                className={proofLink}
              >
                <FileText className="h-4 w-4" aria-hidden />
                Tanda Tangan
              </a>
            )}
            {pod.photo_url && (
              <a
                href={pod.photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className={proofLink}
              >
                <ImageIcon className="h-4 w-4" aria-hidden />
                Foto Pengiriman
              </a>
            )}
            {pod.signature_pod.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={proofLink}
              >
                <FileText className="h-4 w-4" aria-hidden />
                Tanda Tangan {idx + 1}
              </a>
            ))}
            {pod.photo_pod.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className={proofLink}
              >
                <ImageIcon className="h-4 w-4" aria-hidden />
                Foto {idx + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </TrackCard>
  );
};
