// API Response Types
export interface OrderUser {
  id: number;
  name: string;
  email: string;
}

export interface OrderPickup {
  name: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  contact: string | null;
  district_code: string | null;
}

export interface OrderShipper {
  name: string;
  address: string;
  phone: string;
  contact: string | null;
}

export interface OrderReceiver {
  name: string;
  address: string;
  phone: string;
  contact: string;
}

export interface Order {
  id: number;
  vendor: string;
  reference_no: string;
  awb_no: string;
  status: string;
  service_type_code: string;
  shipment_type: string;
  cod_value: string;
  item_value: string;
  pickup: OrderPickup;
  shipper: OrderShipper;
  receiver: OrderReceiver;
  user: OrderUser;
  created_at: string;
  request_payload?: Record<string, unknown>;
}

export interface OrderListResponse {
  data: Order[];
}

// Table Display Types
export interface DeliveryReport {
  orderId: number; // Add order ID for label download
  createdAt: string;
  shipmentNo: string;
  packageType: "Paket Reguler" | "Paket Instant" | "COD";
  recipient: string;
  courierService: string;
  totalShipment: number;
  shippingMethod: "COD" | "REGULER";
  service: "DROPOFF" | "PICKUP";
  status: string;
  vendor: string; // Add vendor field for label URL functionality
}

// Status mapping
export const STATUS_MAPPING: Record<string, string> = {
  menunggu_pembayaran: "Menunggu Pembayaran",
  belum_proses: "Belum Proses",
  belum_di_expedisi: "Belum di Expedisi",
  proses_pengiriman: "Proses Pengiriman",
  kendala_pengiriman: "Kendala Pengiriman",
  sampai_tujuan: "Sampai Tujuan",
  retur: "Retur",
  dibatalkan: "Dibatalkan",
};

// Vendor mapping
export const VENDOR_MAPPING: Record<string, string> = {
  JNTEXPRESS: "J&T Express",
  JNE: "JNE - Reguler",
  SICEPAT: "SiCepat - Best",
  TIKI: "TIKI - ONS",
  NINJA: "Ninja Xpress",
  ANTERAJA: "AnterAja - Same Day",
  SAP: "SAP Express",
};
