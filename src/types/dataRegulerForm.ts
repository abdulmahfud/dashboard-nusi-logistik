export interface Shipper {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  contact: string | null;
  email: string | null;
  address: string;
  province: string | null;
  regency: string | null;
  district: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ShipperListResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: Shipper[];
    // ... tambahkan field lain jika perlu
  };
}

export interface Receiver {
  id: number;
  user_id: number;
  name: string;
  phone: string;
  contact: string | null;
  email: string | null;
  address: string;
  province: string | null;
  regency: string | null;
  district: string | null;
  postal_code: string | null;
  latitude: string | null;
  longitude: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ReceiverListResponse {
  success: boolean;
  message: string;
  data: {
    current_page: number;
    data: Receiver[];
    // ... tambahkan field lain jika perlu
  };
}

export const itemTypes = [
  "DOKUMEN",
  "BARANG BERHARGA",
  "ELEKTRONIK",
  "FASHION & AKSESORIS",
  "MAKANAN & MINUMAN",
  "OTOMOTIF",
  "RUMAH TANGGA",
  "PERABOTAN",
  "ALAT TULIS & KANTOR",
  "MAINAN & HOBI",
  "KESEHATAN & KECANTIKAN",
  "LAINNYA",
];

export interface Province {
  id: number;
  name: string;
}

export interface Regency {
  id: number;
  name: string;
  province_id: number;
}

export interface District {
  id: number;
  name: string;
  regency_id: number;
}

export interface ProvinceListResponse {
  success: boolean;
  message: string;
  data: Province[];
}

export interface RegencyListResponse {
  success: boolean;
  message: string;
  data: Regency[];
}

export interface DistrictListResponse {
  success: boolean;
  message: string;
  data: District[];
}

// Tag type for shipping options
export interface Tag {
  label: string;
  type: "warning" | "info" | "default" | "success";
}

// Shipping option type (for future use, not dummy data)
export interface ShippingOption {
  id: string;
  name: string;
  logo: string;
  price: string;
  originalPrice?: string;
  duration: string;
  recommended?: boolean;
  available: boolean;
  tags?: Tag[];
  /** Field Addpostingdoc dari response cek ongkir Pos (jika format serviceCode + fee camelCase) */
  posIndonesiaPosting?: {
    serviceCode: number;
    fee: number;
    feeTax: number;
    insurance: number;
    insuranceTax: number;
    totalFee: number;
  };
}

// Service types for tabs
export const serviceTypes = [
  { id: "economy", name: "Economy" },
  { id: "regular", name: "Regular" },
  { id: "cargo", name: "Cargo" },
];

// Sort options for shipping results
export const sortOptions = [
  { value: "cheapest", label: "Harga Termurah" },
  { value: "fastest", label: "Waktu Tersingkat" },
  { value: "recommended", label: "Rekomendasi" },
];
