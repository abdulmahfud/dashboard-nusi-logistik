/** Vendor key (dipakai filter `vendor` di GET /admin/list-orders & export) -> label tampilan. */
export const VENDOR_OPTIONS: { value: string; label: string }[] = [
  { value: "jne", label: "JNE" },
  { value: "sap", label: "SAP Express" },
  { value: "lion", label: "Lion Parcel" },
  { value: "jntexpress", label: "J&T Express" },
  { value: "jntcargo", label: "J&T Cargo" },
  { value: "paxel", label: "Paxel" },
  { value: "idexpress", label: "ID Express" },
  { value: "posindonesia", label: "Pos Indonesia" },
  { value: "anteraja", label: "Anteraja" },
  { value: "ninja", label: "Ninja Express" },
];

/** Vendor key -> path logo di public/images (sama dengan yang dipakai CalculationResults.tsx). */
const VENDOR_LOGOS: Record<string, string> = {
  jne: "/images/jne.png",
  sap: "/images/sap-new.png",
  lion: "/images/lion.png",
  jntexpress: "/images/jnt.png",
  jntcargo: "/images/jnt-cargo.png",
  paxel: "/images/paxel.png",
  idexpress: "/images/idx.png",
  posindonesia: "/images/pos.png",
  anteraja: "/images/anteraja.png",
  ninja: "/images/ninja.png",
};

/**
 * `orders.vendor` casingnya tidak konsisten di data historis (mis.
 * "jntexpress" vs "POSINDONESIA") — cocokkan tanpa memandang huruf besar
 * kecil. `null` kalau vendor belum punya logo (mis. GoSend, belum produksi).
 */
export function getVendorLogo(vendor: string | null | undefined): string | null {
  if (!vendor) return null;
  return VENDOR_LOGOS[vendor.toLowerCase()] ?? null;
}
