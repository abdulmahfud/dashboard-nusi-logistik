import type { StandardizedTrackingResponse } from "@/types/tracking";

/**
 * Raw response J&T Cargo `logistics/query` (open.jtcargo.co.id):
 * { code: "1", msg: "success", data: [{ billCode, details: [{ scanTime, desc, scanType, ... }] }] }
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
