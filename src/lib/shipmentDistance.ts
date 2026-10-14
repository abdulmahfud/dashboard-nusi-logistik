/**
 * Klasifikasi jarak kiriman (dalam kota / dalam pulau / luar pulau) dari
 * nama provinsi & kota/kabupaten pengirim-penerima. Dipakai untuk memilih
 * field estimasi mana dari Expedition Group (estimasi_dalam_kota /
 * estimasi_dalam_pulau / estimasi_luar_pulau) yang ditampilkan ke user,
 * menggantikan estimasi dinamis dari API tiap vendor.
 */

/** Provinsi (38, pasca pemekaran Papua) -> nama pulau/kepulauan. */
const PROVINCE_ISLAND_MAP: Record<string, string> = {
  // Sumatera
  ACEH: "Sumatera",
  "SUMATERA UTARA": "Sumatera",
  "SUMATERA BARAT": "Sumatera",
  RIAU: "Sumatera",
  "KEPULAUAN RIAU": "Sumatera",
  JAMBI: "Sumatera",
  BENGKULU: "Sumatera",
  "SUMATERA SELATAN": "Sumatera",
  "KEPULAUAN BANGKA BELITUNG": "Sumatera",
  "BANGKA BELITUNG": "Sumatera",
  LAMPUNG: "Sumatera",
  // Jawa
  "DKI JAKARTA": "Jawa",
  JAKARTA: "Jawa",
  "JAWA BARAT": "Jawa",
  "JAWA TENGAH": "Jawa",
  "DI YOGYAKARTA": "Jawa",
  "DAERAH ISTIMEWA YOGYAKARTA": "Jawa",
  YOGYAKARTA: "Jawa",
  "JAWA TIMUR": "Jawa",
  BANTEN: "Jawa",
  // Bali & Nusa Tenggara (masing-masing pulau/kepulauan sendiri)
  BALI: "Bali",
  "NUSA TENGGARA BARAT": "Nusa Tenggara Barat",
  "NUSA TENGGARA TIMUR": "Nusa Tenggara Timur",
  // Kalimantan
  "KALIMANTAN BARAT": "Kalimantan",
  "KALIMANTAN TENGAH": "Kalimantan",
  "KALIMANTAN SELATAN": "Kalimantan",
  "KALIMANTAN TIMUR": "Kalimantan",
  "KALIMANTAN UTARA": "Kalimantan",
  // Sulawesi
  "SULAWESI UTARA": "Sulawesi",
  "SULAWESI TENGAH": "Sulawesi",
  "SULAWESI SELATAN": "Sulawesi",
  "SULAWESI TENGGARA": "Sulawesi",
  GORONTALO: "Sulawesi",
  "SULAWESI BARAT": "Sulawesi",
  // Maluku
  MALUKU: "Maluku",
  "MALUKU UTARA": "Maluku",
  // Papua (6 provinsi pasca pemekaran 2022)
  PAPUA: "Papua",
  "PAPUA BARAT": "Papua",
  "PAPUA SELATAN": "Papua",
  "PAPUA TENGAH": "Papua",
  "PAPUA PEGUNUNGAN": "Papua",
  "PAPUA BARAT DAYA": "Papua",
};

function normalizeProvince(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toUpperCase()
    .replace(/^PROVINSI\s+/, "");
}

function normalizeRegency(value: string | null | undefined): string {
  return (value ?? "").trim().toUpperCase();
}

export type ShipmentDistance = "dalam_kota" | "dalam_pulau" | "luar_pulau";

/**
 * `null` berarti tidak bisa ditentukan (data lokasi belum lengkap, atau
 * nama provinsi tidak dikenali) — pemanggil sebaiknya fallback ke estimasi
 * lain saat ini terjadi.
 */
export function classifyShipmentDistance(params: {
  senderProvince?: string | null;
  senderRegency?: string | null;
  receiverProvince?: string | null;
  receiverRegency?: string | null;
}): ShipmentDistance | null {
  const senderProvince = normalizeProvince(params.senderProvince);
  const receiverProvince = normalizeProvince(params.receiverProvince);
  if (!senderProvince || !receiverProvince) return null;

  const senderRegency = normalizeRegency(params.senderRegency);
  const receiverRegency = normalizeRegency(params.receiverRegency);
  if (
    senderProvince === receiverProvince &&
    senderRegency &&
    senderRegency === receiverRegency
  ) {
    return "dalam_kota";
  }

  const senderIsland = PROVINCE_ISLAND_MAP[senderProvince];
  const receiverIsland = PROVINCE_ISLAND_MAP[receiverProvince];
  if (!senderIsland || !receiverIsland) return null;

  return senderIsland === receiverIsland ? "dalam_pulau" : "luar_pulau";
}
