"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import type { Shipment } from "@/types/tracking";

interface ShipmentInfoCardProps {
  shipment: Shipment;
}

export const ShipmentInfoCard: React.FC<ShipmentInfoCardProps> = ({ shipment }) => {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

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

  const formatWeight = (weight: number | null, unit: string) => {
    if (weight === null) return "N/A";
    if (unit === "grams" && weight >= 1000) {
      return `${(weight / 1000).toFixed(2)} kg`;
    }
    return `${weight} ${unit}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Informasi Pengiriman
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shipment.service_code && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Kode Layanan
              </label>
              <div className="mt-1">
                <Badge variant="outline">{shipment.service_code}</Badge>
              </div>
            </div>
          )}
          {shipment.service_name && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Nama Layanan
              </label>
              <p className="font-semibold">{shipment.service_name}</p>
            </div>
          )}
          {shipment.weight !== null && (
            <div>
              <label className="text-sm font-medium text-gray-600">Berat</label>
              <p className="font-semibold">
                {formatWeight(shipment.weight, shipment.weight_unit)}
              </p>
            </div>
          )}
          {shipment.pieces > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Jumlah Koli
              </label>
              <p className="font-semibold">{shipment.pieces} koli</p>
            </div>
          )}
          {shipment.item_name && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Nama Barang
              </label>
              <p className="font-semibold">{shipment.item_name}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Biaya Pengiriman
            </label>
            <p className="font-semibold">{formatCurrency(shipment.shipping_cost)}</p>
          </div>
          {shipment.cod_value > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Nilai COD
              </label>
              <p className="font-semibold">{formatCurrency(shipment.cod_value)}</p>
            </div>
          )}
          {shipment.insurance_cost > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Biaya Asuransi
              </label>
              <p className="font-semibold">{formatCurrency(shipment.insurance_cost)}</p>
            </div>
          )}
          <div>
            <label className="text-sm font-medium text-gray-600">
              Total Biaya
            </label>
            <p className="font-semibold text-lg text-blue-600">
              {formatCurrency(shipment.total_amount)}
            </p>
          </div>
          {shipment.booking_id && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Booking ID
              </label>
              <p className="font-semibold font-mono">{shipment.booking_id}</p>
            </div>
          )}
          {shipment.invoice_no && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Nomor Invoice
              </label>
              <p className="font-semibold font-mono">{shipment.invoice_no}</p>
            </div>
          )}
          {shipment.shipped_date && (
            <div>
              <label className="text-sm font-medium text-gray-600">
                Tanggal Pengiriman
              </label>
              <p className="font-semibold">{formatDate(shipment.shipped_date)}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
