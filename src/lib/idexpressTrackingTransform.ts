import type { StandardizedTrackingResponse } from "@/types/tracking";

type IdexpressHistoryItem = {
  waybillNo?: string;
  operationType?: string | null;
  /** Unix epoch dalam DETIK (bukan ms) — lihat docs/idexpress. */
  operationTime?: number | null;
  courierName?: string | null;
  currentBranch?: string | null;
  nextBranchName?: string | null;
  description?: string | null;
  problemCode?: string | null;
  proofOfStatus?: string | null;
  /** Beberapa foto POD (mis. saat "POD Entry"), selain `proofOfStatus` tunggal. */
  completeProofOfStatus?: string[] | null;
  relation?: string | null;
  signer?: string | null;
};

type IdexpressData = {
  basicInfo?: {
    orderNo?: string | null;
    waybillNo?: string | null;
    /** String tanggal (bisa kosong ""), bukan epoch. */
    orderTime?: string | null;
    /** Field lama, dipertahankan untuk kompatibilitas mundur. */
    shipingTime?: number | null;
  } | null;
  itemInfo?: {
    itemName?: string | null;
    insured?: string | number | null;
    itemRemarks?: string | null;
    itemQuantity?: number | null;
    itemCategory?: string | null;
    weight?: string | number | null;
    actualWeight?: string | number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    insuranceAmount?: string | number | null;
    itemValue?: string | number | null;
    actualShippingFee?: string | number | null;
  } | null;
  senderInfo?: {
    senderName?: string | null;
    senderEmail?: string | null;
    senderPhoneNumber?: string | null;
    senderCellphone?: string | null;
    senderProvince?: string | null;
    senderCity?: string | null;
    senderDistrict?: string | null;
    senderAddress?: string | null;
    senderZipCode?: string | null;
  } | null;
  recipientInfo?: {
    recipientName?: string | null;
    recipientEmail?: string | null;
    recipientPhoneNumber?: string | null;
    recipientCellphone?: string | null;
    recipientProvince?: string | null;
    recipientCity?: string | null;
    recipientDistrict?: string | null;
    recipientAddress?: string | null;
    recipientZipCode?: string | null;
  } | null;
  historys?: IdexpressHistoryItem[] | null;
};

/**
 * Bentuk lama/raw vendor (lihat docs/idexpress/tracking.md — dokumentasi resmi vendor):
 * `{ code: 0, desc, total, data: { basicInfo, ... } }`.
 * BEDA dari bentuk BE terbaru: `operationTime` dalam MILIDETIK (bukan detik), dan
 * field sender pakai PascalCase (`SenderPhoneNumber`, dst) — lihat `normalizeLegacyIdexpressData()`.
 * Dipertahankan sebagai fallback jika BE suatu saat meneruskan payload vendor ini langsung.
 */
type IdexpressLegacyHistoryItem = {
  waybillNo?: string;
  operationType?: string | null;
  /** Epoch MILIDETIK di format vendor lama (beda dari bentuk BE terbaru yang pakai detik). */
  operationTime?: number | null;
  courierName?: string | null;
  currentBranch?: string | null;
  nextBranchName?: string | null;
  proofOfStatus?: string | null;
  relation?: string | null;
  signer?: string | null;
};

type IdexpressLegacyData = {
  basicInfo?: {
    orderNo?: string | null;
    waybillNo?: string | null;
    shipingTime?: number | null;
  } | null;
  itemInfo?: IdexpressData["itemInfo"];
  senderInfo?: {
    senderName?: string | null;
    senderEmail?: string | null;
    SenderPhoneNumber?: string | null;
    SenderCellphone?: string | null;
    SenderProvince?: string | null;
    SenderCity?: string | null;
    SenderDistrict?: string | null;
    SenderAddress?: string | null;
    SenderZipCode?: string | null;
  } | null;
  recipientInfo?: IdexpressData["recipientInfo"];
  historys?: IdexpressLegacyHistoryItem[] | null;
};

