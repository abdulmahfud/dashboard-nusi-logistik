import type { StandardizedTrackingResponse, StandardizedTrackingData } from "@/types/tracking";

/**
 * Pos Indonesia Tracking Response Structure (from API)
 */
export interface PosIndonesiaTrackingResponse {
  connote_id?: string;
  connote_number?: number;
  connote_code?: string;
  connote_booking_code?: string;
  connote_order?: number;
  connote_state?: string;
  connote_state_id?: number;
  connote_sender_name?: string;
  connote_sender_phone?: string;
  connote_sender_email?: string;
  connote_sender_address?: string;
  connote_sender_zipcode?: string;
  connote_receiver_name?: string;
  connote_receiver_phone?: string;
  connote_receiver_email?: string;
  connote_receiver_address?: string;
  connote_receiver_address_detail?: string;
  connote_receiver_zipcode?: string;
  connote_service?: string;
  connote_service_price?: number;
  connote_amount?: number;
  actual_weight?: number;
  volume_weight?: number;
  chargeable_weight?: number;
  connote_total_package?: string;
  connote_sla_day?: string;
  connote_sla_date?: string;
  connote_surcharge_amount?: string | number;
  created_at?: string;
  updated_at?: string;
  location_name?: string;
  location_type?: string;
  currentLocation?: string | {
    name?: string;
    code?: string;
    location_type?: string;
    type?: string;
    full_name?: string;
    last_updated?: string;
  };
  current_location?: {
    name?: string;
    code?: string;
    location_type?: string;
    type?: string;
    full_name?: string;
    last_updated?: string;
  };
  pod?: {
    photo?: string;
    signature?: string;
    timeReceive?: string;
    receiver?: string;
    coordinate?: string;
    reason?: string;
    additional_photo?: string[];
  };
  connote_history?: Array<{
    _id?: string;
    content?: string;
    content2?: string;
    state?: string;
    action?: string;
    code?: string;
    coordinate?: string;
    date?: string;
    username?: string;
    location_name?: string;
    connote_state?: string;
    connote_code?: string;
    photo?: string | null;
    signature?: string | null;
    receiver?: string;
    reason_delivery?: string;
    reason_delivery_code?: string;
    city?: string;
    created_at?: string;
    updated_at?: string;
  }>;
  connote_customfield?: {
    Jenis_Barang?: string;
    history_tracking?: {
      coordinate?: string;
      last_unbag?: string;
      last_inlocation?: string;
    };
    timeArrived?: string;
    timePredictionArrived?: string;
    final_swp_date_new?: string;
    destination_location?: string;
    deliverySuccessTime?: string;
    diterimaPenerima?: boolean;
    usernameDeliveredBy?: string;
    reason_failedtodelivered?: string;
  };
  koli?: Array<{
    koli_description?: string;
    koli_weight?: number;
    koli_code?: string;
  }>;
  custom_field?: string | Record<string, unknown>;
}

type PosCustomField = NonNullable<PosIndonesiaTrackingResponse["connote_customfield"]> & {
  COD?: string;
  cod_value?: number | null;
  total_cod?: number;
  reason_failedtodelivered?: string;
  final_swp_date_new?: string;
};

function parseJsonField<T extends Record<string, unknown>>(
  value: unknown
): T | null {
  if (!value) return null;
  if (typeof value === "object" && !Array.isArray(value)) {
    return value as T;
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as T;
      }
    } catch {
      return null;
    }
  }
  return null;
}

function extractCityFromLocation(locationName: string | null): string | null {
  if (!locationName) return null;
  const match = locationName.match(/([A-Z\s]+?)(?:\s+\d+|$)/);
  if (match) {
    return match[1].trim() || null;
  }
  return null;
}

function resolveCurrentLocation(
  posResponse: PosIndonesiaTrackingResponse
): { name?: string; code?: string; location_type?: string } | null {
  if (posResponse.current_location && typeof posResponse.current_location === "object") {
    return posResponse.current_location;
  }
  if (typeof posResponse.currentLocation === "object" && posResponse.currentLocation) {
    return posResponse.currentLocation;
  }
  if (typeof posResponse.currentLocation === "string") {
    const parsed = parseJsonField<{ name?: string; code?: string; location_type?: string }>(
      posResponse.currentLocation
    );
    if (parsed) return parsed;
  }
  return null;
}

