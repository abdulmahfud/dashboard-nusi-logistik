import type { StandardizedTrackingResponse } from "@/types/tracking";

type SapTrackingItem = {
  awb_no?: string | null;
  reference_no?: string | null;
  service_type_code?: string | null;
  shipper_name?: string | null;
  receiver_name?: string | null;
  rowstate?: string | null;
  rowstate_name?: string | null;
  rowstate_web?: string | null;
  pod_status_code?: string | null;
  pod_status_name?: string | null;
  description?: string | null;
  kilo?: string | number | null;
  koli?: string | number | null;
  volumetric?: string | null;
  create_date?: string | null;
  user_input?: string | null;
  photo_pickup?: string[] | null;
  signature_pickup?: string[] | null;
  photo_pod?: string[] | null;
  signature_pod?: string[] | null;
  current_branch_name?: string | null;
  origin?: string | null;
  destination?: string | null;
  shipping_cost?: string | number | null;
  kilo_actual?: string | number | null;
  next_branch?: string | null;
  previous_branch?: string | null;
};

export type SapTrackingResponse = {
  success?: boolean;
  status?: string;
  msg?: string;
  data?: SapTrackingItem[] | {
    status?: string;
    msg?: string;
    data?: SapTrackingItem[];
  };
};

export function isSapRawResponse(data: unknown): data is SapTrackingResponse {
  if (!data || typeof data !== "object") return false;
  const root = data as Record<string, unknown>;
  // Format docs: { status, msg, data: [...] }
  if (
    Array.isArray(root.data) &&
    root.data.length > 0 &&
    typeof root.data[0] === "object" &&
    root.data[0] !== null &&
    "awb_no" in (root.data[0] as Record<string, unknown>)
  ) {
    return true;
  }

  // Format API wrapper: { success, data: { status, msg, data: [...] } }
  const level1 = root.data;
  if (level1 && typeof level1 === "object") {
    const level1Obj = level1 as Record<string, unknown>;
    if (
      Array.isArray(level1Obj.data) &&
      level1Obj.data.length > 0 &&
      typeof level1Obj.data[0] === "object" &&
      level1Obj.data[0] !== null &&
      "awb_no" in (level1Obj.data[0] as Record<string, unknown>)
    ) {
      return true;
    }
  }

  return false;
}

function toIso(dateString: string | null | undefined): string | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function transformSapTrackingResponse(
  raw: SapTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const rawData =
    Array.isArray(raw.data)
      ? raw.data
      : raw.data && typeof raw.data === "object" && Array.isArray(raw.data.data)
        ? raw.data.data
        : [];
  const sortedHistory = [...rawData].sort((a, b) => {
    const aTime = new Date(a.create_date || "").getTime();
    const bTime = new Date(b.create_date || "").getTime();
    if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0;
    if (Number.isNaN(aTime)) return 1;
    if (Number.isNaN(bTime)) return -1;
    return bTime - aTime;
  });
  const item = sortedHistory[0] ?? {};
  const rootMsg =
    raw.data && typeof raw.data === "object" && !Array.isArray(raw.data)
      ? raw.data.msg
      : raw.msg;
  const currentStatus =
    item.rowstate_web || item.rowstate_name || item.description || null;
  const trackingAt = toIso(item.create_date);
  const weightNumber =
    item.kilo != null && item.kilo !== "" ? Number(item.kilo) : null;
  const shippingCostNumber =
    item.shipping_cost != null && item.shipping_cost !== ""
      ? Number(item.shipping_cost)
      : null;
  const piecesNumber =
    item.koli != null && item.koli !== "" ? Number(item.koli) : null;

  return {
    success: true,
    vendor: "sap",
    order_info: {
      reference_no: item.reference_no || "",
      vendor: "sap",
      awb_no: item.awb_no || awbNo,
      status: item.rowstate_name || item.rowstate_web || "UNKNOWN",
      created_at: trackingAt || new Date().toISOString(),
      user_id: 0,
    },
    tracking_data: {
      vendor: "sap",
      vendor_name: "SAP Express",
      reference_no: item.reference_no || null,
      awb_no: item.awb_no || awbNo,
      waybill_no: item.awb_no || awbNo,
      current_status: {
        code: item.rowstate || item.rowstate_name || null,
        status: currentStatus,
        description: item.description || null,
        timestamp: trackingAt,
        datetime: trackingAt,
      },
      shipment: {
        service_code: item.service_type_code || null,
        service_name: item.service_type_code || "SAP",
        weight: Number.isFinite(weightNumber as number) ? weightNumber : null,
        weight_unit: "kg",
        pieces: Number.isFinite(piecesNumber as number) ? piecesNumber || 0 : 0,
        koli: Number.isFinite(piecesNumber as number) ? piecesNumber || 0 : 0,
        service_fee: null,
        shipping_cost: Number.isFinite(shippingCostNumber as number)
          ? shippingCostNumber
          : null,
        cod_value: 0,
        insurance_cost: 0,
        total_amount: null,
        booking_id: null,
        invoice_no: null,
        shipped_date: trackingAt,
        item_name: item.volumetric || null,
      },
      sender: {
        name: item.shipper_name || null,
        phone: null,
        address: null,
        postcode: null,
        city: null,
        province: null,
        district: null,
        zipcode: null,
      },
      receiver: {
        name: item.receiver_name || null,
        phone: null,
        address: null,
        postcode: null,
        city: null,
        province: null,
        district: null,
        zipcode: null,
        actual_receiver: null,
      },
      tracking_history: sortedHistory.map((h, index) => {
        const hIso = toIso(h.create_date);
        return {
          sequence: index + 1,
          timestamp: hIso,
          datetime: hIso,
          date_time: hIso,
          status_code: h.rowstate || null,
          status: h.rowstate_name || h.rowstate_web || h.description || null,
          status_name: h.rowstate_web || h.rowstate_name || null,
          description: h.description || null,
          message: rootMsg || null,
          location: {
            hub_name: h.current_branch_name || null,
            city: null,
            city_name: null,
            province: null,
            district: null,
            branch_name: h.current_branch_name || null,
            store_name: null,
            next_site: h.next_branch || h.previous_branch || null,
            next_branch: h.next_branch || null,
          },
          driver: {
            name: h.user_input || null,
            phone: null,
            photo: null,
          },
          recipient: null,
          note: h.description || null,
          image_url:
            (Array.isArray(h.photo_pod) && h.photo_pod[0]) ||
            (Array.isArray(h.photo_pickup) && h.photo_pickup[0]) ||
            null,
        };
      }),
      delivery: {
        estimated_delivery: null,
        delivered_at: null,
        delivered_to: null,
        delivery_relationship: null,
        pod_status_code: item.pod_status_code || null,
        pod_status_name: item.pod_status_name || null,
        proof_of_delivery: {
          signature_url:
            (Array.isArray(item.signature_pod) && item.signature_pod[0]) || null,
          photo_url:
            (Array.isArray(item.photo_pod) && item.photo_pod[0]) || null,
          signature_pod: Array.isArray(item.signature_pod)
            ? item.signature_pod
            : [],
          photo_pod: Array.isArray(item.photo_pod) ? item.photo_pod : [],
        },
      },
      driver_info: {
        pickup_driver: {
          name: item.user_input || null,
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