export type IdexpressTrackingResponse = {
  code?: number;
  desc?: string | null;
  total?: number | null;
  data?: IdexpressLegacyData | null;
};

export function isIdexpressRawResponse(
  data: unknown
): data is IdexpressTrackingResponse {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.code !== "number") return false;
  if (!("data" in obj)) return false;
  const payload = obj.data;
  return !!payload && typeof payload === "object" && "basicInfo" in (payload as Record<string, unknown>);
}

/** Konversi bentuk vendor lama (PascalCase sender, epoch ms) ke bentuk kanonik `IdexpressData`. */
function normalizeLegacyIdexpressData(legacy: IdexpressLegacyData): IdexpressData {
  const s = legacy.senderInfo;
  return {
    basicInfo: {
      orderNo: legacy.basicInfo?.orderNo,
      waybillNo: legacy.basicInfo?.waybillNo,
      shipingTime: legacy.basicInfo?.shipingTime,
    },
    itemInfo: legacy.itemInfo,
    senderInfo: s
      ? {
          senderName: s.senderName,
          senderEmail: s.senderEmail,
          senderPhoneNumber: s.SenderPhoneNumber,
          senderCellphone: s.SenderCellphone,
          senderProvince: s.SenderProvince,
          senderCity: s.SenderCity,
          senderDistrict: s.SenderDistrict,
          senderAddress: s.SenderAddress,
          senderZipCode: s.SenderZipCode,
        }
      : null,
    recipientInfo: legacy.recipientInfo,
    historys: Array.isArray(legacy.historys)
      ? legacy.historys.map((h) => ({
          waybillNo: h.waybillNo,
          operationType: h.operationType,
          // Bentuk lama pakai epoch ms; bentuk kanonik (dipakai fromEpochSeconds) pakai detik.
          operationTime:
            h.operationTime != null ? Math.round(h.operationTime / 1000) : null,
          courierName: h.courierName,
          currentBranch: h.currentBranch,
          nextBranchName: h.nextBranchName,
          proofOfStatus: h.proofOfStatus,
          relation: h.relation,
          signer: h.signer,
        }))
      : null,
  };
}

/**
 * Bentuk BE `/admin/tracking` untuk vendor ID Express (real capture, GET /admin/tracking?awb_no=):
 * `{ success, vendor, tracking_data: { status, message, data: { basicInfo, historys, ... },
 *   raw_response, reference_no }, order_info }` — sama seperti pola JNTCARGO
 * (`jntCargoTrackingTransform.ts`), BUKAN `{ success, data: { status, data: {...} } }`.
 */
