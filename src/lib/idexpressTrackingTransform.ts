import type { StandardizedTrackingResponse } from "@/types/tracking";

type IdexpressHistoryItem = {
  waybillNo?: string;
  operationType?: string | null;
  operationTime?: number | null;
  courierName?: string | null;
  currentBranch?: string | null;
  nextBranchName?: string | null;
  proofOfStatus?: string | null;
  relation?: string | null;
  signer?: string | null;
};

type IdexpressData = {
  basicInfo?: {
    orderNo?: string | null;
    waybillNo?: string | null;
    shipingTime?: number | null;
  } | null;
  itemInfo?: {
    itemName?: string | null;
    insured?: string | number | null;
    itemRemarks?: string | null;
    itemQuantity?: number | null;
    itemCategory?: string | null;
    weight?: string | number | null;
    length?: number | null;
    width?: number | null;
    height?: number | null;
    insuranceAmount?: string | number | null;
    itemValue?: string | number | null;
  } | null;
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
  recipientInfo?: {
    recipientName?: string | null;
    recipientEmail?: string | null;
    recipientPhoneNumber?: string | null;
    recipientCellphone?: string | null;
    recipientProvince?: string | null;
    recipientCity?: string | null;
    recipientDistrict?: string | null;
    recipientAddress?: string | null;
  } | null;
  historys?: IdexpressHistoryItem[] | null;
};

export type IdexpressTrackingResponse = {
  code?: number;
  desc?: string | null;
  total?: number | null;
  data?: IdexpressData | null;
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

function toNumber(v: string | number | null | undefined): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function fromEpochMs(ms: number | null | undefined): string | null {
  if (!ms || !Number.isFinite(ms)) return null;
  const d = new Date(ms);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function transformIdexpressTrackingResponse(
  raw: IdexpressTrackingResponse,
  awbNo: string
): StandardizedTrackingResponse {
  const data = raw.data ?? {};
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
  const latestIso = fromEpochMs(latest?.operationTime);

  return {
    success: raw.code === 0,
    vendor: "idexpress",
    order_info: {
      reference_no: basic.orderNo || "",
      vendor: "idexpress",
      awb_no: basic.waybillNo || awbNo,
      status: latest?.operationType || "UNKNOWN",
      created_at: fromEpochMs(basic.shipingTime) || new Date().toISOString(),
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
        description: latest?.operationType || raw.desc || null,
        timestamp: latestIso,
        datetime: latestIso,
      },
      shipment: {
        service_code: item.itemCategory || null,
        service_name: item.itemCategory || "ID Express",
        weight: toNumber(item.weight),
        weight_unit: "kg",
        pieces: item.itemQuantity ?? 0,
        koli: item.itemQuantity ?? 0,
        service_fee: null,
        shipping_cost: null,
        cod_value: 0,
        insurance_cost: toNumber(item.insuranceAmount) ?? 0,
        total_amount: toNumber(item.itemValue),
        booking_id: basic.orderNo || null,
        invoice_no: null,
        shipped_date: fromEpochMs(basic.shipingTime),
        item_name: item.itemName || null,
      },
      sender: {
        name: sender.senderName || null,
        phone: sender.SenderCellphone || sender.SenderPhoneNumber || null,
        address: sender.SenderAddress || null,
        postcode: sender.SenderZipCode || null,
        city: sender.SenderCity || null,
        province: sender.SenderProvince || null,
        district: sender.SenderDistrict || null,
        zipcode: sender.SenderZipCode || null,
      },
      receiver: {
        name: receiver.recipientName || null,
        phone:
          receiver.recipientCellphone || receiver.recipientPhoneNumber || null,
        address: receiver.recipientAddress || null,
        postcode: null,
        city: receiver.recipientCity || null,
        province: receiver.recipientProvince || null,
        district: receiver.recipientDistrict || null,
        zipcode: null,
        actual_receiver: latest?.signer
          ? { name: latest.signer, relationship: latest.relation || null }
          : null,
      },
      tracking_history: sortedHistory.map((h, idx) => ({
        sequence: idx + 1,
        timestamp: fromEpochMs(h.operationTime),
        datetime: fromEpochMs(h.operationTime),
        date_time: fromEpochMs(h.operationTime),
        status_code: h.operationType || null,
        status: h.operationType || null,
        status_name: h.operationType || null,
        description: h.operationType || null,
        message: raw.desc || null,
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
        note: null,
        image_url:
          h.proofOfStatus && h.proofOfStatus.trim() !== ""
            ? h.proofOfStatus
            : null,
      })),
      delivery: {
        estimated_delivery: null,
        delivered_at: null,
        delivered_to: latest?.signer || null,
        delivery_relationship: latest?.relation || null,
        pod_status_code: null,
        pod_status_name: null,
        proof_of_delivery: {
          signature_url: null,
          photo_url:
            latest?.proofOfStatus && latest.proofOfStatus.trim() !== ""
              ? latest.proofOfStatus
              : null,
          signature_pod: [],
          photo_pod:
            latest?.proofOfStatus && latest.proofOfStatus.trim() !== ""
              ? [latest.proofOfStatus]
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
