export interface ExpeditionVendorSetting {
  id: number;
  /** Lowercase, kunci internal untuk routing (/admin/expedition/{vendor}/...). JANGAN dipakai sebagai value dropdown Diskon/Flat Ongkir — pakai `vendor_code`. */
  vendor: string;
  is_active: boolean;
  is_cod_active: boolean;
  note: string | null;
  created_at: string;
  updated_at: string;
  /** Uppercase — sama persis dengan value yang tersimpan di expedition_discounts.vendor / flat_shipping_rates.vendor. */
  vendor_code: string;
  /** true untuk vendor yang didukung diskon/flat-ongkir, false untuk GOSEND. */
  eligible_for_pricing_rules: boolean;
  /** null kalau vendor belum/tidak lagi punya grup. Lihat docs/be-fe/expedition-groups.md */
  expedition_group_id?: number | null;
  group?: {
    id: number;
    name: string;
    slug: string;
    estimasi_dalam_kota: string | null;
    estimasi_dalam_pulau: string | null;
    estimasi_luar_pulau: string | null;
  } | null;
}

export interface ExpeditionVendorSettingsListResponse {
  success: boolean;
  data: ExpeditionVendorSetting[];
}

export type ExpeditionVendorSettingPatchBody = {
  is_active?: boolean;
  is_cod_active?: boolean;
  note?: string | null;
  /** Id grup tujuan, atau null untuk melepas vendor dari grup. */
  expedition_group_id?: number | null;
};

export interface ExpeditionVendorSettingPatchResponse {
  success: boolean;
  message?: string;
  data?: ExpeditionVendorSetting;
}
