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

type AdminTrackingParty = {
  name?: string;
  phone?: string;
  address?: string;
  province?: string;
  regency?: string;
  district?: string;
};

type AdminTrackingOrder = {
  id?: number;
  user_id?: number;
  vendor?: string;
  reference_no?: string;
  awb_no?: string;
  status?: string;
  created_at?: string;
  request_payload?: {
    sender?: AdminTrackingParty;
    receiver?: AdminTrackingParty;
    detail?: {
      goods_desc?: string;
      item_value?: number;
      weight?: number;
      category?: string;
    };
  };
};

type LionStandardizedTrackingInfo = {
  awb_no?: string;
  reference_no?: string;
  current_status?: string;
  current_status_code?: string;
  status_description?: string;
  sender?: { name?: string; address?: string };
  receiver?: { name?: string; address?: string };
  shipment_details?: {
    product_type?: string;
    chargeable_weight?: number;
    gross_weight?: number;
    volume_weight?: number;
    pieces?: number;
    shipment_id?: string;
  };
  tracking_history?: Array<{
    id?: number;
    timestamp?: string;
    status?: string;
    status_code?: string;
    description?: string;
    location?: string;
    city?: string;
    remarks?: string;
    updated_by?: string;
    metadata?: {
      total_tariff?: number;
      chargeable_weight?: number;
      pieces?: number;
    };
  }>;
  last_update?: string;
  vendor?: string;
  vendor_name?: string;
};

type LionDashboardAddress = {
  name?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  district?: string | null;
  zip_code?: string | null;
  phone?: string | null;
  email?: string | null;
  note?: string | null;
};

type LionDashboardHistoryItem = {
  datetime?: string | null;
  city?: string | null;
  status?: string | null;
  status_code?: string | null;
  store_name?: string | null;
  driver_name?: string | null;
  driver_phone?: string | null;
  note?: string | null;
  next_site?: string | null;
  name?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
};

