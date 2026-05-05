import type { StandardizedTrackingResponse } from "@/types/tracking";

/** Lokasi origin / destination Paxel */
type PaxelPlace = {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  note?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  zip_code?: string | null;
};

type PaxelItem = {
  code?: string | null;
  name?: string | null;
  category?: string | null;
  is_fragile?: boolean | null;
  price?: number | null;
  quantity?: number | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
};

type PaxelLogEntry = {
  created_datetime?: string | null;
  name?: string | null;
  address?: string | null;
  note?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  province?: string | null;
  city?: string | null;
  district?: string | null;
  status?: string | null;
};

/** Isi `data` dari response tracking Paxel (nextday / sameday — struktur sama). */
export type PaxelShipmentData = {
  airwaybill_code?: string | null;
  invoice_number?: string | null;
  payment_type?: string | null;
  invoice_value?: number | null;
  origin?: PaxelPlace | null;
  destination?: PaxelPlace | null;
  items?: PaxelItem[] | null;
  pickup_datetime?: string | null;
  need_insurance?: boolean | null;
  note?: string | null;
  shipping_cost?: number | null;
  created_datetime?: string | null;
  estimated_pickup_date?: string | null;
  estimated_pickup_min_time?: string | null;
  estimated_pickup_max_time?: string | null;
  estimated_arrival_date?: string | null;
  estimated_arrival_min_time?: string | null;
  estimated_arrival_max_time?: string | null;
  photo?: string | null;
  signature?: string | null;
  latest_status?: string | null;
  delivery_datetime?: string | null;
  logs?: PaxelLogEntry[] | null;
  cancellation_reason?: string | null;
};

/** Bentuk API umum: `{ message, status_code, data }` */
export type PaxelTrackingApiResponse = {
  message?: string;
  status_code?: number;
  data?: PaxelShipmentData | null;
};

