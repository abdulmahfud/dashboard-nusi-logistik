import type { StandardizedTrackingResponse } from "@/types/tracking";

/**
 * Response BE `/admin/tracking` untuk vendor JNTCARGO (lihat docs/jnt-cargo/tracking.md):
 * { success, vendor: "JNTCARGO", tracking_data: { status, message, data: { bill_code,
 *   current_status, current_status_description, delivery_status, tracking_history: [...] },
 *   raw_response }, order_info }
 *
 * `current_status` adalah slug status kanonik aplikasi (mis. "sampai_tujuan",
 * "proses_pengiriman") — dipakai apa adanya, JANGAN diganti dengan teks deskripsi,
 * karena dipakai untuk pewarnaan badge di CurrentStatusCard & konsisten dengan
 * status_overview di getOrderStatistics().
 */
type JntCargoHistoryEntry = {
  datetime?: string | null;
  scan_code?: number | string | null;
  scan_type?: string | null;
  description?: string | null;
  location?: string | null;
  next_stop_name?: string | null;
  staff_name?: string | null;
  staff_contact?: string | null;
  problem_type?: string | null;
  pic_url?: string[] | null;
};

type JntCargoPartyInfo = {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
  province?: string | null;
  regency?: string | null;
  district?: string | null;
  postal_code?: string | null;
};

type JntCargoNormalizedData = {
  bill_code?: string | null;
  vendor?: string | null;
  current_status?: string | null;
  current_status_description?: string | null;
  delivery_status?: string | null;
  shipping_cost?: number | string | null;
  total_cost?: number | string | null;
  insurance_cost?: number | string | null;
  weight?: number | string | null;
  sender_city?: string | null;
  receiver_city?: string | null;
  sender?: JntCargoPartyInfo | null;
  receiver?: JntCargoPartyInfo | null;
  tracking_history?: JntCargoHistoryEntry[] | null;
};

