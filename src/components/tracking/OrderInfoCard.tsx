"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import type { OrderInfo } from "@/types/tracking";

interface OrderInfoCardProps {
  orderInfo: OrderInfo;
}

export const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ orderInfo }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Informasi Order
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-600">
              Nomor Referensi
            </label>
            <p className="font-semibold">{orderInfo.reference_no}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Vendor Expedisi
            </label>
            <div className="font-semibold">
              <Badge variant="outline" className="uppercase">
                {orderInfo.vendor}
              </Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              No. Resi (AWB)
            </label>
            <p className="font-semibold">
              {orderInfo.awb_no || "Belum tersedia"}
            </p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Status Order
            </label>
            <div className="font-semibold">
              <Badge variant="outline">{orderInfo.status}</Badge>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600">
              Tanggal Order
            </label>
            <p className="font-semibold">
              {formatDate(orderInfo.created_at)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
