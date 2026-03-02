import type { StandardizedTrackingResponse, StandardizedTrackingData } from "@/types/tracking";

/**
 * JNE Tracking Response Structure (from API)
 */
export interface JneTrackingResponse {
  cnote: {
    cnote_no: string;
    reference_number?: string;
    cnote_origin?: string;
    cnote_destination?: string;
    cnote_services_code?: string;
    servicetype?: string;
    cnote_cust_no?: string;
    cnote_date?: string;
    cnote_pod_receiver?: string;
    cnote_receiver_name?: string;
    city_name?: string;
    cnote_pod_date?: string;
    pod_status?: string;
    last_status?: string;
    cust_type?: string;
    cnote_amount?: string;
    cnote_weight?: string;
    pod_code?: string;
    keterangan?: string;
    cnote_goods_descr?: string;
    freight_charge?: string;
    shippingcost?: string;
    insuranceamount?: string;
    priceperkg?: string;
    signature?: string;
    photo?: string;
    long?: string;
    lat?: string;
    estimate_delivery?: string;
  };
  detail?: Array<{
    cnote_no?: string;
    cnote_date?: string;
    cnote_weight?: string;
    cnote_origin?: string;
    cnote_shipper_name?: string;
    cnote_shipper_addr1?: string;
    cnote_shipper_addr2?: string | null;
    cnote_shipper_addr3?: string | null;
    cnote_shipper_city?: string;
    cnote_receiver_name?: string;
    cnote_receiver_addr1?: string;
    cnote_receiver_addr2?: string | null;
    cnote_receiver_addr3?: string | null;
    cnote_receiver_city?: string;
  }>;
  history?: Array<{
    date?: string;
    desc?: string;
    code?: string;
  }>;
}

/**
 * Transform JNE raw response to standardized tracking response format
 */
