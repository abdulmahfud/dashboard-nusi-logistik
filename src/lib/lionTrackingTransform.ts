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
  total_tariff_before_cod_fee?: number | null;
  is_insurance?: boolean;
  insurance_rate?: number | null;
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
  root_stt_number?: string | null;
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
  chargeable_total_tariff?: number | null;
  chargeable_total_tariff_exc_cod_fee?: number | null;
  history?: LionHistoryItem[] | null;
};

export type LionTrackingResponse = {
  stts?: LionSttItem[];
};

/** Response BE `/admin/tracking`: Lion di `tracking_data.data` (lihat docs/lion/tracking.md) */
export type LionBeTrackingWrapper = {
  success?: boolean;
  vendor?: string;
  tracking_data: {
    status?: string;
    message?: string;
    reference_no?: string;
    data: LionTrackingResponse;
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

function toIso(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function isLionRawResponse(data: unknown): data is LionTrackingResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.stts) || obj.stts.length === 0) return false;
  const first = obj.stts[0];
  return !!first && typeof first === "object" && "stt_no" in (first as Record<string, unknown>);
}

/**
 * Ambil payload Lion dari berbagai bentuk response BE.
 */
export function unwrapLionTrackingPayload(input: unknown): LionTrackingResponse | null {
  if (isLionRawResponse(input)) {
    return input;
  }
  if (input && typeof input === "object") {
    const root = input as Record<string, unknown>;
    if (root.data && isLionRawResponse(root.data)) {
      return root.data;
    }
    const td = root.tracking_data;
    if (td && typeof td === "object") {
      const inner = (td as Record<string, unknown>).data;
      if (isLionRawResponse(inner)) {
        return inner;
      }
    }
  }
  return null;
}

export function isLionBeTrackingWrapper(
  response: unknown
): response is LionBeTrackingWrapper {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  const td = r.tracking_data;
  if (!td || typeof td !== "object") return false;
  return isLionRawResponse((td as Record<string, unknown>).data);
}

function pickSttItem(stts: LionSttItem[], awbNo: string): LionSttItem {
  if (stts.length === 0) return {};
  const needle = awbNo.trim().toUpperCase();
  if (!needle) return stts[0];
  return (
    stts.find(
      (s) =>
        String(s.stt_no || "").toUpperCase() === needle ||
        String(s.root_stt_number || "").toUpperCase() === needle
    ) ?? stts[0]
  );
}