function resolveCustomField(posResponse: PosIndonesiaTrackingResponse): PosCustomField {
  const fromObject = posResponse.connote_customfield ?? {};
  const fromString = parseJsonField<PosCustomField>(posResponse.custom_field);
  return { ...fromString, ...fromObject };
}

/**
 * Ambil payload tracking Pos dari response BE (flat atau { data: {...} }).
 */
export function unwrapPosIndonesiaTrackingPayload(
  input: unknown
): PosIndonesiaTrackingResponse | null {
  if (isPosIndonesiaRawResponse(input)) {
    return input;
  }
  if (input && typeof input === "object") {
    const root = input as Record<string, unknown>;
    if (root.data && isPosIndonesiaRawResponse(root.data)) {
      return root.data;
    }
    const td = root.tracking_data;
    if (td && typeof td === "object") {
      const inner = (td as Record<string, unknown>).data;
      if (isPosIndonesiaRawResponse(inner)) {
        return inner;
      }
    }
  }
  return null;
}

/** Response BE `/admin/tracking`: connote di `tracking_data.data` (lihat docs/pos/network-tracking.md) */
export type PosIndonesiaBeTrackingWrapper = {
  success?: boolean;
  vendor?: string;
  tracking_data: {
    status?: string;
    message?: string;
    reference_no?: string;
    data: PosIndonesiaTrackingResponse;
  };
  order_info?: {
    reference_no?: string;
    vendor?: string;
    awb_no?: string | null;
    status?: string;
    created_at?: string;
    user_id?: number;
  };
};

export function isPosIndonesiaBeTrackingWrapper(
  response: unknown
): response is PosIndonesiaBeTrackingWrapper {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  const td = r.tracking_data;
  if (!td || typeof td !== "object") return false;
  return isPosIndonesiaRawResponse((td as Record<string, unknown>).data);
}

export function transformPosIndonesiaBeTrackingWrapper(
  apiResponse: PosIndonesiaBeTrackingWrapper,
  awbNo: string
): StandardizedTrackingResponse {
  const connote = apiResponse.tracking_data.data;
  const resi = connote.connote_code || awbNo;
  const result = transformPosIndonesiaTrackingResponse(connote, resi);

  result.success = apiResponse.success !== false;
  const vendorKey = String(apiResponse.vendor ?? "pos_indonesia")
    .toLowerCase()
    .replace(/_/g, "");
  result.vendor =
    vendorKey === "posindonesia" ? "pos_indonesia" : String(apiResponse.vendor ?? "pos_indonesia").toLowerCase();
  result.tracking_data.vendor = result.vendor;

  const ref =
    apiResponse.tracking_data.reference_no ||
    apiResponse.order_info?.reference_no ||
    connote.connote_booking_code ||
    null;
  if (ref) {
    result.tracking_data.reference_no = ref;
  }
  result.tracking_data.awb_no = connote.connote_code || result.tracking_data.awb_no;

  const oi = apiResponse.order_info;
  if (oi) {
    result.order_info = {
      reference_no: String(oi.reference_no ?? ref ?? ""),
      vendor: String(oi.vendor ?? apiResponse.vendor ?? "POSINDONESIA"),
      awb_no: connote.connote_code ?? oi.awb_no ?? resi,
      status: String(oi.status ?? result.order_info.status),
      created_at: String(oi.created_at ?? result.order_info.created_at),
      user_id: Number(oi.user_id ?? 0),
    };
  }

  return result;
}

/**
 * Transform Pos Indonesia raw response to standardized tracking response format
 */
