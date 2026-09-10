// Program Flat Ongkir (harga tetap per cakupan provinsi) — lihat docs/be-fe/flat-ongkir-jawa-bali.md

export interface FlatShippingRate {
  id: number;
  name: string;
  vendor: string | null;
  flat_price: string | number;
  covered_provinces: string[];
  /** BE selalu paksa null sekarang — "jenis layanan" tidak dibedakan lagi. */
  service_types: string[] | null;
  max_weight: string | number;
  max_length: number | null;
  max_width: number | null;
  max_height: number | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  priority: number;
  description: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FlatShippingRatePaginator {
  current_page: number;
  data: FlatShippingRate[];
  total: number;
  per_page: number;
  last_page?: number;
  [key: string]: unknown;
}

export interface FlatShippingRateListResponse {
  status: string;
  message?: string;
  data: FlatShippingRatePaginator;
}

export interface FlatShippingRateDetailResponse {
  status: string;
  message?: string;
  data: FlatShippingRate;
}

export interface FlatShippingRatePayload {
  name: string;
  vendor?: string | null;
  flat_price: number;
  covered_provinces: string[];
  service_types?: string[];
  max_weight: number;
  max_length?: number;
  max_width?: number;
  max_height?: number;
  is_active?: boolean;
  valid_from?: string | null;
  valid_until?: string | null;
  priority?: number;
  description?: string;
}

export type UpdateFlatShippingRatePayload = Partial<FlatShippingRatePayload>;

export interface ToggleFlatShippingRateStatusResponse {
  status: string;
  message?: string;
  data: { is_active: boolean };
}

/** Vendor yang diikutkan evaluasi flat rate (GoSend sengaja tidak diikutkan). */
export const FLAT_RATE_VENDORS = [
  { value: "IDEXPRESS", label: "ID Express" },
  { value: "ANTERAJA", label: "Anteraja" },
  { value: "JNE", label: "JNE" },
  { value: "JNTCARGO", label: "J&T Cargo" },
  { value: "JNTEXPRESS", label: "J&T Express" },
  { value: "LION", label: "Lion Parcel" },
  { value: "NINJAEXPRESS", label: "Ninja Express" },
  { value: "PAXEL", label: "Paxel" },
  { value: "POSINDONESIA", label: "Pos Indonesia" },
  { value: "SAP", label: "SAP Express" },
];
