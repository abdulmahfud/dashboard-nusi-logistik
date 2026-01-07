// Standardized tracking response types
export interface StandardizedTrackingResponse {
  success: boolean;
  vendor: string;
  tracking_data: StandardizedTrackingData;
  order_info: OrderInfo;
}

export interface OrderInfo {
  reference_no: string;
  vendor: string;
  awb_no: string | null;
  status: string;
  created_at: string;
  user_id: number;
}

export interface StandardizedTrackingData {
  vendor: string;
  vendor_name: string;
  reference_no: string | null;
  awb_no: string | null;
  waybill_no: string | null;
  current_status: CurrentStatus;
  shipment: Shipment;
  sender: AddressInfo;
  receiver: ReceiverInfo;
  tracking_history: TrackingHistoryItem[];
  delivery: DeliveryInfo;
  driver_info: DriverInfo;
}

export interface CurrentStatus {
  code: string | null;
  status: string | null;
  description: string | null;
  timestamp: string | null;
  datetime: string | null;
}

export interface Shipment {
  service_code: string | null;
  service_name: string | null;
  weight: number | null;
  weight_unit: string;
  pieces: number;
  koli: number;
  service_fee: number | null;
  shipping_cost: number | null;
  cod_value: number;
  insurance_cost: number;
  total_amount: number | null;
  booking_id: string | null;
  invoice_no: string | null;
  shipped_date: string | null;
  item_name: string | null;
}

export interface ReceiverInfo extends AddressInfo {
  actual_receiver: {
    name: string;
    relationship: string | null;
  } | null;
}

export interface AddressInfo {
  name: string | null;
  phone: string | null;
  address: string | null;
  postcode: string | null;
  city: string | null;
  province: string | null;
  district: string | null;
  zipcode: string | null;
}

export interface TrackingHistoryItem {
  sequence: number;
  timestamp: string | null;
  datetime: string | null;
  date_time: string | null;
  status_code: string | null;
  status: string | null;
  status_name: string | null;
  description: string | null;
  message: string | null;
  location: LocationInfo;
  driver: DriverDetails;
  recipient: {
    name: string;
    relationship: string | null;
  } | null;
  note: string | null;
  image_url: string | null;
}

export interface LocationInfo {
  hub_name: string | null;
  city: string | null;
  city_name: string | null;
  province: string | null;
  district: string | null;
  branch_name: string | null;
  store_name: string | null;
  next_site: string | null;
  next_branch: string | null;
}

export interface DeliveryInfo {
  estimated_delivery: string | null;
  delivered_at: string | null;
  delivered_to: string | null;
  delivery_relationship: string | null;
  pod_status_code: string | null;
  pod_status_name: string | null;
  proof_of_delivery: ProofOfDelivery;
}

export interface ProofOfDelivery {
  signature_url: string | null;
  photo_url: string | null;
  signature_pod: string[];
  photo_pod: string[];
}

export interface DriverInfo {
  pickup_driver: DriverDetails;
  delivery_driver: DriverDetails;
}

export interface DriverDetails {
  name: string | null;
  phone: string | null;
  photo: string | null;
}
