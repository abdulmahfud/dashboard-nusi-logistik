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
    destination_location?: string;
    deliverySuccessTime?: string;
    diterimaPenerima?: boolean;
    usernameDeliveredBy?: string;
  };
  koli?: Array<{
    koli_description?: string;
    koli_weight?: number;
    koli_code?: string;
  }>;
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

  // Get current location
  const currentLocationObj = posResponse.current_location || 
    (typeof posResponse.currentLocation === "object" ? posResponse.currentLocation : null);
  const currentLocationName = currentLocationObj?.name || 
    (typeof posResponse.currentLocation === "string" ? posResponse.currentLocation : null) ||
    posResponse.location_name || null;

  // Transform tracking history
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
      image_url: item.photo || null,
    };
  });

  // Extract city from location name (e.g., "KC SURABAYASELATAN 60300" -> "SURABAYA")
  function extractCityFromLocation(locationName: string | null): string | null {
    if (!locationName) return null;
    // Try to extract city name from location string
    const match = locationName.match(/([A-Z\s]+?)(?:\s+\d+|$)/);
    if (match) {
      return match[1].trim() || null;
    }
    return null;
  }

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
  const customField = posResponse.connote_customfield || {};
  const historyTracking = customField.history_tracking || {};

  // Get delivery info
  const deliveredAt = parsePosDate(pod.timeReceive) || 
    parsePosDate(customField.deliverySuccessTime) || 
    parsePosDate(customField.timeArrived) || null;
  
  const actualReceiver = pod.receiver || lastHistory?.receiver || null;
  const deliveryRelationship = lastHistory?.reason_delivery || null;

  // Get item name from koli
  const itemName = posResponse.koli && posResponse.koli.length > 0 
    ? posResponse.koli[0].koli_description || null 
    : customField.Jenis_Barang || null;

  // Get total weight from koli or actual_weight
  const totalWeight = posResponse.koli && posResponse.koli.length > 0
    ? posResponse.koli.reduce((sum, k) => sum + (k.koli_weight || 0), 0)
    : posResponse.actual_weight || null;

  // Get driver info from last history or custom field
  const deliveryDriverUsername = customField.usernameDeliveredBy || lastHistory?.username || null;
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
      cod_value: 0,
      insurance_cost: 0,
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
      estimated_delivery: parsePosDate(customField.timePredictionArrived) || 
        parsePosDate(posResponse.connote_sla_date) || null,
      delivered_at: deliveredAt,
      delivered_to: actualReceiver || null,
      delivery_relationship: deliveryRelationship || null,
      pod_status_code: lastHistory?.reason_delivery_code || null,
      pod_status_name: lastHistory?.reason_delivery || null,
      proof_of_delivery: {
        signature_url: pod.signature || null,
        photo_url: pod.photo || null,
        signature_pod: pod.signature ? [pod.signature] : [],
        photo_pod: pod.photo ? [pod.photo] : [],
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
  return (
    (obj.connote_code !== undefined || obj.connote_booking_code !== undefined) &&
    (obj.connote_history !== undefined || obj.connote_state !== undefined)
  );
}
