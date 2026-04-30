import type { StandardizedTrackingResponse, StandardizedTrackingData } from "@/types/tracking";

/**
 * AnterAja Tracking Response Structure (from API)
 */
export interface AnterAjaTrackingResponse {
  status?: number;
  info?: string;
  content?: {
    waybill_no?: string;
    history?: Array<{
      hub_name?: string | null;
      message?: {
        id?: string;
      };
      params?: unknown;
      tracking_code?: number;
      timestamp?: string;
    }>;
    order?: {
      booking_id?: string;
      waybill?: string;
      service_code?: string;
      service_fee?: number;
      weight?: number;
      invoice?: string;
      shipper?: {
        name?: string;
        phone?: string;
        address?: string;
        postcode?: string;
      };
      receiver?: {
        name?: string;
        phone?: string;
        address?: string;
        postcode?: string;
      };
      actual_shipper?: {
        name?: string | null;
        relationship?: string | null;
        proof_images?: string[];
        proof_images_url?: string[];
      };
      actual_receiver?: {
        name?: string | null;
        relationship?: string | null;
        proof_images?: string[];
        proof_images_url?: string[];
      };
    };
  };
}

/**
 * Transform AnterAja raw response to standardized tracking response format
 */
export function transformAnterAjaTrackingResponse(
  anterajaResponse: AnterAjaTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const content = anterajaResponse.content;
  if (!content) {
    throw new Error("Invalid AnterAja response: missing content");
  }

  const order = content.order;
  const history = content.history || [];
  const hasTrackingData = Boolean(order) || history.length > 0;

  // Parse date from AnterAja format to ISO format
  const parseAnterAjaDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    try {
      // Format: "2021-04-06T10:45:03.949+0000" (already ISO-like)
      if (dateStr.includes("T")) {
        // Convert +0000 to +00:00 format
        if (dateStr.match(/\+0000$/)) {
          return dateStr.replace(/\+0000$/, "+00:00");
        }
        return dateStr;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Map tracking code to status name
  const getStatusFromCode = (code: number | undefined): string | null => {
    if (!code) return null;
    
    const statusMap: Record<number, string> = {
      100: "PICKUP_REQUESTED",
      150: "PICKUP_ASSIGNED",
      160: "PICKUP_TAKEN",
      200: "PICKED_UP",
      210: "ARRIVED_AT_SS",
      220: "ARRIVED_AT_HUB",
      230: "ARRIVED_AT_DELIVERY_SS",
      240: "DELIVERY_ASSIGNED",
      250: "DELIVERED",
      300: "PROCESSING",
      330: "IN_TRANSIT",
    };

    return statusMap[code] || `STATUS_${code}`;
  };

  // Transform tracking history (reverse order - newest first in API, but we want oldest first)
  const trackingHistory = [...history].reverse().map((item, index) => {
    const message = item.message?.id || "";
    
    // Extract driver name from message if available
    const driverMatch = message.match(/([A-Z\s]+)\s+(sudah|akan|sedang|Delivery)/i);
    const driverName = driverMatch ? driverMatch[1].trim() : null;
    
    // Extract receiver info from delivery message
    const receiverMatch = message.match(/diterima oleh\s+([^(]+)/i);
    const receiverName = receiverMatch ? receiverMatch[1].trim() : null;
    const relationshipMatch = message.match(/\(([^)]+)\)/);
    const relationship = relationshipMatch ? relationshipMatch[1].trim() : null;

    return {
      sequence: index + 1,
      timestamp: parseAnterAjaDate(item.timestamp) || null,
      datetime: parseAnterAjaDate(item.timestamp) || null,
      date_time: item.timestamp || null,
      status_code: item.tracking_code?.toString() || null,
      status: getStatusFromCode(item.tracking_code) || null,
      status_name: getStatusFromCode(item.tracking_code) || null,
      description: message || null,
      message: message || null,
      location: {
        hub_name: item.hub_name || null,
        city: extractCityFromHub(item.hub_name) || null,
        city_name: extractCityFromHub(item.hub_name) || null,
        province: null,
        district: null,
        branch_name: item.hub_name || null,
        store_name: null,
        next_site: null,
        next_branch: null,
      },
      driver: {
        name: driverName,
        phone: null,
        photo: null,
      },
      recipient: receiverName ? {
        name: receiverName,
        relationship: relationship,
      } : null,
      note: null,
      image_url: null,
    };
  });

  // Extract city from hub name (e.g., "Hub Halim" -> null, "LH8 Kota Jkt Tmr - Kebon Pala" -> "Jakarta Timur")
  function extractCityFromHub(hubName: string | null | undefined): string | null {
    if (!hubName) return null;
    
    // Try to extract city name from hub string
    const cityMatch = hubName.match(/Kota\s+([^-]+)/i);
    if (cityMatch) {
      return cityMatch[1].trim();
    }
    
    // Check for common city patterns
    if (hubName.includes("Jakarta")) return "Jakarta";
    if (hubName.includes("Bekasi")) return "Bekasi";
    if (hubName.includes("Surabaya")) return "Surabaya";
    if (hubName.includes("Bandung")) return "Bandung";
    
    return null;
  }

  // Get current status from first history item (newest)
  const lastHistory = history.length > 0 ? history[0] : null;
  const currentStatus = {
    code: lastHistory?.tracking_code?.toString() || null,
    status: getStatusFromCode(lastHistory?.tracking_code) || null,
    description: lastHistory?.message?.id || null,
    timestamp: parseAnterAjaDate(lastHistory?.timestamp) || null,
    datetime: parseAnterAjaDate(lastHistory?.timestamp) || null,
  };

  // Get delivery info
  const deliveredHistory = history.find(h => h.tracking_code === 250);
  const deliveredAt = deliveredHistory 
    ? parseAnterAjaDate(deliveredHistory.timestamp) 
    : null;
  
  const actualReceiver = order?.actual_receiver;
  const deliveredTo = actualReceiver?.name || 
    (deliveredHistory?.message?.id?.match(/diterima oleh\s+([^(]+)/i)?.[1]?.trim()) || null;
  const deliveryRelationship = actualReceiver?.relationship || 
    (deliveredHistory?.message?.id?.match(/\(([^)]+)\)/)?.[1]?.trim()) || null;

  // Get POD images
  const podImages = actualReceiver?.proof_images_url || [];
  const podPhoto = podImages.length > 0 ? podImages[0] : null;

  // Get delivery driver from history
  const deliveryHistory = history.find(h => h.tracking_code === 240 || h.tracking_code === 250);
  const deliveryDriverMatch = deliveryHistory?.message?.id?.match(/([A-Z\s]+)\s+(sudah|Delivery)/i);
  const deliveryDriverName = deliveryDriverMatch ? deliveryDriverMatch[1].trim() : null;

  // Get pickup driver from history
  const pickupHistory = history.find(h => h.tracking_code === 200);
  const pickupDriverMatch = pickupHistory?.message?.id?.match(/([A-Z\s]+)\s+(sudah|akan)/i);
  const pickupDriverName = pickupDriverMatch ? pickupDriverMatch[1].trim() : null;

  // Convert weight from grams to kg
  const weightInKg = order?.weight ? order.weight / 1000 : null;

  // Build standardized tracking data
  const trackingData: StandardizedTrackingData = {
    vendor: "anteraja",
    vendor_name: "AnterAja",
    reference_no: order?.booking_id || null,
    awb_no: content.waybill_no || order?.waybill || awbNo,
    waybill_no: content.waybill_no || order?.waybill || null,
    current_status: currentStatus,
    shipment: {
      service_code: order?.service_code || null,
      service_name: order?.service_code || null,
      weight: weightInKg,
      weight_unit: "kg",
      pieces: 1,
      koli: 1,
      service_fee: order?.service_fee || null,
      shipping_cost: order?.service_fee || null,
      cod_value: 0,
      insurance_cost: 0,
      total_amount: order?.service_fee || null,
      booking_id: order?.booking_id || null,
      invoice_no: order?.invoice || null,
      shipped_date: trackingHistory.length > 0 ? trackingHistory[0].timestamp : null,
      item_name: null,
    },
    sender: {
      name: order?.shipper?.name || null,
      phone: order?.shipper?.phone || null,
      address: order?.shipper?.address || null,
      postcode: order?.shipper?.postcode || null,
      city: extractCityFromAddress(order?.shipper?.address) || null,
      province: null,
      district: null,
      zipcode: order?.shipper?.postcode || null,
    },
    receiver: {
      name: order?.receiver?.name || null,
      phone: order?.receiver?.phone || null,
      address: order?.receiver?.address || null,
      postcode: order?.receiver?.postcode || null,
      city: extractCityFromAddress(order?.receiver?.address) || null,
      province: null,
      district: null,
      zipcode: order?.receiver?.postcode || null,
      actual_receiver: deliveredTo ? {
        name: deliveredTo,
        relationship: deliveryRelationship,
      } : null,
    },
    tracking_history: trackingHistory,
    delivery: {
      estimated_delivery: null,
      delivered_at: deliveredAt,
      delivered_to: deliveredTo || null,
      delivery_relationship: deliveryRelationship || null,
      pod_status_code: deliveredHistory?.tracking_code?.toString() || null,
      pod_status_name: getStatusFromCode(deliveredHistory?.tracking_code) || null,
      proof_of_delivery: {
        signature_url: null,
        photo_url: podPhoto || null,
        signature_pod: [],
        photo_pod: podImages || [],
      },
    },
    driver_info: {
      pickup_driver: {
        name: pickupDriverName,
        phone: null,
        photo: null,
      },
      delivery_driver: {
        name: deliveryDriverName,
        phone: null,
        photo: null,
      },
    },
  };

  return {
    success: hasTrackingData,
    vendor: "anteraja",
    tracking_data: trackingData,
    order_info: {
      reference_no: order?.booking_id || "",
      vendor: "anteraja",
      awb_no: content.waybill_no || order?.waybill || awbNo,
      status: getStatusFromCode(lastHistory?.tracking_code) || "unknown",
      created_at: trackingHistory.length > 0 ? trackingHistory[0].timestamp || new Date().toISOString() : new Date().toISOString(),
      user_id: 0,
    },
  };
}

/**
 * Extract city from address string
 */
function extractCityFromAddress(address: string | undefined): string | null {
  if (!address) return null;
  
  // Try to extract city from address pattern: "Kota Bekasi" or "Jakarta Timur"
  const cityMatch = address.match(/(?:Kota|Jakarta|Kabupaten)\s+([^,]+)/i);
  if (cityMatch) {
    return cityMatch[1].trim();
  }
  
  return null;
}

/**
 * Check if response is AnterAja raw format
 */
export function isAnterAjaRawResponse(data: unknown): data is AnterAjaTrackingResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  
  // Check for AnterAja structure
  if (obj.status !== undefined && obj.content !== undefined) {
    const content = obj.content as Record<string, unknown>;
    return (
      content.waybill_no !== undefined ||
      (content.order !== undefined && typeof content.order === "object")
    );
  }
  
  return false;
}
