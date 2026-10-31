import { Bell, Truck, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Peta kunci `icon` (bebas, dikirim BE lewat payload notifikasi) ke ikon
 * lucide - titik "adapter" di sisi FE. Jenis notifikasi baru di BE yang
 * memakai kunci belum terdaftar di sini tetap tampil normal (jatuh ke ikon
 * default `Bell`), jadi menambah jenis notifikasi baru tidak pernah
 * mewajibkan perubahan di sini - baris baru cukup ditambahkan kalau mau
 * ikon yang lebih spesifik.
 */
const NOTIFICATION_ICON_MAP: Record<string, LucideIcon> = {
  wallet: Wallet,
  shipment: Truck,
};

export function getNotificationIcon(icon: string): LucideIcon {
  return NOTIFICATION_ICON_MAP[icon] ?? Bell;
}

export function formatNotificationDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