function sortHistoryNewestFirst(history: LionHistoryItem[]): LionHistoryItem[] {
  return [...history].sort((a, b) => {
    const aTime = new Date(a.datetime || "").getTime();
    const bTime = new Date(b.datetime || "").getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
}

function sortHistoryOldestFirst(history: LionHistoryItem[]): LionHistoryItem[] {
  return [...history].sort((a, b) => {
    const aTime = new Date(a.datetime || "").getTime();
    const bTime = new Date(b.datetime || "").getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return aTime - bTime;
  });
}

function findPodHistory(history: LionHistoryItem[]): LionHistoryItem | undefined {
  return history.find(
    (h) =>
      String(h.status_code || "").toUpperCase() === "POD" ||
      String(h.current_status || "").toUpperCase() === "POD"
  );
}

function latestTariffFromHistory(history: LionHistoryItem[]): number | null {
  for (const h of sortHistoryNewestFirst(history)) {
    const t = Number(h.total_tariff);
    if (Number.isFinite(t) && t > 0) return t;
  }
  return null;
}

function latestInsuranceFromHistory(history: LionHistoryItem[]): number {
  for (const h of sortHistoryNewestFirst(history)) {
    if (h.is_insurance && Number(h.insurance_rate) > 0) {
      return Number(h.insurance_rate);
    }
  }
  return 0;
}

export function transformLionTrackingResponse(
  raw: LionTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const stts = Array.isArray(raw.stts) ? raw.stts : [];
  const stt = pickSttItem(stts, awbNo);
  const history = Array.isArray(stt.history) ? stt.history : [];
  const sortedNewest = sortHistoryNewestFirst(history);
  const sortedOldest = sortHistoryOldestFirst(history);
  const latest = sortedNewest[0];
  const firstEvent = sortedOldest[0];
  const podEvent = findPodHistory(history) ?? latest;
  const latestIso = toIso(latest?.datetime);
  const firstIso = toIso(firstEvent?.datetime);
  const podIso = toIso(podEvent?.datetime);

  const shippingCost =
    stt.chargeable_total_tariff ??
    latestTariffFromHistory(history) ??
    latest?.total_tariff ??
    null;

  const insuranceCost = latestInsuranceFromHistory(history);

  const currentDescription =
    latest?.remarks ||
    stt.current_status ||
    stt.status_code ||
    null;

  return {
    success: true,
    vendor: "lion",
    order_info: {
      reference_no: stt.shipment_id || "",
      vendor: "lion",
      awb_no: stt.stt_no || stt.root_stt_number || awbNo,
      status: stt.current_status || stt.status_code || latest?.current_status || "UNKNOWN",
      created_at: firstIso || latestIso || new Date().toISOString(),
      user_id: 0,
    },
    tracking_data: {
      vendor: "lion",
      vendor_name: "Lion Parcel",
      reference_no: stt.shipment_id || null,
      awb_no: stt.stt_no || stt.root_stt_number || awbNo,
      waybill_no: stt.stt_no || stt.root_stt_number || awbNo,
      current_status: {
        code: latest?.status_code || stt.status_code || stt.current_status || null,
        status: latest?.current_status || stt.current_status || stt.status_code || null,
        description: currentDescription,
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
        service_fee: stt.chargeable_total_tariff_exc_cod_fee ?? null,
        shipping_cost: shippingCost,
        cod_value: 0,
        insurance_cost: insuranceCost,
        total_amount: shippingCost,
        booking_id: stt.shipment_id || null,
        invoice_no: null,
        shipped_date: firstIso,
        item_name: stt.product_type || null,
      },
      sender: {
        name: stt.sender_name || null,
        phone: null,
        address: stt.origin || null,
        postcode: null,
        city: stt.origin || null,
        province: null,
        district: null,
        zipcode: null,
      },
      receiver: {
        name: stt.recipient_name || null,
        phone: null,
        address: stt.destination || null,
        postcode: null,
        city: stt.destination || null,
        province: null,
        district: null,
        zipcode: null,
        actual_receiver:
          podEvent?.received_by || podEvent?.proof?.name
            ? {
                name: podEvent?.received_by || podEvent?.proof?.name || "",
                relationship: podEvent?.proof?.relation || null,
              }
            : null,
      },
      tracking_history: sortedOldest.map((h, idx) => ({
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
          podEvent?.status_code === "POD" || podEvent?.current_status === "POD"
            ? podIso
            : null,
        delivered_to: podEvent?.received_by || podEvent?.proof?.name || null,
        delivery_relationship: podEvent?.proof?.relation || null,
        pod_status_code:
          podEvent?.status_code === "POD" ? "POD" : podEvent?.status_code || null,
        pod_status_name:
          podEvent?.status_code === "POD"
            ? podEvent.current_status || "POD"
            : null,
        proof_of_delivery: {
          signature_url:
            (Array.isArray(podEvent?.proof?.attachment_signed) &&
              podEvent?.proof?.attachment_signed?.[0]) ||
            null,
          photo_url:
            (Array.isArray(podEvent?.attachment) && podEvent?.attachment?.[0]) ||
            null,
          signature_pod: Array.isArray(podEvent?.proof?.attachment_signed)
            ? podEvent?.proof?.attachment_signed || []
            : [],
          photo_pod: Array.isArray(podEvent?.attachment)
            ? podEvent?.attachment || []
            : [],
        },
      },
      driver_info: {
        pickup_driver: {
          name: null,
          phone: null,
          photo: null,
        },
        delivery_driver: {
          name: podEvent?.courier_name || latest?.courier_name || null,
          phone: null,
          photo: null,
        },
      },
    },
  };
}

export function transformLionBeTrackingWrapper(
  apiResponse: LionBeTrackingWrapper,
  awbNo: string
): StandardizedTrackingResponse {
  const lionRaw = apiResponse.tracking_data.data;
  const resi =
    lionRaw.stts?.[0]?.stt_no ||
    lionRaw.stts?.[0]?.root_stt_number ||
    awbNo;
  const result = transformLionTrackingResponse(lionRaw, resi);

  result.success = apiResponse.success !== false;
  result.vendor = "lion";
  result.tracking_data.vendor = "lion";

  const ref =
    apiResponse.tracking_data.reference_no ||
    apiResponse.order_info?.reference_no ||
    result.tracking_data.reference_no;
  if (ref) {
    result.tracking_data.reference_no = ref;
  }

  const oi = apiResponse.order_info;
  if (oi) {
    result.order_info = {
      reference_no: String(oi.reference_no ?? ref ?? result.order_info.reference_no),
      vendor: String(oi.vendor ?? "LION"),
      awb_no: result.tracking_data.awb_no ?? oi.awb_no ?? resi,
      status: String(oi.status ?? result.order_info.status),
      created_at: String(oi.created_at ?? result.order_info.created_at),
      user_id: Number(oi.user_id ?? 0),
    };
  }

  return result;
}
