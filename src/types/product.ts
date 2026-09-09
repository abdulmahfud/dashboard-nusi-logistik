// Katalog Produk per user — lihat docs/be-fe/katalog-produk.md

export interface Product {
  id: number;
  user_id: number;
  name: string;
  price: string | number | null;
  category: string | null;
  /** Kilogram (bukan gram) — sama seperti `detail.weight` di payload create-order. */
  weight: string | number;
  panjang: number | null;
  lebar: number | null;
  tinggi: number | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductPaginator {
  current_page: number;
  data: Product[];
  total: number;
  per_page: number;
  last_page?: number;
  [key: string]: unknown;
}

export interface ProductListResponse {
  success: boolean;
  message?: string;
  data: ProductPaginator;
}

export interface ProductDetailResponse {
  success: boolean;
  message?: string;
  data: Product;
}

export interface CreateProductPayload {
  name: string;
  price?: number;
  category?: string;
  weight: number;
  panjang?: number;
  lebar?: number;
  tinggi?: number;
  is_active?: boolean;
  /** Hanya diproses untuk superadmin — buat produk atas nama user lain. */
  user_id?: number;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface ToggleProductActiveResponse {
  success: boolean;
  message?: string;
  data: Product;
}