function toIso(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const d = new Date(dateString.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function extractShipment(raw: unknown): {
  api: PaxelTrackingApiResponse | null;
  shipment: PaxelShipmentData | null;
} {
  if (!raw || typeof raw !== "object") {
    return { api: null, shipment: null };
  }
  const o = raw as Record<string, unknown>;

  if (
    o.data &&
    typeof o.data === "object" &&
    typeof (o.data as Record<string, unknown>).airwaybill_code === "string"
  ) {
    return {
      api: raw as PaxelTrackingApiResponse,
      shipment: o.data as PaxelShipmentData,
    };
  }

  if (typeof o.airwaybill_code === "string") {
    return { api: null, shipment: o as unknown as PaxelShipmentData };
  }

  return { api: null, shipment: null };
}

/** Kurangi false positive: payload Paxel punya beberapa field khas selain airwaybill. */
function looksLikePaxelShipment(d: PaxelShipmentData): boolean {
  if (typeof d.airwaybill_code !== "string" || !d.airwaybill_code.trim()) {
    return false;
  }
  return (
    d.latest_status != null ||
    Array.isArray(d.logs) ||
    (typeof d.origin === "object" && d.origin !== null) ||
    (typeof d.destination === "object" && d.destination !== null) ||
    typeof d.invoice_number === "string" ||
    d.pickup_datetime != null ||
    d.estimated_arrival_date != null ||
    d.created_datetime != null
  );
}

export function isPaxelRawResponse(data: unknown): boolean {
  const { shipment } = extractShipment(data);
  return shipment !== null && looksLikePaxelShipment(shipment);
}

/** Berat item Paxel di docs (gram); standard shipment.weight pakai kg */
function itemsWeightKg(items: PaxelItem[] | null | undefined): number | null {
  if (!items?.length) return null;
  const w = items[0]?.weight;
  if (w == null || !Number.isFinite(Number(w))) return null;
  return Number(w) / 1000;
}

export function transformPaxelTrackingResponse(
  raw: unknown,
  awbNo: string
): StandardizedTrackingResponse {
  const { api, shipment } = extractShipment(raw);
  const d = shipment ?? {};
  const statusOk = api?.status_code === undefined || api.status_code === 200;
  const awb = d.airwaybill_code || awbNo;
  const items = Array.isArray(d.items) ? d.items : [];
  const logs = Array.isArray(d.logs) ? d.logs : [];
  const sortedLogs = [...logs].sort((a, b) => {
    const ta = new Date(a.created_datetime || "").getTime();
    const tb = new Date(b.created_datetime || "").getTime();
    if (Number.isNaN(ta) && Number.isNaN(tb)) return 0;
    if (Number.isNaN(ta)) return 1;
    if (Number.isNaN(tb)) return -1;
    return ta - tb;
  });
  const latestLog = [...sortedLogs].sort((a, b) => {
    const ta = new Date(a.created_datetime || "").getTime();
    const tb = new Date(b.created_datetime || "").getTime();
    return tb - ta;
  })[0];

  const origin = d.origin ?? {};
  const dest = d.destination ?? {};
  const latestIso = toIso(latestLog?.created_datetime);
  const deliveredIso = toIso(d.delivery_datetime);

  const estimatedArrival =
    d.estimated_arrival_date &&
    d.estimated_arrival_min_time &&
    d.estimated_arrival_max_time
      ? `${d.estimated_arrival_date} ${d.estimated_arrival_min_time}–${d.estimated_arrival_max_time}`
      : d.estimated_arrival_date || null;

  return {
    success: statusOk && !!d.airwaybill_code,
    vendor: "paxel",
    order_info: {
      reference_no: d.invoice_number || "",
      vendor: "paxel",
      awb_no: awb,
      status: d.latest_status || latestLog?.status || "UNKNOWN",
      created_at: toIso(d.created_datetime) || new Date().toISOString(),
      user_id: 0,
    },
    tracking_data: {
      vendor: "paxel",
      vendor_name: "Paxel",
      reference_no: d.invoice_number || null,
      awb_no: awb,
      waybill_no: awb,
      current_status: {
        code: d.latest_status || null,
        status: d.latest_status || latestLog?.status || null,
        description: latestLog?.status || d.note || api?.message || null,
        timestamp: latestIso,
        datetime: latestIso,
      },
      shipment: {
        service_code: d.payment_type || null,
        service_name: "Paxel",
        weight: itemsWeightKg(items),
        weight_unit: "kg",
        pieces: items.reduce((acc, i) => acc + (i.quantity ?? 0), 0) || 1,
        koli: items.length || 1,
        service_fee: null,
        shipping_cost: d.shipping_cost ?? null,
        cod_value: 0,
        insurance_cost: 0,
        total_amount: d.invoice_value ?? null,
        booking_id: d.invoice_number || null,
        invoice_no: d.invoice_number || null,
        shipped_date: toIso(d.pickup_datetime),
        item_name: items[0]?.name || null,
      },
      sender: {
        name: origin.name || null,
        phone: origin.phone || null,
        address: origin.address || null,
        postcode: origin.zip_code || null,
        city: origin.city || null,
        province: origin.province || null,
        district: origin.district || null,
        zipcode: origin.zip_code || null,
      },
      receiver: {
        name: dest.name || null,
        phone: dest.phone || null,
        address: dest.address || null,
        postcode: dest.zip_code || null,
        city: dest.city || null,
        province: dest.province || null,
        district: dest.district || null,
        zipcode: dest.zip_code || null,
        actual_receiver: null,
      },
      tracking_history: sortedLogs.map((log, idx) => {
        const logIso = toIso(log.created_datetime);
        return {
          sequence: idx + 1,
          timestamp: logIso,
          datetime: logIso,
          date_time: log.created_datetime || null,
          status_code: null,
          status: log.status || null,
          status_name: log.status || null,
          description: log.status || null,
          message: log.note || null,
          location: {
            hub_name: null,
            city: log.city || null,
            city_name: log.city || null,
            province: log.province || null,
            district: log.district || null,
            branch_name: null,
            store_name: log.name || null,
            next_site: null,
            next_branch: null,
          },
          driver: {
            name: log.name || null,
            phone: null,
            photo: null,
          },
          recipient: null,
          note: log.note || null,
          image_url: null,
        };
      }),
      delivery: {
        estimated_delivery: estimatedArrival,
        delivered_at: deliveredIso,
        delivered_to: dest.name || null,
        delivery_relationship: null,
        pod_status_code: d.latest_status || null,
        pod_status_name: d.latest_status || null,
        proof_of_delivery: {
          signature_url: d.signature || null,
          photo_url: d.photo || null,
          signature_pod: d.signature ? [d.signature] : [],
          photo_pod: d.photo ? [d.photo] : [],
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
    },
  };
}
