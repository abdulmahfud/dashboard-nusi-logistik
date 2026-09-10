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
}

export interface ExpeditionVendorSettingsListResponse {
  success: boolean;
  data: ExpeditionVendorSetting[];
}

export type ExpeditionVendorSettingPatchBody = {
  is_active?: boolean;
  is_cod_active?: boolean;
  note?: string | null;
};

export interface ExpeditionVendorSettingPatchResponse {
  success: boolean;
  message?: string;
  data?: ExpeditionVendorSetting;
}
