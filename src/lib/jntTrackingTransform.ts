import type { StandardizedTrackingResponse } from "@/types/tracking";

type JntHistoryItem = {
  date_time?: string | null;
  city_name?: string | null;
  status?: string | null;
  status_code?: number | string | null;
  storeName?: string | null;
  nextSiteName?: string | null;
  note?: string | null;
  receiver?: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
};

type JntDetail = {
  shipped_date?: string | null;
  services_code?: string | null;
  services_type?: string | null;
  actual_amount?: number | string | null;
  weight?: number | string | null;
  qty?: number | string | null;
  itemname?: string | null;
  detail_cost?: {
    shipping_cost?: number | string | null;
    add_cost?: number | string | null;
    insurance_cost?: number | string | null;
    cod?: number | string | null;
    return_cost?: number | string | null;
  } | null;
  sender?: {
    name?: string | null;
    addr?: string | null;
    zipcode?: string | null;
    city?: string | null;
  } | null;
  receiver?: {
    name?: string | null;
    addr?: string | null;
    zipcode?: string | null;
    city?: string | null;
  } | null;
  driver?: {
    name?: string | null;
    phone?: string | null;
    photo?: string | null;
  } | null;
  delivDriver?: {
    name?: string | null;
    phone?: string | null;
    photo?: string | null;
  } | null;
};

export type JntTrackingResponse = {
  awb?: string;
  orderid?: string;
  detail?: JntDetail;
  history?: JntHistoryItem[];
};

export function isJntRawResponse(data: unknown): data is JntTrackingResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return typeof obj.awb === "string" && typeof obj.detail === "object";
}

function toIso(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function toNumber(input: number | string | null | undefined): number | null {
  if (input == null || input === "") return null;
  const n = typeof input === "number" ? input : Number(input);
  return Number.isFinite(n) ? n : null;
}

export function transformJntTrackingResponse(
  raw: JntTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const detail = raw.detail ?? {};
  const history = Array.isArray(raw.history) ? raw.history : [];
  const sortedHistory = [...history].sort((a, b) => {
    const aTime = new Date(a.date_time || "").getTime();
    const bTime = new Date(b.date_time || "").getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
  const latest = sortedHistory[0];
  const shippingCost = toNumber(detail.detail_cost?.shipping_cost);
  const insuranceCost = toNumber(detail.detail_cost?.insurance_cost) ?? 0;
  const codValue = toNumber(detail.detail_cost?.cod) ?? 0;
  const totalAmount = toNumber(detail.actual_amount);
  const shippedAt = toIso(detail.shipped_date);

  return {
    success: true,
    vendor: "jntexpress",
    order_info: {
      reference_no: raw.orderid || "",
      vendor: "jntexpress",
      awb_no: raw.awb || awbNo,
      status: latest?.status || "UNKNOWN",
      created_at: shippedAt || new Date().toISOString(),
      user_id: 0,
    },
    tracking_data: {
      vendor: "jntexpress",
      vendor_name: "J&T Express",
      reference_no: raw.orderid || null,
      awb_no: raw.awb || awbNo,
      waybill_no: raw.awb || awbNo,
      current_status: {
        code:
          latest?.status_code != null ? String(latest.status_code) : null,
        status: latest?.status || null,
        description: latest?.note || latest?.status || null,
        timestamp: toIso(latest?.date_time),
        datetime: toIso(latest?.date_time),
      },
      shipment: {
        service_code: detail.services_code || null,
        service_name: detail.services_type || detail.services_code || null,
        weight: toNumber(detail.weight),
        weight_unit: "gram",
        pieces: toNumber(detail.qty) ?? 0,
        koli: toNumber(detail.qty) ?? 0,
        service_fee: null,
        shipping_cost: shippingCost,
        cod_value: codValue,
        insurance_cost: insuranceCost,
        total_amount: totalAmount,
        booking_id: null,
        invoice_no: null,
        shipped_date: shippedAt,
        item_name: detail.itemname || null,
      },
      sender: {
        name: detail.sender?.name || null,
        phone: null,
        address: detail.sender?.addr || null,
        postcode: detail.sender?.zipcode || null,
        city: detail.sender?.city || null,
        province: null,
        district: null,
        zipcode: detail.sender?.zipcode || null,
      },
      receiver: {
        name: detail.receiver?.name || null,
        phone: null,
        address: detail.receiver?.addr || null,
        postcode: detail.receiver?.zipcode || null,
        city: detail.receiver?.city || null,
        province: null,
        district: null,
        zipcode: detail.receiver?.zipcode || null,
        actual_receiver: latest?.receiver
          ? { name: latest.receiver, relationship: null }
          : null,
      },
      tracking_history: sortedHistory.map((h, idx) => {
        const hIso = toIso(h.date_time);
        return {
          sequence: idx + 1,
          timestamp: hIso,
          datetime: hIso,
          date_time: h.date_time || null,
          status_code: h.status_code != null ? String(h.status_code) : null,
          status: h.status || null,
          status_name: h.status || null,
          description: h.note || h.status || null,
          message: h.note || null,
          location: {
            hub_name: h.storeName || null,
            city: h.city_name || null,
            city_name: h.city_name || null,
            province: null,
            district: null,
            branch_name: h.storeName || null,
            store_name: h.storeName || null,
            next_site: h.nextSiteName || null,
            next_branch: h.nextSiteName || null,
          },
          driver: {
            name: h.driverName || null,
            phone: h.driverPhone || null,
            photo: null,
          },
          recipient: h.receiver
            ? { name: h.receiver, relationship: null }
            : null,
          note: h.note || null,
          image_url: null,
        };
      }),
      delivery: {
        estimated_delivery: null,
        delivered_at: null,
        delivered_to: latest?.receiver || null,
        delivery_relationship: null,
        pod_status_code: null,
        pod_status_name: null,
        proof_of_delivery: {
          signature_url: null,
          photo_url: null,
          signature_pod: [],
          photo_pod: [],
        },
      },
      driver_info: {
        pickup_driver: {
          name: detail.driver?.name || null,
          phone: detail.driver?.phone || null,
          photo: detail.driver?.photo || null,
        },
        delivery_driver: {
          name: detail.delivDriver?.name || null,
          phone: detail.delivDriver?.phone || null,
          photo: detail.delivDriver?.photo || null,
        },
      },
    },
  };
}