export type JntCargoBeTrackingResponse = {
  success?: boolean;
  vendor?: string;
  tracking_data: {
    status?: string;
    message?: string;
    data: JntCargoNormalizedData;
    raw_response?: unknown;
    reference_no?: string;
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

export function isJntCargoBeTrackingWrapper(
  response: unknown
): response is JntCargoBeTrackingResponse {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  const td = r.tracking_data;
  if (!td || typeof td !== "object") return false;
  const t = td as Record<string, unknown>;
  const data = t.data;
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (!("bill_code" in d) || !Array.isArray(d.tracking_history)) return false;
  const vendor = String(r.vendor ?? d.vendor ?? "").toUpperCase();
  return vendor === "JNTCARGO" || vendor === "JNT CARGO";
}

function sortEntriesNewestFirst(
  entries: JntCargoHistoryEntry[]
): JntCargoHistoryEntry[] {
  return [...entries].sort((a, b) => {
    const aTime = new Date((a.datetime || "").replace(" ", "T")).getTime();
    const bTime = new Date((b.datetime || "").replace(" ", "T")).getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
}

function sortEntriesOldestFirst(
  entries: JntCargoHistoryEntry[]
): JntCargoHistoryEntry[] {
  return [...sortEntriesNewestFirst(entries)].reverse();
}

/** Event serah terima paket ("tanda terima") dianggap POD. */
function findPodEntry(
  entries: JntCargoHistoryEntry[]
): JntCargoHistoryEntry | undefined {
  return entries.find((e) =>
    String(e.scan_type || "").toLowerCase().includes("tanda terima")
  );
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function transformJntCargoBeTrackingResponse(
  response: JntCargoBeTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const data = response.tracking_data.data;
  const entries = Array.isArray(data.tracking_history)
    ? data.tracking_history
    : [];
  const sortedNewest = sortEntriesNewestFirst(entries);
  const sortedOldest = sortEntriesOldestFirst(entries);
  const latest = sortedNewest[0];
  const first = sortedOldest[0];
  const podEntry = findPodEntry(entries);
  const isDelivered =
    String(data.delivery_status || "").toLowerCase() === "delivered" ||
    !!podEntry;

  const oi = response.order_info;
  const displayAwb = oi?.awb_no || data.bill_code || awbNo;

  return {
    success: response.success !== false,
    vendor: "jntcargo",
    order_info: {
      reference_no:
        oi?.reference_no || response.tracking_data.reference_no || "",
      vendor: "jntcargo",
      awb_no: displayAwb,
      status: oi?.status || data.current_status || "UNKNOWN",
      created_at:
        oi?.created_at || toIso(first?.datetime) || new Date().toISOString(),
      user_id: oi?.user_id ?? 0,
    },
    tracking_data: {
      vendor: "jntcargo",
      vendor_name: "J&T Cargo",
      reference_no:
        oi?.reference_no || response.tracking_data.reference_no || null,
      awb_no: displayAwb,
      waybill_no: data.bill_code || displayAwb,
      current_status: {
        code: latest?.scan_code != null ? String(latest.scan_code) : null,
        status: data.current_status || latest?.scan_type || null,
        description:
          data.current_status_description ||
          latest?.description ||
          latest?.scan_type ||
          null,
        timestamp: toIso(latest?.datetime),
        datetime: toIso(latest?.datetime),
      },
      shipment: {
        service_code: null,
        service_name: "J&T Cargo",
        weight: toNumber(data.weight),
        weight_unit: "kg",
        pieces: 0,
        koli: 0,
        service_fee: null,
        shipping_cost: toNumber(data.shipping_cost),
        cod_value: 0,
        insurance_cost: toNumber(data.insurance_cost) ?? 0,
        total_amount: toNumber(data.total_cost) ?? toNumber(data.shipping_cost),
        booking_id: displayAwb,
        invoice_no: null,
        shipped_date: toIso(first?.datetime),
        item_name: null,
      },
      sender: {
        name: data.sender?.name || null,
        phone: data.sender?.phone || null,
        address: data.sender?.address || null,
        postcode: data.sender?.postal_code || null,
        city: data.sender?.regency || data.sender_city || null,
        province: data.sender?.province || null,
        district: data.sender?.district || null,
        zipcode: data.sender?.postal_code || null,
      },
      receiver: {
        name: data.receiver?.name || null,
        phone: data.receiver?.phone || null,
        address: data.receiver?.address || null,
        postcode: data.receiver?.postal_code || null,
        city: data.receiver?.regency || data.receiver_city || null,
        province: data.receiver?.province || null,
        district: data.receiver?.district || null,
        zipcode: data.receiver?.postal_code || null,
        actual_receiver: null,
      },
      tracking_history: sortedOldest.map((e, idx) => ({
        sequence: idx + 1,
        timestamp: toIso(e.datetime),
        datetime: toIso(e.datetime),
        date_time: e.datetime || null,
        status_code: e.scan_code != null ? String(e.scan_code) : null,
        status: e.scan_type || null,
        status_name: e.scan_type || null,
        description: e.description || e.scan_type || null,
        message: e.description || null,
        location: {
          hub_name: e.location || null,
          city: null,
          city_name: null,
          province: null,
          district: null,
          branch_name: e.location || null,
          store_name: null,
          next_site: e.next_stop_name || null,
          next_branch: e.next_stop_name || null,
        },
        driver: {
          name: e.staff_name || null,
          phone: e.staff_contact || null,
          photo: null,
        },
        recipient: null,
        note: e.problem_type || e.description || null,
        image_url: Array.isArray(e.pic_url) && e.pic_url[0] ? e.pic_url[0] : null,
      })),
      delivery: {
        estimated_delivery: null,
        delivered_at: isDelivered
          ? toIso(podEntry?.datetime ?? latest?.datetime)
          : null,
        delivered_to: isDelivered ? data.receiver?.name || null : null,
        delivery_relationship: null,
        pod_status_code: podEntry ? "POD" : null,
        pod_status_name: podEntry ? podEntry.scan_type || "POD" : null,
        proof_of_delivery: {
          signature_url: null,
          photo_url:
            (Array.isArray(podEntry?.pic_url) && podEntry?.pic_url[0]) ||
            null,
          signature_pod: [],
          photo_pod: Array.isArray(podEntry?.pic_url) ? podEntry.pic_url : [],
        },
      },
      driver_info: {
        pickup_driver: { name: null, phone: null, photo: null },
        delivery_driver: {
          name: podEntry?.staff_name || latest?.staff_name || null,
          phone: podEntry?.staff_contact || latest?.staff_contact || null,
          photo: null,
        },
      },
    },
  };
}

/**
 * Raw response J&T Cargo `logistics/query` (open.jtcargo.co.id):
 * { code: "1", msg: "success", data: [{ billCode, details: [{ scanTime, desc, scanType, ... }] }] }
 * Fallback jika BE suatu saat meneruskan payload vendor mentah tanpa normalisasi.
 */
type JntCargoDetailItem = {
  scanTime?: string | null;
  desc?: string | null;
  scanType?: string | null;
  scanNetworkName?: string | null;
  scanNetworkId?: number | null;
  picUrl?: string[] | null;
  staffName?: string | null;
  nextStopName?: string | null;
};

type JntCargoShipmentItem = {
  billCode?: string | null;
  details?: JntCargoDetailItem[] | null;
};

export type JntCargoTrackingResponse = {
  code?: string | number;
  msg?: string | null;
  data?: JntCargoShipmentItem[] | null;
};

export function isJntCargoRawResponse(
  data: unknown
): data is JntCargoTrackingResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (!("code" in obj) || !Array.isArray(obj.data) || obj.data.length === 0) {
    return false;
  }
  const first = obj.data[0];
  if (!first || typeof first !== "object") return false;
  const f = first as Record<string, unknown>;
  return "billCode" in f && "details" in f;
}

function toIso(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const normalized = dateString.includes("T")
    ? dateString
    : dateString.replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function pickShipmentItem(
  items: JntCargoShipmentItem[],
  awbNo: string
): JntCargoShipmentItem {
  if (items.length === 0) return {};
  const needle = awbNo.trim().toUpperCase();
  if (!needle) return items[0];
  return (
    items.find((i) => String(i.billCode || "").toUpperCase() === needle) ??
    items[0]
  );
}

function sortDetailsNewestFirst(
  details: JntCargoDetailItem[]
): JntCargoDetailItem[] {
  return [...details].sort((a, b) => {
    const aTime = new Date((a.scanTime || "").replace(" ", "T")).getTime();
    const bTime = new Date((b.scanTime || "").replace(" ", "T")).getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
}

function sortDetailsOldestFirst(
  details: JntCargoDetailItem[]
): JntCargoDetailItem[] {
  return [...sortDetailsNewestFirst(details)].reverse();
}

/** Event serah terima paket ("tanda terima") dianggap POD. */
function findPodDetail(
  details: JntCargoDetailItem[]
): JntCargoDetailItem | undefined {
  return details.find((d) =>
    String(d.scanType || "").toLowerCase().includes("tanda terima")
  );
}

export function transformJntCargoTrackingResponse(
  raw: JntCargoTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const items = Array.isArray(raw.data) ? raw.data : [];
  const shipment = pickShipmentItem(items, awbNo);
  const details = Array.isArray(shipment.details) ? shipment.details : [];
  const sortedNewest = sortDetailsNewestFirst(details);
  const sortedOldest = sortDetailsOldestFirst(details);
  const latest = sortedNewest[0];
  const first = sortedOldest[0];
  const podEvent = findPodDetail(details);

  const displayAwb = shipment.billCode || awbNo;
  const isSuccess = String(raw.code) === "1";

  return {
    success: isSuccess,
    vendor: "jntcargo",
    order_info: {
      reference_no: "",
      vendor: "jntcargo",
      awb_no: displayAwb,
      status: latest?.scanType || raw.msg || "UNKNOWN",
      created_at: toIso(first?.scanTime) || new Date().toISOString(),
      user_id: 0,
    },
    tracking_data: {
      vendor: "jntcargo",
      vendor_name: "J&T Cargo",
      reference_no: null,
      awb_no: displayAwb,
      waybill_no: displayAwb,
      current_status: {
        code: null,
        status: latest?.scanType || null,
        description: latest?.desc || latest?.scanType || raw.msg || null,
        timestamp: toIso(latest?.scanTime),
        datetime: toIso(latest?.scanTime),
      },
      shipment: {
        service_code: null,
        service_name: "J&T Cargo",
        weight: null,
        weight_unit: "kg",
        pieces: 0,
        koli: 0,
        service_fee: null,
        shipping_cost: null,
        cod_value: 0,
        insurance_cost: 0,
        total_amount: null,
        booking_id: displayAwb,
        invoice_no: null,
        shipped_date: toIso(first?.scanTime),
        item_name: null,
      },
      sender: {
        name: null,
        phone: null,
        address: null,
        postcode: null,
        city: null,
        province: null,
        district: null,
        zipcode: null,
      },
      receiver: {
        name: null,
        phone: null,
        address: null,
        postcode: null,
        city: null,
        province: null,
        district: null,
        zipcode: null,
        actual_receiver: null,
      },
      tracking_history: sortedOldest.map((d, idx) => ({
        sequence: idx + 1,
        timestamp: toIso(d.scanTime),
        datetime: toIso(d.scanTime),
        date_time: d.scanTime || null,
        status_code: null,
        status: d.scanType || null,
        status_name: d.scanType || null,
        description: d.desc || d.scanType || null,
        message: d.desc || null,
        location: {
          hub_name: d.scanNetworkName || null,
          city: null,
          city_name: null,
          province: null,
          district: null,
          branch_name: d.scanNetworkName || null,
          store_name: d.scanNetworkName || null,
          next_site: d.nextStopName || null,
          next_branch: d.nextStopName || null,
        },
        driver: {
          name: d.staffName || null,
          phone: null,
          photo: null,
        },
        recipient: null,
        note: d.desc || null,
        image_url: Array.isArray(d.picUrl) && d.picUrl[0] ? d.picUrl[0] : null,
      })),
      delivery: {
        estimated_delivery: null,
        delivered_at: podEvent ? toIso(podEvent.scanTime) : null,
        delivered_to: null,
        delivery_relationship: null,
        pod_status_code: podEvent ? "POD" : null,
        pod_status_name: podEvent ? podEvent.scanType || "POD" : null,
        proof_of_delivery: {
          signature_url: null,
          photo_url:
            (Array.isArray(podEvent?.picUrl) && podEvent?.picUrl[0]) || null,
          signature_pod: [],
          photo_pod: Array.isArray(podEvent?.picUrl) ? podEvent.picUrl : [],
        },
      },
      driver_info: {
        pickup_driver: { name: null, phone: null, photo: null },
        delivery_driver: {
          name: podEvent?.staffName || latest?.staffName || null,
          phone: null,
          photo: null,
        },
      },
    },
  };
}