/** Format BE dashboard: `{ vendor, tracking_data: { addresses, package_info, ... }, order_info }` */
export type LionDashboardTrackingResponse = {
  success?: boolean;
  vendor?: string;
  tracking_data: {
    awb_no?: string | null;
    invoice_number?: string | null;
    package_info?: {
      item_name?: string | null;
      weight?: number | null;
      quantity?: number | null;
      service_code?: string | null;
      category?: string | null;
      pickup_datetime?: string | null;
      note?: string | null;
    };
    cost_details?: {
      shipping_cost?: number | null;
      cod_value?: number | null;
      insurance_cost?: number | null;
      total_amount?: number | null;
      invoice_value?: number | null;
      payment_type?: string | null;
    };
    addresses?: {
      sender?: LionDashboardAddress;
      receiver?: LionDashboardAddress;
    };
    tracking_history?: LionDashboardHistoryItem[];
    estimated_times?: unknown;
    latest_status?: string | null;
    delivery_datetime?: string | null;
    photo_url?: string | null;
    signature_url?: string | null;
    cancellation_reason?: string | null;
    driver_info?: unknown;
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
/** Inner `data` dari GET /admin/tracking: `{ vendor_response, standardized_response, order }` */
/** Ambil `order` (beserta `request_payload`) dari berbagai bentuk response BE. */
export function isLionAdminTrackingVendor(response: unknown): boolean {
  if (!response || typeof response !== "object") return false;
  const vendor = String(
    (response as Record<string, unknown>).vendor ?? ""
  ).toLowerCase();
  return vendor === "lion";
}

/** Gabungkan `data` dari `/admin/expedition/lion/tracking` ke response `/admin/tracking`. */
export function mergeLionExpeditionIntoAdminResponse(
  adminResponse: unknown,
  expeditionResponse: unknown
): unknown {
  if (!adminResponse || typeof adminResponse !== "object") {
    return adminResponse;
  }
  if (!expeditionResponse || typeof expeditionResponse !== "object") {
    return adminResponse;
  }

  const expData = (expeditionResponse as Record<string, unknown>).data;
  if (!expData || typeof expData !== "object") {
    return adminResponse;
  }

  return {
    ...(adminResponse as Record<string, unknown>),
    data: expData,
  };
}

export function extractTrackingOrder(response: unknown): AdminTrackingOrder | undefined {
  if (!response || typeof response !== "object") return undefined;
  const root = response as Record<string, unknown>;

  const inner = unwrapAdminTrackingInner(response);
  if (inner?.order && typeof inner.order === "object") {
    return inner.order as AdminTrackingOrder;
  }

  if (root.order && typeof root.order === "object") {
    return root.order as AdminTrackingOrder;
  }

  const data = root.data;
  if (data && typeof data === "object") {
    const d = data as Record<string, unknown>;
    if (d.order && typeof d.order === "object") {
      return d.order as AdminTrackingOrder;
    }
  }

  return undefined;
}

function positiveAmount(value: number | null | undefined): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function isLionDashboardTrackingResponse(
  response: unknown
): response is LionDashboardTrackingResponse {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  if (!("tracking_data" in r)) return false;
  const td = r.tracking_data;
  if (!td || typeof td !== "object") return false;
  const t = td as Record<string, unknown>;
  if (isLionRawResponse(t.data)) return false;
  return "addresses" in t && "package_info" in t;
}

function mapDashboardAddress(addr?: LionDashboardAddress) {
  return {
    name: addr?.name ?? null,
    phone: addr?.phone ?? null,
    address: addr?.address ?? null,
    postcode: addr?.zip_code ?? null,
    city: addr?.city ?? null,
    province: addr?.province ?? null,
    district: addr?.district ?? null,
    zipcode: addr?.zip_code ?? null,
  };
}

export function transformLionDashboardTrackingResponse(
  apiResponse: LionDashboardTrackingResponse,
  awbNo: string,
  order?: AdminTrackingOrder,
  fullResponse?: unknown
): StandardizedTrackingResponse {
  const td = apiResponse.tracking_data;
  const oi = apiResponse.order_info;
  const pkg = td.package_info;
  const cost = td.cost_details;
  const sender = td.addresses?.sender;
  const receiver = td.addresses?.receiver;
  const history = Array.isArray(td.tracking_history) ? td.tracking_history : [];

  const sortedNewest = [...history].sort((a, b) => {
    const at = new Date(a.datetime || "").getTime();
    const bt = new Date(b.datetime || "").getTime();
    return bt - at;
  });
  const sortedOldest = [...history].sort((a, b) => {
    const at = new Date(a.datetime || "").getTime();
    const bt = new Date(b.datetime || "").getTime();
    return at - bt;
  });
  const latest = sortedNewest[0];
  const first = sortedOldest[0];

  const displayAwb =
    oi?.awb_no ||
    order?.awb_no ||
    (awbNo.trim() || null) ||
    td.awb_no ||
    null;

  const lookupKey = displayAwb || awbNo.trim() || td.awb_no || "";
  const statusDescription =
    latest?.note?.trim() ||
    latest?.status?.trim() ||
    td.latest_status ||
    null;

  const result: StandardizedTrackingResponse = {
    success: apiResponse.success !== false,
    vendor: String(apiResponse.vendor ?? oi?.vendor ?? "lion").toLowerCase(),
    order_info: {
      reference_no: oi?.reference_no || order?.reference_no || "",
      vendor: String(oi?.vendor ?? apiResponse.vendor ?? "lion").toLowerCase(),
      awb_no: displayAwb,
      status: oi?.status || order?.status || td.latest_status || latest?.status || "unknown",
      created_at: oi?.created_at || order?.created_at || toIso(first?.datetime) || new Date().toISOString(),
      user_id: oi?.user_id ?? order?.user_id ?? 0,
    },
    tracking_data: {
      vendor: String(apiResponse.vendor ?? oi?.vendor ?? "lion").toLowerCase(),
      vendor_name: "Lion Parcel",
      reference_no: oi?.reference_no || order?.reference_no || null,
      awb_no: displayAwb,
      waybill_no: td.awb_no || displayAwb,
      current_status: {
        code: latest?.status_code || null,
        status: oi?.status || order?.status || td.latest_status || latest?.status || null,
        description: statusDescription,
        timestamp: toIso(latest?.datetime),
        datetime: toIso(latest?.datetime),
      },
      shipment: {
        service_code: pkg?.service_code || null,
        service_name: pkg?.service_code || "Lion Parcel",
        weight: pkg?.weight ?? null,
        weight_unit: "kg",
        pieces: pkg?.quantity ?? 0,
        koli: pkg?.quantity ?? 0,
        service_fee: null,
        shipping_cost: null,
        cod_value: cost?.cod_value ?? 0,
        insurance_cost: cost?.insurance_cost ?? 0,
        total_amount: null,
        booking_id: displayAwb,
        invoice_no: td.invoice_number || null,
        shipped_date: toIso(first?.datetime),
        item_name: pkg?.item_name || null,
      },
      sender: mapDashboardAddress(sender),
      receiver: {
        ...mapDashboardAddress(receiver),
        actual_receiver: null,
      },
      tracking_history: sortedOldest.map((h, idx) => ({
        sequence: idx + 1,
        timestamp: toIso(h.datetime),
        datetime: toIso(h.datetime),
        date_time: h.datetime || null,
        status_code: h.status_code || null,
        status: h.status || null,
        status_name: h.status || h.status_code || null,
        description: h.status || h.note || null,
        message: h.note || h.status || null,
        location: {
          hub_name: h.store_name || null,
          city: h.city || null,
          city_name: h.city || null,
          province: h.province || null,
          district: h.district || null,
          branch_name: h.store_name || null,
          store_name: h.store_name || null,
          next_site: h.next_site || null,
          next_branch: null,
        },
        driver: {
          name: h.driver_name || null,
          phone: h.driver_phone || null,
          photo: null,
        },
        recipient: h.name ? { name: h.name, relationship: null } : null,
        note: h.note || null,
        image_url: null,
      })),
      delivery: {
        estimated_delivery: null,
        delivered_at: toIso(td.delivery_datetime),
        delivered_to: null,
        delivery_relationship: null,
        pod_status_code: null,
        pod_status_name: null,
        proof_of_delivery: {
          signature_url: td.signature_url || null,
          photo_url: td.photo_url || null,
          signature_pod: td.signature_url ? [td.signature_url] : [],
          photo_pod: td.photo_url ? [td.photo_url] : [],
        },
      },
      driver_info: {
        pickup_driver: { name: null, phone: null, photo: null },
        delivery_driver: { name: null, phone: null, photo: null },
      },
    },
  };

  mergeLionOrderContext(result, order);

  if (!result.tracking_data.current_status.description && statusDescription) {
    result.tracking_data.current_status.description = statusDescription;
  }

  applyLionShipmentTariff(result, fullResponse ?? apiResponse, lookupKey);
  return result;
}

export function unwrapAdminTrackingInner(
  response: unknown
): Record<string, unknown> | null {
  if (!response || typeof response !== "object") return null;
  const root = response as Record<string, unknown>;
  const data = root.data;
  if (!data || typeof data !== "object") return null;
  const inner = data as Record<string, unknown>;
  if (
    "vendor_response" in inner ||
    "standardized_response" in inner ||
    "order" in inner
  ) {
    return inner;
  }
  return null;
}

export function unwrapLionTrackingPayload(input: unknown): LionTrackingResponse | null {
  if (isLionRawResponse(input)) {
    return input;
  }
  if (input && typeof input === "object") {
    const root = input as Record<string, unknown>;

    if (isLionRawResponse(root.vendor_response)) {
      return root.vendor_response;
    }

    const adminInner = unwrapAdminTrackingInner(input) ?? unwrapAdminTrackingInner(root);
    if (adminInner && isLionRawResponse(adminInner.vendor_response)) {
      return adminInner.vendor_response;
    }

    if (root.data && isLionRawResponse(root.data)) {
      return root.data;
    }

    if (root.data && typeof root.data === "object") {
      const nested = root.data as Record<string, unknown>;
      if (isLionRawResponse(nested.vendor_response)) {
        return nested.vendor_response;
      }
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
        String(s.root_stt_number || "").toUpperCase() === needle ||
        String(s.shipment_id || "").toUpperCase() === needle
    ) ?? stts[0]
  );
}

function mergeLionOrderContext(
  result: StandardizedTrackingResponse,
  order?: AdminTrackingOrder
): void {
  if (!order) return;

  const payload = order.request_payload;
  const sender = payload?.sender;
  const receiver = payload?.receiver;

  if (sender) {
    if (sender.name) result.tracking_data.sender.name = sender.name;
    if (sender.phone) result.tracking_data.sender.phone = sender.phone;
    if (sender.address) result.tracking_data.sender.address = sender.address;
    if (sender.regency) result.tracking_data.sender.city = sender.regency;
    if (sender.province) result.tracking_data.sender.province = sender.province;
    if (sender.district) result.tracking_data.sender.district = sender.district;
  }

  if (receiver) {
    if (receiver.name) result.tracking_data.receiver.name = receiver.name;
    if (receiver.phone) result.tracking_data.receiver.phone = receiver.phone;
    if (receiver.address) result.tracking_data.receiver.address = receiver.address;
    if (receiver.regency) result.tracking_data.receiver.city = receiver.regency;
    if (receiver.province) result.tracking_data.receiver.province = receiver.province;
    if (receiver.district) result.tracking_data.receiver.district = receiver.district;
  }

  if (payload?.detail?.goods_desc) {
    result.tracking_data.shipment.item_name = payload.detail.goods_desc;
  }

  if (order.reference_no) {
    result.tracking_data.reference_no = order.reference_no;
    result.order_info.reference_no = order.reference_no;
  }
  if (order.awb_no) {
    result.tracking_data.awb_no = order.awb_no;
    result.tracking_data.waybill_no = order.awb_no;
    result.order_info.awb_no = order.awb_no;
  }
  if (order.status) {
    result.order_info.status = order.status;
  }
  if (order.created_at) {
    result.order_info.created_at = order.created_at;
  }
  if (order.user_id != null) {
    result.order_info.user_id = order.user_id;
  }
  if (order.vendor) {
    result.order_info.vendor = order.vendor.toLowerCase();
    result.vendor = order.vendor.toLowerCase();
    result.tracking_data.vendor = order.vendor.toLowerCase();
  }
}

function transformLionStandardizedTrackingInfo(
  standardized: { tracking_info?: LionStandardizedTrackingInfo },
  order: AdminTrackingOrder | undefined,
  awbNo: string
): StandardizedTrackingResponse | null {
  const info = standardized.tracking_info;
  if (!info) return null;

  const history = Array.isArray(info.tracking_history) ? info.tracking_history : [];
  const sorted = [...history].sort((a, b) => {
    const at = new Date(a.timestamp || "").getTime();
    const bt = new Date(b.timestamp || "").getTime();
    return bt - at;
  });
  const latest = sorted[0];
  const details = info.shipment_details;
  const latestTariff = [...history]
    .reverse()
    .find((h) => Number(h.metadata?.total_tariff) > 0);

  const result: StandardizedTrackingResponse = {
    success: true,
    vendor: "lion",
    order_info: {
      reference_no: info.reference_no || order?.reference_no || "",
      vendor: "lion",
      awb_no: order?.awb_no || info.shipment_details?.shipment_id || info.awb_no || awbNo,
      status: info.current_status || order?.status || "unknown",
      created_at: order?.created_at || toIso(info.last_update) || new Date().toISOString(),
      user_id: order?.user_id ?? 0,
    },
    tracking_data: {
      vendor: "lion",
      vendor_name: info.vendor_name || "Lion Parcel",
      reference_no: info.reference_no || order?.reference_no || null,
      awb_no: order?.awb_no || details?.shipment_id || info.awb_no || awbNo,
      waybill_no: info.awb_no || details?.shipment_id || order?.awb_no || awbNo,
      current_status: {
        code: info.current_status_code || latest?.status_code || null,
        status: info.current_status || latest?.status || null,
        description:
          info.status_description || latest?.description || latest?.remarks || null,
        timestamp: toIso(latest?.timestamp || info.last_update),
        datetime: toIso(latest?.timestamp || info.last_update),
      },
      shipment: {
        service_code: details?.product_type || null,
        service_name: details?.product_type || "Lion Parcel",
        weight: details?.chargeable_weight ?? details?.gross_weight ?? null,
        weight_unit: "kg",
        pieces: details?.pieces ?? 0,
        koli: details?.pieces ?? 0,
        service_fee: null,
        shipping_cost: latestTariff?.metadata?.total_tariff ?? null,
        cod_value: 0,
        insurance_cost: 0,
        total_amount: latestTariff?.metadata?.total_tariff ?? null,
        booking_id: details?.shipment_id || null,
        invoice_no: null,
        shipped_date: toIso(history[0]?.timestamp),
        item_name: details?.product_type || null,
      },
      sender: {
        name: info.sender?.name || null,
        phone: null,
        address: info.sender?.address || null,
        postcode: null,
        city: info.sender?.address || null,
        province: null,
        district: null,
        zipcode: null,
      },
      receiver: {
        name: info.receiver?.name || null,
        phone: null,
        address: info.receiver?.address || null,
        postcode: null,
        city: info.receiver?.address || null,
        province: null,
        district: null,
        zipcode: null,
        actual_receiver: null,
      },
      tracking_history: history.map((h, idx) => ({
        sequence: h.id ?? idx + 1,
        timestamp: toIso(h.timestamp),
        datetime: toIso(h.timestamp),
        date_time: h.timestamp || null,
        status_code: h.status_code || null,
        status: h.status || null,
        status_name: h.status_code || h.status || null,
        description: h.description || h.remarks || null,
        message: h.remarks || h.description || null,
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
        driver: { name: h.updated_by || null, phone: null, photo: null },
        recipient: null,
        note: h.remarks || null,
        image_url: null,
      })),
      delivery: {
        estimated_delivery: null,
        delivered_at: null,
        delivered_to: null,
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
        pickup_driver: { name: null, phone: null, photo: null },
        delivery_driver: { name: null, phone: null, photo: null },
      },
    },
  };

  mergeLionOrderContext(result, order);
  return result;
}

/**
 * GET /admin/tracking envelope: { success, data: { vendor_response, standardized_response, order } }
 */
export function transformAdminLionTrackingResponse(
  response: unknown,
  awbNo: string
): StandardizedTrackingResponse | null {
  const inner = unwrapAdminTrackingInner(response);
  if (!inner) return null;

  const order = inner.order as AdminTrackingOrder | undefined;
  const lookupKey = awbNo.trim() || order?.awb_no || order?.reference_no || "";

  if (isLionRawResponse(inner.vendor_response)) {
    const result = transformLionTrackingResponse(inner.vendor_response, lookupKey);
    mergeLionOrderContext(result, order);
    applyLionShipmentTariff(result, response, lookupKey);
    if (response && typeof response === "object" && "success" in response) {
      result.success = (response as { success?: boolean }).success !== false;
    }
    return result;
  }

  const standardized = inner.standardized_response;
  if (standardized && typeof standardized === "object") {
    const fromStandardized = transformLionStandardizedTrackingInfo(
      standardized as { tracking_info?: LionStandardizedTrackingInfo },
      order,
      lookupKey
    );
    if (fromStandardized) {
      applyLionShipmentTariff(fromStandardized, response, lookupKey);
      if (response && typeof response === "object" && "success" in response) {
        fromStandardized.success =
          (response as { success?: boolean }).success !== false;
      }
      return fromStandardized;
    }
  }

  return null;
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

/** Ambil `chargeable_total_tariff` dari `vendor_response.stts` (atau history). */
export function extractLionChargeableTariff(
  response: unknown,
  awbNo: string
): number | null {
  try {
    const payload = unwrapLionTrackingPayload(response);
    if (!payload?.stts?.length) return null;

    const order = extractTrackingOrder(response);
    const lookupKey =
      awbNo.trim() || order?.awb_no || order?.reference_no || "";
    const stt = pickSttItem(payload.stts, lookupKey);

    const direct = positiveAmount(
      stt.chargeable_total_tariff ?? stt.chargeable_total_tariff_exc_cod_fee ?? undefined
    );
    if (direct != null) return direct;

    const history = Array.isArray(stt.history) ? stt.history : [];
    return latestTariffFromHistory(history);
  } catch {
    return null;
  }
}

function resolveDashboardCostDetails(response: unknown): number | null {
  if (!response || typeof response !== "object") return null;
  const td = (response as Record<string, unknown>).tracking_data;
  if (!td || typeof td !== "object") return null;
  const cost = (td as Record<string, unknown>).cost_details;
  if (!cost || typeof cost !== "object") return null;
  const c = cost as Record<string, number | null | undefined>;
  return positiveAmount(c.shipping_cost) ?? positiveAmount(c.total_amount);
}

export function lionTrackingNeedsExpeditionEnrich(
  response: unknown,
  awbNo: string
): boolean {
  if (!isLionAdminTrackingVendor(response)) return false;
  return (
    extractLionChargeableTariff(response, awbNo) == null ||
    !extractTrackingOrder(response)
  );
}

function applyLionShipmentTariff(
  result: StandardizedTrackingResponse,
  response: unknown,
  awbNo: string
): void {
  try {
    if (positiveAmount(result.tracking_data.shipment.shipping_cost) != null) {
      if (positiveAmount(result.tracking_data.shipment.total_amount) == null) {
        result.tracking_data.shipment.total_amount =
          result.tracking_data.shipment.shipping_cost;
      }
      return;
    }

    const tariff =
      extractLionChargeableTariff(response, awbNo) ??
      resolveDashboardCostDetails(response);
    if (tariff == null) return;

    result.tracking_data.shipment.shipping_cost = tariff;
    result.tracking_data.shipment.total_amount = tariff;
  } catch {
    // Jangan gagalkan seluruh transform jika tariff gagal di-resolve
  }
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

  const displayAwb =
    stt.shipment_id &&
    awbNo.trim().toUpperCase() === String(stt.shipment_id).toUpperCase()
      ? stt.shipment_id
      : stt.stt_no || stt.root_stt_number || stt.shipment_id || awbNo;

  return {
    success: true,
    vendor: "lion",
    order_info: {
      reference_no: stt.shipment_id || "",
      vendor: "lion",
      awb_no: displayAwb,
      status: stt.current_status || stt.status_code || latest?.current_status || "UNKNOWN",
      created_at: firstIso || latestIso || new Date().toISOString(),
      user_id: 0,
    },
    tracking_data: {
      vendor: "lion",
      vendor_name: "Lion Parcel",
      reference_no: stt.shipment_id || null,
      awb_no: displayAwb,
      waybill_no: stt.stt_no || stt.root_stt_number || stt.shipment_id || awbNo,
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
  const lookupKey =
    awbNo.trim() ||
    apiResponse.order_info?.awb_no ||
    lionRaw.stts?.[0]?.shipment_id ||
    lionRaw.stts?.[0]?.stt_no ||
    "";
  const result = transformLionTrackingResponse(lionRaw, lookupKey);

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
      awb_no: result.tracking_data.awb_no ?? oi.awb_no ?? lookupKey,
      status: String(oi.status ?? result.order_info.status),
      created_at: String(oi.created_at ?? result.order_info.created_at),
      user_id: Number(oi.user_id ?? 0),
    };
  }

  return result;
}
