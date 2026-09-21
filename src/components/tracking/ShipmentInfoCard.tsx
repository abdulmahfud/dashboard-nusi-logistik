"use client";

import { Box } from "lucide-react";
import type { Shipment } from "@/types/tracking";
import { Field, TrackCard, chipCls, formatDateTimeLong } from "./tracking-ui";

interface ShipmentInfoCardProps {
  shipment: Shipment;
}

export const ShipmentInfoCard: React.FC<ShipmentInfoCardProps> = ({
  shipment,
}) => {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return "N/A";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  const formatWeight = (weight: number | null, unit: string) => {
    if (weight === null) return "N/A";
    if (unit === "grams" && weight >= 1000) {
      return `${(weight / 1000).toFixed(2)} kg`;
    }
    return `${weight} ${unit}`;
  };

  return (
    <TrackCard icon={Box} title="Informasi Pengiriman">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {shipment.service_code && (
          <Field label="Kode Layanan">
            <span className={chipCls}>{shipment.service_code}</span>
          </Field>
        )}
        {shipment.service_name && (
          <Field label="Nama Layanan">{shipment.service_name}</Field>
        )}
        {shipment.weight !== null && (
          <Field label="Berat">
            {formatWeight(shipment.weight, shipment.weight_unit)}
          </Field>
        )}
        {shipment.pieces > 0 && (
          <Field label="Jumlah Koli">{shipment.pieces} koli</Field>
        )}
        {shipment.item_name && (
          <Field label="Nama Barang">{shipment.item_name}</Field>
        )}
        <Field label="Biaya Pengiriman">
          {formatCurrency(shipment.shipping_cost)}
        </Field>
        {shipment.cod_value > 0 && (
          <Field label="Nilai COD">{formatCurrency(shipment.cod_value)}</Field>
        )}
        {shipment.insurance_cost > 0 && (
          <Field label="Biaya Asuransi">
            {formatCurrency(shipment.insurance_cost)}
          </Field>
        )}
        {shipment.booking_id && (
          <Field label="Booking ID">
            <span className="font-mono text-xs">{shipment.booking_id}</span>
          </Field>
        )}
        {shipment.invoice_no && (
          <Field label="Nomor Invoice">
            <span className="font-mono text-xs">{shipment.invoice_no}</span>
          </Field>
        )}
        {shipment.shipped_date && (
          <Field label="Tanggal Pengiriman" className="sm:col-span-2">
            {formatDateTimeLong(shipment.shipped_date)}
          </Field>
        )}
      </dl>

      <div className="mt-5 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
        <span className="text-sm font-medium text-slate-700">Total Biaya</span>
        <span className="text-lg font-bold tabular-nums text-blue-700">
          {formatCurrency(shipment.total_amount)}
        </span>
      </div>
    </TrackCard>
  );
};