export function transformJneTrackingResponse(
  jneResponse: JneTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const { cnote, detail, history } = jneResponse;

  // Get detail info (first item if available)
  const detailInfo = detail && detail.length > 0 ? detail[0] : null;

  // Parse date from JNE format (DD-MM-YYYY HH:mm) to ISO format
  const parseJneDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    try {
      // Format: "02-04-2022 17:45" or ISO format
      if (dateStr.includes("T")) {
        return dateStr;
      }
      const [datePart, timePart] = dateStr.split(" ");
      if (datePart && timePart) {
        const [day, month, year] = datePart.split("-");
        return `${year}-${month}-${day}T${timePart}:00+07:00`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Transform tracking history
  const trackingHistory = (history || []).map((item, index) => ({
    sequence: index + 1,
    timestamp: parseJneDate(item.date) || null,
    datetime: parseJneDate(item.date) || null,
    date_time: item.date || null,
    status_code: item.code || null,
    status: item.code || null,
    status_name: item.code || null,
    description: item.desc || null,
    message: item.desc || null,
    location: {
      hub_name: null,
      city: extractCityFromDescription(item.desc || ""),
      city_name: extractCityFromDescription(item.desc || ""),
      province: null,
      district: null,
      branch_name: null,
      store_name: null,
      next_site: null,
      next_branch: null,
    },
    driver: {
      name: null,
      phone: null,
      photo: null,
    },
    recipient: null,
    note: null,
    image_url: null,
  }));

  // Extract city from description (format: "[CITY, PROVINCE]")
  function extractCityFromDescription(desc: string): string | null {
    const match = desc.match(/\[([^\]]+)\]/);
    if (match) {
      const location = match[1].split(",")[0].trim();
      return location || null;
    }
    return null;
  }

  // Get current status from last history item or cnote
  const lastHistory = history && history.length > 0 ? history[history.length - 1] : null;
  const currentStatus = {
    code: cnote.pod_code || lastHistory?.code || null,
    status: cnote.pod_status || null,
    description: cnote.last_status || lastHistory?.desc || null,
    timestamp: parseJneDate(cnote.cnote_pod_date) || parseJneDate(lastHistory?.date) || null,
    datetime: parseJneDate(cnote.cnote_pod_date) || parseJneDate(lastHistory?.date) || null,
  };

  // Build standardized tracking data
  const trackingData: StandardizedTrackingData = {
    vendor: "jne",
    vendor_name: "JNE Express",
    reference_no: cnote.reference_number || null,
    awb_no: cnote.cnote_no || awbNo,
    waybill_no: cnote.cnote_no || null,
    current_status: currentStatus,
    shipment: {
      service_code: cnote.cnote_services_code || cnote.servicetype || null,
      service_name: cnote.servicetype || cnote.cnote_services_code || null,
      weight: cnote.cnote_weight ? parseFloat(cnote.cnote_weight) : null,
      weight_unit: "kg",
      pieces: 1,
      koli: 1,
      service_fee: cnote.freight_charge ? parseFloat(cnote.freight_charge) : null,
      shipping_cost: cnote.shippingcost ? parseFloat(cnote.shippingcost) : null,
      cod_value: 0,
      insurance_cost: cnote.insuranceamount ? parseFloat(cnote.insuranceamount) : 0,
      total_amount: cnote.cnote_amount ? parseFloat(cnote.cnote_amount) : null,
      booking_id: null,
      invoice_no: null,
      shipped_date: parseJneDate(cnote.cnote_date) || null,
      item_name: cnote.cnote_goods_descr || null,
    },
    sender: {
      name: detailInfo?.cnote_shipper_name || null,
      phone: null,
      address: [
        detailInfo?.cnote_shipper_addr1,
        detailInfo?.cnote_shipper_addr2,
        detailInfo?.cnote_shipper_addr3,
      ]
        .filter(Boolean)
        .join(", ") || null,
      postcode: null,
      city: detailInfo?.cnote_shipper_city || null,
      province: null,
      district: null,
      zipcode: null,
    },
    receiver: {
      name: cnote.cnote_receiver_name || detailInfo?.cnote_receiver_name || null,
      phone: null,
      address: [
        detailInfo?.cnote_receiver_addr1,
        detailInfo?.cnote_receiver_addr2,
        detailInfo?.cnote_receiver_addr3,
      ]
        .filter(Boolean)
        .join(", ") || null,
      postcode: null,
      city: cnote.city_name || detailInfo?.cnote_receiver_city || null,
      province: null,
      district: null,
      zipcode: null,
      actual_receiver: cnote.cnote_pod_receiver
        ? {
            name: cnote.cnote_pod_receiver,
            relationship: null,
          }
        : null,
    },
    tracking_history: trackingHistory,
    delivery: {
      estimated_delivery: cnote.estimate_delivery || null,
      delivered_at: parseJneDate(cnote.cnote_pod_date) || null,
      delivered_to: cnote.cnote_pod_receiver || null,
      delivery_relationship: null,
      pod_status_code: cnote.pod_code || null,
      pod_status_name: cnote.pod_status || null,
      proof_of_delivery: {
        signature_url: cnote.signature || null,
        photo_url: cnote.photo || null,
        signature_pod: cnote.signature ? [cnote.signature] : [],
        photo_pod: cnote.photo ? [cnote.photo] : [],
      },
    },
    driver_info: {
      pickup_driver: {
        name: null,
        phone: null,
        photo: null,
      },
      delivery_driver: {
        name: null,
        phone: null,
        photo: null,
      },
    },
  };

  return {
    success: true,
    vendor: "jne",
    tracking_data: trackingData,
    order_info: {
      reference_no: cnote.reference_number || "",
      vendor: "jne",
      awb_no: cnote.cnote_no || awbNo,
      status: cnote.pod_status || "unknown",
      created_at: parseJneDate(cnote.cnote_date) || new Date().toISOString(),
      user_id: 0,
    },
  };
}

/**
 * Check if response is JNE raw format
 */
export function isJneRawResponse(data: unknown): data is JneTrackingResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.cnote !== undefined &&
    typeof obj.cnote === "object" &&
    obj.cnote !== null &&
    "cnote_no" in obj.cnote
  );
}
