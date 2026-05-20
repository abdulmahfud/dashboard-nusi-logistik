/**
 * Normalisasi response cek ongkir Pos Indonesia dari BE.
 * Mendukung:
 * - BE terbaru: data.final_cost, service_name, estimation, vendor_service
 * - Vendor: { response: { data: [...] } }
 * - Array camelCase / legacy productname
 */

/** Nama tampilan di kartu ekspedisi (bukan service_name dari vendor) */
export const POS_INDONESIA_DISPLAY_NAME = "Pos Indonesia";

/** serviceCode 910546 = PPKH (marketplace) — dipakai Addpostingdoc */
export const POS_INDONESIA_SERVICE_CODE_PPKH = 910546;
/** Kode layanan reguler lama */
export const POS_INDONESIA_SERVICE_CODE_REGULER_LEGACY = 910548;

export type PosIndonesiaPostingSnapshot = {
  serviceCode: number;
  fee: number;
  feeTax: number;
  insurance: number;
  insuranceTax: number;
  totalFee: number;
};

export type PosIndonesiaMappedOption = {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  duration: string;
  posIndonesiaPosting?: PosIndonesiaPostingSnapshot;
};

export function isPosIndonesiaApiSuccess(
  result: { status?: string; success?: boolean } | null | undefined
): boolean {
  if (!result) return false;
  return result.status === "success" || result.success === true;
}

export function unwrapPosIndonesiaCekOngkirData(data: unknown): unknown {
  if (data == null) return data;
  if (Array.isArray(data)) return data;
  if (typeof data !== "object") return data;
  const o = data as Record<string, unknown>;
  const resp = o.response;
  if (resp && typeof resp === "object" && !Array.isArray(resp)) {
    const inner = (resp as Record<string, unknown>).data;
    if (Array.isArray(inner)) return inner;
  }
  return data;
}

