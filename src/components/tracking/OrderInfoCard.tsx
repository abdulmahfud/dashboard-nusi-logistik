"use client";

import { Package } from "lucide-react";
import type { OrderInfo } from "@/types/tracking";
import { Field, TrackCard, chipCls, formatDateTimeLong } from "./tracking-ui";

interface OrderInfoCardProps {
  orderInfo: OrderInfo;
}

export const OrderInfoCard: React.FC<OrderInfoCardProps> = ({ orderInfo }) => {
  return (
    <TrackCard icon={Package} title="Informasi Order">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <Field label="Nomor Referensi">
          <span className="font-mono text-xs">{orderInfo.reference_no}</span>
        </Field>
        <Field label="Vendor Expedisi">
          <span className={`${chipCls} uppercase`}>{orderInfo.vendor}</span>
        </Field>
        <Field label="No. Resi (AWB)">
          {orderInfo.awb_no ? (
            <span className="font-mono text-xs">{orderInfo.awb_no}</span>
          ) : (
            "Belum tersedia"
          )}
        </Field>
        <Field label="Status Order">
          <span className={chipCls}>{orderInfo.status}</span>
        </Field>
        <Field label="Tanggal Order" className="sm:col-span-2">
          {formatDateTimeLong(orderInfo.created_at)}
        </Field>
      </dl>
    </TrackCard>
  );
};
