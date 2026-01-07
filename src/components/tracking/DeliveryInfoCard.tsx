"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Image, FileText } from "lucide-react";
import type { DeliveryInfo } from "@/types/tracking";

interface DeliveryInfoCardProps {
  delivery: DeliveryInfo;
}

export const DeliveryInfoCard: React.FC<DeliveryInfoCardProps> = ({ delivery }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!delivery.delivered_at && !delivery.delivered_to && !delivery.proof_of_delivery.signature_url && !delivery.proof_of_delivery.photo_url) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Informasi Pengiriman
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {delivery.delivered_at && (
          <div>
            <label className="text-sm font-medium text-gray-600">
              Dikirim Pada
            </label>
            <p className="font-semibold mt-1">{formatDate(delivery.delivered_at)}</p>
          </div>
        )}
        {delivery.delivered_to && (
          <div>
            <label className="text-sm font-medium text-gray-600">
              Diterima Oleh
            </label>
            <p className="font-semibold mt-1">{delivery.delivered_to}</p>
            {delivery.delivery_relationship && (
              <p className="text-sm text-gray-600 mt-1">
                Hubungan: {delivery.delivery_relationship}
              </p>
            )}
          </div>
        )}
        {(delivery.proof_of_delivery.signature_url || delivery.proof_of_delivery.photo_url || 
          delivery.proof_of_delivery.signature_pod.length > 0 || delivery.proof_of_delivery.photo_pod.length > 0) && (
          <div>
            <label className="text-sm font-medium text-gray-600 mb-2 block">
              Bukti Pengiriman
            </label>
            <div className="flex flex-wrap gap-4">
              {delivery.proof_of_delivery.signature_url && (
                <a
                  href={delivery.proof_of_delivery.signature_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Tanda Tangan
                </a>
              )}
              {delivery.proof_of_delivery.photo_url && (
                <a
                  href={delivery.proof_of_delivery.photo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
                >
                  <Image className="h-4 w-4" />
                  Foto Pengiriman
                </a>
              )}
              {delivery.proof_of_delivery.signature_pod.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" />
                  Tanda Tangan {idx + 1}
                </a>
              ))}
              {delivery.proof_of_delivery.photo_pod.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm underline flex items-center gap-1"
                >
                  <Image className="h-4 w-4" />
                  Foto {idx + 1}
                </a>
              ))}
            </div>
          </div>
        )}
        {delivery.pod_status_code && (
          <div>
            <label className="text-sm font-medium text-gray-600">
              POD Status Code
            </label>
            <p className="text-sm text-gray-900 font-mono mt-1">{delivery.pod_status_code}</p>
          </div>
        )}
        {delivery.pod_status_name && (
          <div>
            <label className="text-sm font-medium text-gray-600">
              POD Status
            </label>
            <p className="text-sm text-gray-900 mt-1">{delivery.pod_status_name}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
