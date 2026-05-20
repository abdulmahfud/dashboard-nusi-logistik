/**
 * Normalisasi payload cek ongkir Pos Indonesia dari BE/vendor.
 * Format baru: { response: { data: [ { serviceCode, fee, feeTax, insurance, insuranceTax, totalFee, ... } ] } }
 */

/** serviceCode 910546 = PPKH (marketplace) — dipakai Addpostingdoc */
export const POS_INDONESIA_SERVICE_CODE_PPKH = 910546;
/** Kode layanan reguler lama yang sebelumnya difilter di FE */
export const POS_INDONESIA_SERVICE_CODE_REGULER_LEGACY = 910548;

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

function isPosIndonesiaCamelCaseRow(
  item: unknown
): item is Record<string, unknown> {
  if (!item || typeof item !== "object" || Array.isArray(item)) return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.serviceCode === "number" &&
    typeof obj.serviceName === "string" &&
    typeof obj.totalFee === "number"
  );
}

/**
 * Pilih satu baris untuk ditampilkan/di-order: utamakan 910546, lalu 910548, lalu baris pertama dengan totalFee > 0.
 */
export function selectPosIndonesiaDisplayService(
  rows: unknown[]
): Record<string, unknown> | null {
  const newRows = rows.filter(isPosIndonesiaCamelCaseRow);
  if (newRows.length === 0) return null;

  const pick = (code: number) =>
    newRows.find(
      (r) => r.serviceCode === code && Number(r.totalFee) > 0
    ) ?? null;

  return (
    pick(POS_INDONESIA_SERVICE_CODE_PPKH) ??
    pick(POS_INDONESIA_SERVICE_CODE_REGULER_LEGACY) ??
    newRows.find((r) => Number(r.totalFee) > 0) ??
    null
  );
}

export function extractPosIndonesiaPostingSnapshot(
  row: Record<string, unknown>
): {
  serviceCode: number;
  fee: number;
  feeTax: number;
  insurance: number;
  insuranceTax: number;
  totalFee: number;
} | undefined {
  if (typeof row.serviceCode !== "number") return undefined;
  const fee = Number(row.fee);
  const feeTax = Number(row.feeTax);
  const insurance = Number(row.insurance);
  const insuranceTax = Number(row.insuranceTax);
  const totalFee = Number(row.totalFee);
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
    serviceCode: row.serviceCode,
    fee,
    feeTax,
    insurance,
    insuranceTax,
    totalFee,
  };
}
