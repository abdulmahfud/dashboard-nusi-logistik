import type { Order } from "@/types/laporanPengiriman";

/**
 * Status/klasifikasi bersama untuk kartu ringkasan di beranda (Ringkasan
 * Pengiriman, Ringkasan Status Pengiriman, Ringkasan Paket Reguler,
 * Ringkasan Paket COD) - semua dihitung dari order mentah GET
 * /admin/list-orders (lib/apiClient.ts getOrders), sumber data yang sama
 * dengan dashboard/laporan/laporan-pengiriman, supaya angkanya selalu
 * konsisten dengan laporan itu alih-alih endpoint statistik terpisah.
 */

export type StatusKey =
  | "belum"
  | "proses"
  | "kendala"
  | "sampai"
  | "retur"
  | "dibatalkan";

export const STATUS_META: Record<
  StatusKey,
  { label: string; color: string; match: (status: string) => boolean }
> = {
  belum: {
    label: "Belum Proses",
    color: "#ef4444",
    // belum_proses (corporate/COD) + menunggu_pembayaran (personal belum
    // bayar) + belum_di_expedisi - sama seperti kartu "Belum Proses" di
    // laporan-pengiriman (count("Belum Proses") + count("Menunggu
    // Pembayaran")).
    match: (s) =>
      s === "belum_proses" ||
      s === "belum_di_expedisi" ||
      s === "menunggu_pembayaran",
  },
  proses: {
    label: "Proses Pengiriman",
    color: "#2563eb",
    match: (s) => s === "proses_pengiriman",
  },
  // Kendala & Retur dipisah (sebelumnya digabung "Retur / Kendala") supaya
  // konsisten dengan laporan-pengiriman yang menampilkan keduanya terpisah.
  kendala: {
    label: "Kendala Pengiriman",
    color: "#f97316",
    match: (s) => s === "kendala_pengiriman",
  },
  sampai: {
    label: "Sampai Tujuan",
    color: "#10b981",
    match: (s) => s === "sampai_tujuan",
  },
  retur: {
    label: "Retur",
    color: "#a855f7",
    match: (s) => s === "retur",
  },
  dibatalkan: {
    label: "Dibatalkan",
    color: "#64748b",
    match: (s) => s === "dibatalkan",
  },
};

export const STATUS_KEYS = Object.keys(STATUS_META) as StatusKey[];

/** Sama persis dengan transformOrderToDeliveryReport() di laporan-pengiriman. */
export function classifyPackageType(
  order: Order
): "Paket Reguler" | "Paket Instant" | "COD" {
  if (order.service_type_code === "COD") return "COD";
  if (order.service_type_code === "INSTANT") return "Paket Instant";
  return "Paket Reguler";
}

export function countByStatus(orders: Order[]): Record<StatusKey, number> {
  const counts = STATUS_KEYS.reduce(
    (acc, key) => ({ ...acc, [key]: 0 }),
    {} as Record<StatusKey, number>
  );
  for (const order of orders) {
    const key = STATUS_KEYS.find((k) => STATUS_META[k].match(order.status));
    if (key) counts[key] += 1;
  }
  return counts;
}
