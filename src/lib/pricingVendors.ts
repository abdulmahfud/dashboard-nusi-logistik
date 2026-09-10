// Sumber data vendor untuk dropdown Diskon Pengiriman & Flat Ongkir.
// Lihat docs/be-fe/update-vendor-list-diskon-flat-ongkir.md — pakai
// GET /admin/expedition-vendor-settings, filter eligible_for_pricing_rules,
// value dropdown = vendor_code (uppercase, sudah dijamin server, tidak perlu
// normalisasi casing manual).

import { getExpeditionVendorSettings } from "@/lib/apiClient";

export interface PricingVendorOption {
  /** vendor_code — value yang dikirim ke expedition-discounts/flat-shipping-rates. */
  value: string;
  label: string;
  is_active: boolean;
}

/** Label ramah-baca per vendor_code. Fallback ke vendor_code apa adanya kalau belum ada di sini. */
const VENDOR_CODE_LABELS: Record<string, string> = {
  IDEXPRESS: "ID Express",
  ANTERAJA: "Anteraja",
  JNE: "JNE",
  JNTCARGO: "J&T Cargo",
  JNTEXPRESS: "J&T Express",
  LION: "Lion Parcel",
  // Kode yang benar untuk Ninja Express adalah NINJA, bukan NINJAEXPRESS.
  NINJA: "Ninja Express",
  PAXEL: "Paxel",
  POSINDONESIA: "Pos Indonesia",
  SAP: "SAP Express",
};

export async function fetchPricingEligibleVendors(): Promise<
  PricingVendorOption[]
> {
  const res = await getExpeditionVendorSettings();
  const rows = Array.isArray(res.data) ? res.data : [];

  return rows
    .filter((row) => row.eligible_for_pricing_rules)
    .map((row) => ({
      value: row.vendor_code,
      label: VENDOR_CODE_LABELS[row.vendor_code] || row.vendor_code,
      is_active: row.is_active,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}
