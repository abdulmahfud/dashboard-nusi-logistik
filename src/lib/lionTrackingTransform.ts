import type { StandardizedTrackingResponse } from "@/types/tracking";

type LionHistoryItem = {
  row?: number;
  datetime?: string | null;
  status_code?: string | null;
  current_status?: string | null;
  location?: string | null;
  city?: string | null;
  remarks?: string | null;
  attachment?: string[] | null;
  updated_by?: string | null;
  updated_on?: string | null;
  stt_journey_type?: string | null;
  ref_stt_number?: string | null;
  shipment_id?: string | null;
  total_tariff?: number | null;
  courier_name?: string | null;
  received_by?: string | null;
  proof?: {
    attachment_signed?: string[] | null;
    latitude?: number | null;
    longitude?: number | null;
    relation?: string | null;
    name?: string | null;
  } | null;
};

type LionSttItem = {
  stt_no?: string | null;
  sender_name?: string | null;
  recipient_name?: string | null;
  origin?: string | null;
  destination?: string | null;
  current_status?: string | null;
  status_code?: string | null;
  chargeable_weight?: number | null;
  shipment_id?: string | null;
  product_type?: string | null;
  pieces?: number | null;
  volume_weight?: number | null;
  gross_weight?: number | null;
  history?: LionHistoryItem[] | null;
};

export type LionTrackingResponse = {
  stts?: LionSttItem[];
};

export function isLionRawResponse(data: unknown): data is LionTrackingResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.stts) || obj.stts.length === 0) return false;
  const first = obj.stts[0];
  return !!first && typeof first === "object" && "stt_no" in (first as Record<string, unknown>);
}

function toIso(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function transformLionTrackingResponse(
  raw: LionTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const stt = raw.stts?.[0] ?? {};
  const history = Array.isArray(stt.history) ? stt.history : [];
  const sortedHistory = [...history].sort((a, b) => {
    const aTime = new Date(a.datetime || "").getTime();
    const bTime = new Date(b.datetime || "").getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
  const latest = sortedHistory[0];
  const latestIso = toIso(latest?.datetime);

  return {
    success: true,
    vendor: "lion",
    order_info: {
      reference_no: stt.shipment_id || "",
      vendor: "lion",
      awb_no: stt.stt_no || awbNo,
      status: stt.current_status || stt.status_code || "UNKNOWN",
      created_at: latestIso || new Date().toISOString(),
      user_id: 0,
    },
    tracking_data: {
      vendor: "lion",
      vendor_name: "Lion Parcel",
      reference_no: stt.shipment_id || null,
      awb_no: stt.stt_no || awbNo,
      waybill_no: stt.stt_no || awbNo,
      current_status: {
        code: latest?.status_code || stt.status_code || null,
        status: latest?.current_status || stt.current_status || null,
        description: latest?.remarks || null,
        timestamp: latestIso,
        datetime: latestIso,
      },
      shipment: {
        service_code: stt.product_type || null,
        service_name: stt.product_type || "Lion Parcel",
        weight: stt.chargeable_weight ?? stt.gross_weight ?? null,
        weight_unit: "kg",
        pieces: stt.pieces ?? 0,
        koli: stt.pieces ?? 0,
        service_fee: null,
        shipping_cost: latest?.total_tariff ?? null,
        cod_value: 0,
        insurance_cost: 0,
        total_amount: latest?.total_tariff ?? null,
        booking_id: stt.shipment_id || null,
        invoice_no: null,
        shipped_date: latestIso,
        item_name: stt.product_type || null,
      },
      sender: {
        name: stt.sender_name || null,
        phone: null,
        address: stt.origin || null,
        postcode: null,
        city: null,
        province: null,
        district: null,
        zipcode: null,
      },
      receiver: {
        name: stt.recipient_name || null,
        phone: null,
        address: stt.destination || null,
        postcode: null,
        city: null,
        province: null,
        district: null,
        zipcode: null,
        actual_receiver:
          latest?.received_by || latest?.proof?.name
            ? {
                name: latest?.received_by || latest?.proof?.name || "",
                relationship: latest?.proof?.relation || null,
              }
            : null,
      },
      tracking_history: sortedHistory.map((h, idx) => ({
        sequence: idx + 1,
        timestamp: toIso(h.datetime),
        datetime: toIso(h.datetime),
        date_time: h.datetime || null,
        status_code: h.status_code || null,
        status: h.current_status || null,
        status_name: h.current_status || h.status_code || null,
        description: h.remarks || null,
        message: h.remarks || null,
        location: {
          hub_name: h.location || null,
          city: h.city || null,
          city_name: h.city || null,
          province: null,
          district: null,
          branch_name: h.location || null,
          store_name: null,
          next_site: null,
          next_branch: null,
        },
        driver: {
          name: h.courier_name || null,
          phone: null,
          photo: null,
        },
        recipient:
          h.received_by || h.proof?.name
            ? {
                name: h.received_by || h.proof?.name || "",
                relationship: h.proof?.relation || null,
              }
            : null,
        note: h.remarks || null,
        image_url:
          (Array.isArray(h.attachment) && h.attachment[0]) ||
          (Array.isArray(h.proof?.attachment_signed) &&
            h.proof?.attachment_signed?.[0]) ||
          null,
      })),
      delivery: {
        estimated_delivery: null,
        delivered_at:
          latest?.status_code === "POD" ? toIso(latest.datetime) : null,
        delivered_to: latest?.received_by || latest?.proof?.name || null,
        delivery_relationship: latest?.proof?.relation || null,
        pod_status_code: latest?.status_code === "POD" ? "POD" : null,
        pod_status_name:
          latest?.status_code === "POD" ? latest.current_status || "POD" : null,
        proof_of_delivery: {
          signature_url:
            (Array.isArray(latest?.proof?.attachment_signed) &&
              latest?.proof?.attachment_signed?.[0]) ||
            null,
          photo_url:
            (Array.isArray(latest?.attachment) && latest?.attachment?.[0]) ||
            null,
          signature_pod: Array.isArray(latest?.proof?.attachment_signed)
            ? latest?.proof?.attachment_signed || []
            : [],
          photo_pod: Array.isArray(latest?.attachment) ? latest?.attachment || [] : [],
        },
      },
      driver_info: {
        pickup_driver: {
          name: null,
          phone: null,
          photo: null,
        },
        delivery_driver: {
          name: latest?.courier_name || null,
          phone: null,
          photo: null,
        },
      },
    },
  };
}
