// Grup Ekspedisi (Reguler & COD / Cargo / dst) — lihat docs/be-fe/expedition-groups.md

export interface ExpeditionGroup {
  id: number;
  name: string;
  /** Kunci stabil, huruf kecil/angka/underscore saja, unik antar grup. */
  slug: string;
  estimasi_dalam_kota: string | null;
  estimasi_dalam_pulau: string | null;
  estimasi_luar_pulau: string | null;
  description: string | null;
  created_at?: string;
  updated_at?: string;
  vendor_settings_count: number;
  /** Kunci vendor lowercase (sama dengan `vendor` di expedition-vendor-settings). */
  vendors: string[];
}

export interface ExpeditionGroupListResponse {
  success: boolean;
  message?: string;
  data: ExpeditionGroup[];
}

export interface ExpeditionGroupDetailResponse {
  success: boolean;
  message?: string;
  data: ExpeditionGroup;
}

export interface ExpeditionGroupPayload {
  name: string;
  slug: string;
  estimasi_dalam_kota?: string | null;
  estimasi_dalam_pulau?: string | null;
  estimasi_luar_pulau?: string | null;
  description?: string | null;
}

export type UpdateExpeditionGroupPayload = Partial<ExpeditionGroupPayload>;