function parseServiceCode(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Satu baris layanan (camelCase vendor atau snake_case BE) → bentuk internal */
export function normalizePosIndonesiaServiceRow(
  source: Record<string, unknown>
): Record<string, unknown> | null {
  const vendorService = source.vendor_service;
  if (vendorService && typeof vendorService === "object" && !Array.isArray(vendorService)) {
    return vendorService as Record<string, unknown>;
  }

  const serviceCode =
    parseServiceCode(source.serviceCode) ??
    parseServiceCode(source.service_code) ??
    parseServiceCode(source.product_id);

  if (serviceCode == null) return null;

  const fee = source.fee ?? source.fee_amount;
  const feeTax = source.feeTax ?? source.fee_tax;
  const insurance = source.insurance ?? 0;
  const insuranceTax = source.insuranceTax ?? source.insurance_tax ?? 0;
  const totalFee =
    source.totalFee ??
    source.total_fee ??
    source.final_cost ??
    (source.discount_info as Record<string, unknown> | undefined)?.final_cost;

  return {
    serviceCode,
    serviceName: source.serviceName ?? source.service_name ?? "Pos Indonesia",
    fee,
    feeTax,
    insurance,
    insuranceTax,
    totalFee,
    estimation: source.estimation ?? source.estimated_days,
  };
}

function isPosIndonesiaCamelCaseRow(
  item: unknown
): item is Record<string, unknown> {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  const obj = item as Record<string, unknown>;
  const code =
    parseServiceCode(obj.serviceCode) ?? parseServiceCode(obj.service_code);
  const name = obj.serviceName ?? obj.service_name;
  const total =
    obj.totalFee ?? obj.total_fee ?? obj.final_cost;
  return code != null && typeof name === "string" && total != null;
}

export function selectPosIndonesiaDisplayService(
  rows: unknown[]
): Record<string, unknown> | null {
  const newRows = rows.filter(isPosIndonesiaCamelCaseRow);
  if (newRows.length === 0) return null;

  const pick = (code: number) =>
    newRows.find((r) => {
      const c =
        parseServiceCode(r.serviceCode) ?? parseServiceCode(r.service_code);
      const total = Number(r.totalFee ?? r.total_fee ?? r.final_cost);
      return c === code && total > 0;
    }) ?? null;

  return (
    pick(POS_INDONESIA_SERVICE_CODE_PPKH) ??
    pick(POS_INDONESIA_SERVICE_CODE_REGULER_LEGACY) ??
    newRows.find((r) => Number(r.totalFee ?? r.total_fee ?? r.final_cost) > 0) ??
    null
  );
}

export function extractPosIndonesiaPostingSnapshot(
  row: Record<string, unknown>
): PosIndonesiaPostingSnapshot | undefined {
  const serviceCode =
    parseServiceCode(row.serviceCode) ?? parseServiceCode(row.service_code);
  if (serviceCode == null) return undefined;

  const fee = Number(row.fee);
  const feeTax = Number(row.feeTax ?? row.fee_tax);
  const insurance = Number(row.insurance ?? 0);
  const insuranceTax = Number(row.insuranceTax ?? row.insurance_tax ?? 0);
  const totalFee = Number(row.totalFee ?? row.total_fee ?? row.final_cost);

  if (
    !Number.isFinite(fee) ||
    !Number.isFinite(feeTax) ||
    !Number.isFinite(insurance) ||
    !Number.isFinite(insuranceTax) ||
    !Number.isFinite(totalFee)
  ) {
    return undefined;
  }

  return {
    serviceCode,
    fee,
    feeTax,
    insurance,
    insuranceTax,
    totalFee,
  };
}

function mapRowToOption(
  row: Record<string, unknown>,
  displayCost?: number
): PosIndonesiaMappedOption | null {
  const serviceCode =
    parseServiceCode(row.serviceCode) ?? parseServiceCode(row.service_code);
  if (serviceCode == null) return null;

  const finalCost = Number(
    displayCost ??
      row.final_cost ??
      (row.discount_info as Record<string, unknown> | undefined)?.final_cost ??
      row.totalFee ??
      row.total_fee
  );
  if (!Number.isFinite(finalCost) || finalCost <= 0) return null;

  const originalCost = Number(row.original_cost);
  const estimation = String(row.estimation ?? "2-4 Hari");
  const posting = extractPosIndonesiaPostingSnapshot(row);

  return {
    id: `posindonesia-${serviceCode}`,
    name: POS_INDONESIA_DISPLAY_NAME,
    price: `Rp${finalCost.toLocaleString("id-ID")}`,
    ...(Number.isFinite(originalCost) &&
    originalCost > finalCost &&
    row.discount_applied === true
      ? { originalPrice: `Rp${originalCost.toLocaleString("id-ID")}` }
      : {}),
    duration: estimation,
    ...(posting ? { posIndonesiaPosting: posting } : {}),
  };
}

/** Response BE terbaru: objek tunggal dengan final_cost + service_name */
function mapNormalizedBeResponse(
  o: Record<string, unknown>
): PosIndonesiaMappedOption | null {
  const hasBeShape =
    "final_cost" in o ||
    "service_name" in o ||
    "service_code" in o ||
    "vendor_service" in o;
  if (!hasBeShape) return null;

  const row = normalizePosIndonesiaServiceRow(o);
  if (!row) return null;

  const finalCost = Number(
    o.final_cost ??
      (o.discount_info as Record<string, unknown> | undefined)?.final_cost ??
      row.totalFee
  );
  return mapRowToOption({ ...row, ...o, final_cost: finalCost }, finalCost);
}

function mapLegacyPosRegulerObject(
  o: Record<string, unknown>
): PosIndonesiaMappedOption | null {
  if (!("serviceName" in o && "totalFee" in o)) return null;
  const serviceName = String(o.serviceName);
  const totalFee = Number(o.totalFee);
  if (serviceName !== "Pos Reguler" || totalFee <= 0) return null;

  return {
    id: "posindonesia-reguler",
    name: POS_INDONESIA_DISPLAY_NAME,
    price: `Rp${totalFee.toLocaleString("id-ID")}`,
    duration: String(o.estimation ?? "2-4 Hari"),
  };
}

function mapLegacyProductNameArray(
  posData: Array<Record<string, unknown>>
): PosIndonesiaMappedOption | null {
  const posReguler = posData.find((item) => item.productname === "Pos Reguler");
  if (!posReguler?.totalfee) return null;
  return {
    id: "posindonesia-reguler",
    name: POS_INDONESIA_DISPLAY_NAME,
    price: `Rp${Number(posReguler.totalfee).toLocaleString("id-ID")}`,
    duration: String(posReguler.estimation || "2-4 Hari"),
  };
}

/**
 * Ubah `posindonesia.data` (atau hasil unwrap) menjadi opsi kartu pengiriman.
 */
export function buildPosIndonesiaShippingOptions(
  rawData: unknown
): PosIndonesiaMappedOption[] {
  const unwrapped = unwrapPosIndonesiaCekOngkirData(rawData);

  if (unwrapped && typeof unwrapped === "object" && !Array.isArray(unwrapped)) {
    const obj = unwrapped as Record<string, unknown>;
    const normalized = mapNormalizedBeResponse(obj);
    if (normalized) return [normalized];

    const legacy = mapLegacyPosRegulerObject(obj);
    if (legacy) return [legacy];
  }

  if (Array.isArray(unwrapped) && unwrapped.length > 0) {
    const firstItem = unwrapped[0];
    if (isPosIndonesiaCamelCaseRow(firstItem)) {
      const filtered = selectPosIndonesiaDisplayService(unwrapped);
      if (filtered) {
        const opt = mapRowToOption(filtered);
        if (opt) return [opt];
      }
    }
    const legacy = mapLegacyProductNameArray(
      unwrapped as Array<Record<string, unknown>>
    );
    if (legacy) return [legacy];
  }

  return [];
}
