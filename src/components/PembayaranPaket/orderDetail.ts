import type { Order } from "@/types/laporanPengiriman";

/** Subset `request_payload.detail` yang relevan untuk kolom ISI PAKET/INFO PAKET. */
export interface OrderRequestDetail {
  goods_desc?: string;
  weight?: number;
  panjang?: number;
  lebar?: number;
  tinggi?: number;
  instruction?: string;
}

/** `request_payload` tidak typed penuh (Record<string, unknown>) — ambil `detail` dengan aman. */
export function getDetail(order: Order): OrderRequestDetail {
  const payload = order.request_payload as
    | { detail?: OrderRequestDetail }
    | undefined;
  return payload?.detail ?? {};
}
