"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Truck, Clock, AlertCircle, XCircle, Info } from "lucide-react";
import type { CurrentStatus } from "@/types/tracking";

interface CurrentStatusCardProps {
  currentStatus: CurrentStatus;
}

export const CurrentStatusCard: React.FC<CurrentStatusCardProps> = ({ currentStatus }) => {
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

  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200";
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("sampai_tujuan") || statusLower.includes("delivered") || statusLower.includes("sukses")) {
      return "bg-green-100 text-green-800 border-green-200";
    }
    if (statusLower.includes("proses_pengiriman") || statusLower.includes("in_transit") || statusLower.includes("on_delivery")) {
      return "bg-blue-100 text-blue-800 border-blue-200";
    }
    if (statusLower.includes("belum_proses") || statusLower.includes("pending") || statusLower.includes("belum_di_expedisi")) {
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
    if (statusLower.includes("kendala") || statusLower.includes("problem") || statusLower.includes("failed")) {
      return "bg-red-100 text-red-800 border-red-200";
    }
    if (statusLower.includes("dibatalkan") || statusLower.includes("cancel")) {
      return "bg-gray-100 text-gray-800 border-gray-200";
    }
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status: string | null) => {
    if (!status) return <Info className="h-5 w-5" />;
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes("sampai_tujuan") || statusLower.includes("delivered") || statusLower.includes("sukses")) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    }
    if (statusLower.includes("kendala") || statusLower.includes("problem") || statusLower.includes("failed")) {
      return <AlertCircle className="h-5 w-5 text-red-600" />;
    }
    if (statusLower.includes("proses_pengiriman") || statusLower.includes("in_transit") || statusLower.includes("on_delivery")) {
      return <Truck className="h-5 w-5 text-blue-600" />;
    }
    if (statusLower.includes("belum_proses") || statusLower.includes("pending")) {
      return <Clock className="h-5 w-5 text-yellow-600" />;
    }
    if (statusLower.includes("dibatalkan") || statusLower.includes("cancel")) {
      return <XCircle className="h-5 w-5 text-gray-600" />;
    }
    return <Info className="h-5 w-5 text-gray-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(currentStatus.status)}
          Status Terkini
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-600">Status</label>
          <div className="mt-1">
            <Badge className={getStatusColor(currentStatus.status)} variant="outline">
              {currentStatus.status || "N/A"}
            </Badge>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-gray-600">Deskripsi</label>
          <p className="text-sm text-gray-900 mt-1">
            {currentStatus.description || currentStatus.status || "N/A"}
          </p>
        </div>
        {currentStatus.code && (
          <div>
            <label className="text-sm font-medium text-gray-600">Kode Status</label>
            <p className="text-sm text-gray-900 font-mono mt-1">{currentStatus.code}</p>
          </div>
        )}
        {currentStatus.datetime && (
          <div>
            <label className="text-sm font-medium text-gray-600">Waktu Update</label>
            <p className="text-sm text-gray-900 mt-1">{formatDate(currentStatus.datetime)}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