export type IdexpressBeTrackingResponse = {
  success?: boolean;
  vendor?: string;
  tracking_data: {
    status?: string;
    message?: string;
    data: IdexpressData;
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

export function isIdexpressBeTrackingWrapper(
  response: unknown
): response is IdexpressBeTrackingResponse {
  if (!response || typeof response !== "object") return false;
  const r = response as Record<string, unknown>;
  const td = r.tracking_data;
  if (!td || typeof td !== "object") return false;
  const t = td as Record<string, unknown>;
  const inner = t.data;
  if (!inner || typeof inner !== "object") return false;
  return "basicInfo" in (inner as Record<string, unknown>);
}

function toNumber(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

/** `basicInfo.shipingTime` (field lama) diasumsikan epoch ms. */
function fromEpochMs(ms: number | null | undefined): string | null {
  if (!ms || !Number.isFinite(ms)) return null;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** `historys[].operationTime` adalah epoch DETIK (dikonfirmasi dari data real). */
function fromEpochSeconds(sec: number | null | undefined): string | null {
  if (!sec || !Number.isFinite(sec)) return null;
  const d = new Date(sec * 1000);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function toIsoFromString(value: string | null | undefined): string | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function firstNonEmpty(url: string | null | undefined): string | null {
  return url && url.trim() !== "" ? url : null;
}

function transformIdexpressData(
  data: IdexpressData,
  awbNo: string,
  success: boolean,
  statusMessage?: string | null
): StandardizedTrackingResponse {
  const basic = data.basicInfo ?? {};
  const item = data.itemInfo ?? {};
  const sender = data.senderInfo ?? {};
  const receiver = data.recipientInfo ?? {};
  const history = Array.isArray(data.historys) ? data.historys : [];
  const sortedHistory = [...history].sort((a, b) => {
    const aTime = a.operationTime ?? 0;
    const bTime = b.operationTime ?? 0;
    return bTime - aTime;
  });
  const latest = sortedHistory[0];
  const first = sortedHistory[sortedHistory.length - 1];
  const latestIso = fromEpochSeconds(latest?.operationTime);
  const podEntry = sortedHistory.find((h) =>
    String(h.operationType || "").toLowerCase().includes("pod")
  );

  const createdAt =
    toIsoFromString(basic.orderTime) ||
    fromEpochMs(basic.shipingTime) ||
    fromEpochSeconds(first?.operationTime) ||
    new Date().toISOString();

  const shippingCost = toNumber(item.actualShippingFee);
  const weight = toNumber(item.actualWeight) ?? toNumber(item.weight);

  return {
    success,
    vendor: "idexpress",
    order_info: {
      reference_no: basic.orderNo || "",
      vendor: "idexpress",
      awb_no: basic.waybillNo || awbNo,
      status: latest?.operationType || statusMessage || "UNKNOWN",
      created_at: createdAt,
      user_id: 0,
    },
    tracking_data: {
      vendor: "idexpress",
      vendor_name: "ID Express",
      reference_no: basic.orderNo || null,
      awb_no: basic.waybillNo || awbNo,
      waybill_no: basic.waybillNo || awbNo,
      current_status: {
        code: latest?.operationType || null,
        status: latest?.operationType || null,
        description: latest?.description || latest?.operationType || statusMessage || null,
        timestamp: latestIso,
        datetime: latestIso,
      },
      shipment: {
        service_code: item.itemCategory || null,
        service_name: item.itemCategory || "ID Express",
        weight,
        weight_unit: "kg",
        pieces: item.itemQuantity ?? 0,
        koli: item.itemQuantity ?? 0,
        service_fee: null,
        shipping_cost: shippingCost,
        cod_value: 0,
        insurance_cost: toNumber(item.insuranceAmount) ?? 0,
        total_amount: shippingCost,
        booking_id: basic.orderNo || null,
        invoice_no: null,
        shipped_date: createdAt,
        item_name: item.itemName || null,
      },
      sender: {
        name: sender.senderName || null,
        phone: sender.senderCellphone || sender.senderPhoneNumber || null,
        address: sender.senderAddress || null,
        postcode: sender.senderZipCode || null,
        city: sender.senderCity || null,
        province: sender.senderProvince || null,
        district: sender.senderDistrict || null,
        zipcode: sender.senderZipCode || null,
      },
      receiver: {
        name: receiver.recipientName || null,
        phone:
          receiver.recipientCellphone || receiver.recipientPhoneNumber || null,
        address: receiver.recipientAddress || null,
        postcode: receiver.recipientZipCode || null,
        city: receiver.recipientCity || null,
        province: receiver.recipientProvince || null,
        district: receiver.recipientDistrict || null,
        zipcode: receiver.recipientZipCode || null,
        actual_receiver: latest?.signer
          ? { name: latest.signer, relationship: latest.relation || null }
          : null,
      },
      tracking_history: sortedHistory.map((h, idx) => {
        const hIso = fromEpochSeconds(h.operationTime);
        const photo =
          (Array.isArray(h.completeProofOfStatus) &&
            firstNonEmpty(h.completeProofOfStatus[0])) ||
          firstNonEmpty(h.proofOfStatus);
        return {
          sequence: idx + 1,
          timestamp: hIso,
          datetime: hIso,
          date_time: hIso,
          status_code: h.operationType || null,
          status: h.operationType || null,
          status_name: h.operationType || null,
          description: h.description || h.operationType || null,
          message: h.description || null,
          location: {
            hub_name: h.currentBranch || null,
            city: null,
            city_name: null,
            province: null,
            district: null,
            branch_name: h.currentBranch || null,
            store_name: null,
            next_site: h.nextBranchName || null,
            next_branch: h.nextBranchName || null,
          },
          driver: {
            name: h.courierName || null,
            phone: null,
            photo: null,
          },
          recipient: h.signer
            ? { name: h.signer, relationship: h.relation || null }
            : null,
          note: h.problemCode || null,
          image_url: photo,
        };
      }),
      delivery: {
        estimated_delivery: null,
        delivered_at: podEntry ? fromEpochSeconds(podEntry.operationTime) : null,
        delivered_to: podEntry?.signer || null,
        delivery_relationship: podEntry?.relation || null,
        pod_status_code: podEntry ? "POD" : null,
        pod_status_name: podEntry?.operationType || null,
        proof_of_delivery: {
          signature_url: null,
          photo_url:
            (Array.isArray(podEntry?.completeProofOfStatus) &&
              firstNonEmpty(podEntry?.completeProofOfStatus?.[0])) ||
            firstNonEmpty(podEntry?.proofOfStatus) ||
            null,
          signature_pod: [],
          photo_pod: Array.isArray(podEntry?.completeProofOfStatus)
            ? podEntry.completeProofOfStatus.filter((u) => firstNonEmpty(u))
            : firstNonEmpty(podEntry?.proofOfStatus)
              ? [podEntry!.proofOfStatus as string]
              : [],
        },
      },
      driver_info: {
        pickup_driver: { name: null, phone: null, photo: null },
        delivery_driver: {
          name: latest?.courierName || null,
          phone: null,
          photo: null,
        },
      },
    },
  };
}

export function transformIdexpressTrackingResponse(
  raw: IdexpressTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  return transformIdexpressData(
    normalizeLegacyIdexpressData(raw.data ?? {}),
    awbNo,
    raw.code === 0,
    raw.desc
  );
}

export function transformIdexpressBeTrackingResponse(
  raw: IdexpressBeTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const result = transformIdexpressData(
    raw.tracking_data.data,
    awbNo,
    raw.success !== false,
    raw.tracking_data.message || raw.tracking_data.status
  );

  const oi = raw.order_info;
  const refNo = oi?.reference_no || raw.tracking_data.reference_no;
  if (refNo) {
    result.order_info.reference_no = refNo;
    result.tracking_data.reference_no = refNo;
  }
  if (oi?.awb_no) {
    result.order_info.awb_no = oi.awb_no;
    result.tracking_data.awb_no = oi.awb_no;
    result.tracking_data.waybill_no = oi.awb_no;
  }
  // `order_info.status` adalah slug status kanonik aplikasi (mis. "sampai_tujuan") —
  // pakai apa adanya (juga isi ke tracking_data.current_status.status supaya
  // CurrentStatusCard bisa mewarnai badge dengan benar), sama seperti
  // jntCargoTrackingTransform.ts. Description tetap pakai teks asli dari history.
  if (oi?.status) {
    result.order_info.status = oi.status;
    result.tracking_data.current_status.status = oi.status;
  }
  if (oi?.created_at) {
    result.order_info.created_at = oi.created_at;
  }
  if (oi?.user_id != null) {
    result.order_info.user_id = oi.user_id;
  }
  if (oi?.vendor || raw.vendor) {
    const v = String(oi?.vendor ?? raw.vendor).toLowerCase();
    result.order_info.vendor = v;
    result.vendor = v;
    result.tracking_data.vendor = v;
  }

  return result;
}
