// Satu sumber untuk daftar vendor ekspedisi di seluruh DA (Pembayaran Paket,
// Cancel Order, dll) — selalu dari GET /admin/expedition-vendor-settings,
// bukan hardcode. Sebelumnya ada 3 daftar/peta vendor yang terpisah dan
// drift satu sama lain (beda path logo, salah satu cuma "ninjaexpress"
// bukan "ninja", GoSend hilang dari satu daftar, dst).
//
// Beda dari fetchPricingEligibleVendors() (src/lib/pricingVendors.ts): itu
// khusus untuk Diskon Pengiriman/Flat Ongkir, filter eligible_for_pricing_rules
// (exclude GoSend). Fungsi di sini TIDAK memfilter — untuk kebutuhan umum
// (pilih vendor pesanan, bukan program harga) semua vendor yang ada di
// vendor-settings relevan, termasuk yang tidak eligible untuk diskon/flat.

import { getExpeditionVendorSettings } from "@/lib/apiClient";

export interface VendorOption {
  /** Kunci lowercase, sama dengan `vendor` di Order/ExpeditionVendorSetting. */
  value: string;
  label: string;
  logo: string | null;
  is_active: boolean;
  is_cod_active: boolean;
}

/** Label ramah-baca per vendor key. Fallback ke key apa adanya kalau belum ada di sini. */
const VENDOR_LABELS: Record<string, string> = {
  jne: "JNE",
  sap: "SAP Express",
  lion: "Lion Parcel",
  jntexpress: "J&T Express",
  jntcargo: "J&T Cargo",
  paxel: "Paxel",
  idexpress: "ID Express",
  posindonesia: "Pos Indonesia",
  anteraja: "Anteraja",
  ninja: "Ninja Express",
  gosend: "GoSend",
};

/** Path logo di public/images. `null`/tidak ada entri = belum ada logo (tampilkan fallback ikon). */
const VENDOR_LOGOS: Record<string, string> = {
  jne: "/images/jne.png",
  sap: "/images/sap-new.png",
  lion: "/images/lion.png",
  jntexpress: "/images/jnt.png",
  jntcargo: "/images/jnt-cargo.png",
  paxel: "/images/paxel.png",
  idexpress: "/images/idx.png",
  posindonesia: "/images/pos.png",
  anteraja: "/images/anteraja.png",
  ninja: "/images/ninja.png",
  // gosend: belum ada logo/belum produksi.
};

export function getVendorLabel(vendor: string | null | undefined): string {
  if (!vendor) return "-";
  const key = vendor.toLowerCase();
  return VENDOR_LABELS[key] ?? vendor;
}

/**
 * `orders.vendor`/vendor-settings casingnya tidak konsisten di data historis
 * (mis. "jntexpress" vs "POSINDONESIA") — cocokkan tanpa memandang huruf
 * besar kecil. `null` kalau vendor belum punya logo.
 */
export function getVendorLogo(vendor: string | null | undefined): string | null {
  if (!vendor) return null;
  return VENDOR_LOGOS[vendor.toLowerCase()] ?? null;
}

/** Semua vendor dari vendor-settings BE, diurutkan alfabetis berdasarkan label. */
export async function fetchAllVendors(): Promise<VendorOption[]> {
  const res = await getExpeditionVendorSettings();
  const rows = Array.isArray(res.data) ? res.data : [];
  return rows
    .map((row) => {
      const value = row.vendor.toLowerCase();
      return {
        value,
        label: getVendorLabel(value),
        logo: getVendorLogo(value),
        is_active: row.is_active,
        is_cod_active: row.is_cod_active,
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}
