"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Truck, User, Image } from "lucide-react";
import type { TrackingHistoryItem } from "@/types/tracking";

interface TrackingHistoryCardProps {
  data: TrackingHistoryItem[];
}

export const TrackingHistoryCard: React.FC<TrackingHistoryCardProps> = ({ data }) => {
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

  const getStatusBadgeColor = (status: string | null) => {
    if (!status) return "bg-gray-500";
    const statusLower = status.toLowerCase();
    if (statusLower.includes("sampai_tujuan") || statusLower.includes("delivered")) {
      return "bg-green-500";
    }
    if (statusLower.includes("proses_pengiriman") || statusLower.includes("in_transit")) {
      return "bg-blue-500";
    }
    if (statusLower.includes("belum_proses") || statusLower.includes("pending")) {
      return "bg-yellow-500";
    }
    if (statusLower.includes("kendala") || statusLower.includes("problem")) {
      return "bg-red-500";
    }
    return "bg-gray-500";
  };

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Riwayat Perjalanan Paket ({data.length} update)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((history, index) => (
            <div
              key={index}
              className="flex items-start gap-4 p-4 border rounded-lg"
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-3 h-3 rounded-full ${
                    history.status
                      ? getStatusBadgeColor(history.status)
                      : "bg-blue-500"
                  }`}
                ></div>
                {index < data.length - 1 && (
                  <div className="w-px h-8 bg-gray-300 mt-2"></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {(history.location.city || history.location.city_name) && (
                    <Badge variant="outline" className="text-xs">
                      {history.location.city || history.location.city_name}
                    </Badge>
                  )}
                  <span className="text-xs text-gray-500">
                    {history.datetime || history.date_time ? formatDate(history.datetime || history.date_time) : "N/A"}
                  </span>
                  {history.status_code && (
                    <Badge variant="outline" className="text-xs">
                      Code: {history.status_code}
                    </Badge>
                  )}
                </div>
                <p className="font-medium text-sm">{history.status_name || history.description || history.message || "N/A"}</p>
                {history.description && history.description !== history.status_name && (
                  <p className="text-xs text-gray-600 mt-1">{history.description}</p>
                )}
                {(history.location.store_name || history.location.branch_name || history.location.hub_name) && (
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Lokasi:</strong> {history.location.store_name || history.location.branch_name || history.location.hub_name}
                  </p>
                )}
                {history.location.next_site && (
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Next Site:</strong> {history.location.next_site}
                  </p>
                )}
                {history.location.next_branch && (
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Next Branch:</strong> {history.location.next_branch}
                  </p>
                )}
                {(history.driver.name || history.driver.phone) && (
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                    <Truck className="h-3 w-3" />
                    <strong>Driver:</strong> {history.driver.name || "N/A"}
                    {history.driver.phone && ` (${history.driver.phone})`}
                  </p>
                )}
                {history.recipient && (
                  <p className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                    <User className="h-3 w-3" />
                    <strong>Penerima:</strong> {history.recipient.name}
                    {history.recipient.relationship && ` (${history.recipient.relationship})`}
                  </p>
                )}
                {history.note && (
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Catatan:</strong> {history.note}
                  </p>
                )}
                {history.image_url && (
                  <div className="mt-2">
                    <a
                      href={history.image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-xs underline flex items-center gap-1"
                    >
                      <Image className="h-3 w-3" />
                      Lihat Foto
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