export function transformPosIndonesiaTrackingResponse(
  posResponse: PosIndonesiaTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  // Parse date from Pos Indonesia format to ISO format
  const parsePosDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    try {
      // Format: "2024-11-25 18:42:16" or ISO format
      if (dateStr.includes("T")) {
        return dateStr;
      }
      // Convert "YYYY-MM-DD HH:mm:ss" to ISO format
      if (dateStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        return dateStr.replace(" ", "T") + "+07:00";
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  const currentLocationObj = resolveCurrentLocation(posResponse);
  const currentLocationName =
    currentLocationObj?.name || posResponse.location_name || null;

  const customField = resolveCustomField(posResponse);
  const codValue = Number(customField.cod_value ?? 0);
  const isCod =
    typeof customField.COD === "string" &&
    customField.COD.toUpperCase().replace(/\s/g, "") !== "NON-COD";

  // Transform tracking history (urutan API: kronologis, sesuai connote_history di docs)
  const trackingHistory = (posResponse.connote_history || []).map((item, index) => {
    const locationName = item.location_name || currentLocationName;
    const city = item.city || extractCityFromLocation(locationName);
    
    return {
      sequence: index + 1,
      timestamp: parsePosDate(item.date || item.created_at) || null,
      datetime: parsePosDate(item.date || item.created_at) || null,
      date_time: item.date || item.created_at || null,
      status_code: item.state || item.action || null,
      status: item.state || null,
      status_name: item.action || null,
      description: item.content || null,
      message: item.content2 || item.content || null,
      location: {
        hub_name: locationName || null,
        city: city,
        city_name: city,
        province: null,
        district: null,
        branch_name: locationName || null,
        store_name: null,
        next_site: null,
        next_branch: null,
      },
      driver: {
        name: item.username || null,
        phone: null,
        photo: null,
      },
      recipient: item.receiver ? {
        name: item.receiver,
        relationship: item.reason_delivery || null,
      } : null,
      note: item.reason_delivery || null,
      image_url: item.photo || item.signature || null,
    };
  });

  // Get current status from connote_state or last history item
  const lastHistory = posResponse.connote_history && posResponse.connote_history.length > 0 
    ? posResponse.connote_history[posResponse.connote_history.length - 1] 
    : null;
  
  const currentStatus = {
    code: posResponse.connote_state_id?.toString() || posResponse.connote_state || lastHistory?.state || null,
    status: posResponse.connote_state || lastHistory?.state || null,
    description: lastHistory?.content || posResponse.connote_state || null,
    timestamp: parsePosDate(lastHistory?.date || lastHistory?.created_at) || parsePosDate(posResponse.updated_at) || null,
    datetime: parsePosDate(lastHistory?.date || lastHistory?.created_at) || parsePosDate(posResponse.updated_at) || null,
  };

  // Get POD info
  const pod = posResponse.pod || {};

  // Get delivery info
  const deliveredAt = parsePosDate(pod.timeReceive) || 
    parsePosDate(customField.deliverySuccessTime) || 
    parsePosDate(customField.timeArrived) || null;
  
  const rawReceiver = pod.receiver || lastHistory?.receiver || null;
  const actualReceiver =
    rawReceiver && rawReceiver !== "-" ? rawReceiver : null;
  const deliveryRelationship =
    lastHistory?.reason_delivery ||
    pod.reason ||
    customField.reason_failedtodelivered ||
    null;

  // Get item name from koli
  const itemName = posResponse.koli && posResponse.koli.length > 0 
    ? posResponse.koli[0].koli_description || null 
    : customField.Jenis_Barang || null;

  // Get total weight from koli or actual_weight
  const totalWeight = posResponse.koli && posResponse.koli.length > 0
    ? posResponse.koli.reduce((sum, k) => sum + (k.koli_weight || 0), 0)
    : posResponse.actual_weight || null;

  // Get driver info from last history or custom field
  const deliveryDriverName = lastHistory?.username || null;

  // Build standardized tracking data
  const trackingData: StandardizedTrackingData = {
    vendor: "pos_indonesia",
    vendor_name: "Pos Indonesia",
    reference_no: posResponse.connote_booking_code || null,
    awb_no: posResponse.connote_code || awbNo,
    waybill_no: posResponse.connote_code || null,
    current_status: currentStatus,
    shipment: {
      service_code: posResponse.connote_service || null,
      service_name: posResponse.connote_service || null,
      weight: totalWeight,
      weight_unit: "kg",
      pieces: parseInt(posResponse.connote_total_package || "1") || 1,
      koli: posResponse.koli?.length || parseInt(posResponse.connote_total_package || "1") || 1,
      service_fee: posResponse.connote_service_price || null,
      shipping_cost: posResponse.connote_amount || posResponse.connote_service_price || null,
      cod_value: isCod ? codValue || Number(customField.total_cod ?? 0) : 0,
      insurance_cost: Number(posResponse.connote_surcharge_amount ?? 0) || 0,
      total_amount: posResponse.connote_amount || null,
      booking_id: posResponse.connote_booking_code || null,
      invoice_no: null,
      shipped_date: parsePosDate(posResponse.created_at) || null,
      item_name: itemName,
    },
    sender: {
      name: posResponse.connote_sender_name || null,
      phone: posResponse.connote_sender_phone || null,
      address: posResponse.connote_sender_address || null,
      postcode: posResponse.connote_sender_zipcode || null,
      city: null,
      province: null,
      district: null,
      zipcode: posResponse.connote_sender_zipcode || null,
    },
    receiver: {
      name: posResponse.connote_receiver_name || null,
      phone: posResponse.connote_receiver_phone || null,
      address: [
        posResponse.connote_receiver_address,
        posResponse.connote_receiver_address_detail,
      ]
        .filter(Boolean)
        .join(", ") || null,
      postcode: posResponse.connote_receiver_zipcode || null,
      city: null,
      province: null,
      district: null,
      zipcode: posResponse.connote_receiver_zipcode || null,
      actual_receiver: actualReceiver ? {
        name: actualReceiver,
        relationship: deliveryRelationship,
      } : null,
    },
    tracking_history: trackingHistory,
    delivery: {
      estimated_delivery:
        parsePosDate(customField.timePredictionArrived) ||
        parsePosDate(customField.final_swp_date_new) ||
        parsePosDate(posResponse.connote_sla_date) ||
        null,
      delivered_at: deliveredAt,
      delivered_to: actualReceiver || null,
      delivery_relationship: deliveryRelationship || null,
      pod_status_code: lastHistory?.reason_delivery_code || null,
      pod_status_name:
        lastHistory?.reason_delivery ||
        pod.reason ||
        customField.reason_failedtodelivered ||
        null,
      proof_of_delivery: {
        signature_url: pod.signature || null,
        photo_url: pod.photo || null,
        signature_pod: pod.signature ? [pod.signature] : [],
        photo_pod: [
          ...(pod.photo ? [pod.photo] : []),
          ...(Array.isArray(pod.additional_photo) ? pod.additional_photo : []),
        ],
      },
    },
    driver_info: {
      pickup_driver: {
        name: null,
        phone: null,
        photo: null,
      },
      delivery_driver: {
        name: deliveryDriverName || null,
        phone: null,
        photo: null,
      },
    },
  };

  return {
    success: true,
    vendor: "pos_indonesia",
    tracking_data: trackingData,
    order_info: {
      reference_no: posResponse.connote_booking_code || "",
      vendor: "pos_indonesia",
      awb_no: posResponse.connote_code || awbNo,
      status: posResponse.connote_state || "unknown",
      created_at: parsePosDate(posResponse.created_at) || new Date().toISOString(),
      user_id: 0,
    },
  };
}

/**
 * Check if response is Pos Indonesia raw format
 */
export function isPosIndonesiaRawResponse(data: unknown): data is PosIndonesiaTrackingResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  const hasConnoteId =
    obj.connote_code != null ||
    obj.connote_booking_code != null ||
    obj.connote_id != null;
  const hasTrackingBody =
    Array.isArray(obj.connote_history) ||
    obj.connote_state != null ||
    obj.connote_sender_name != null;
  return hasConnoteId && hasTrackingBody;
}
