/**
 * Menyimpan hasil "Lanjut ke Ringkasan" (data form + hasil cek ongkir) di
 * sessionStorage supaya bisa dibaca ulang di halaman
 * /dashboard/paket/paket-reguler/ringkasan tanpa lewat backend. Sengaja pakai
 * sessionStorage (bukan query string) karena datanya cukup besar dan berisi
 * data pengirim/penerima.
 */
const STORAGE_KEY = "paket-reguler:checkout";

export type PaketRegulerCheckoutFormData = {
  itemValue?: string;
  paymentMethod?: string;
  formData?: {
    receiverName: string;
    receiverPhone: string;
    province: string;
    regency: string;
    district: string;
    receiverAddress: string;
    itemContent: string;
    itemType: string;
    itemValue: string;
    itemQuantity: string;
    weight: string;
    length: string;
    width: string;
    height: string;
    notes: string;
    deliveryType: "pickup" | "dropoff";
    paymentMethod: string;
  };
  businessData?: {
    id: number;
    businessName: string;
    senderName: string;
    contact: string;
    province: string | null;
    regency: string | null;
    district: string | null;
    address: string;
  } | null;
  receiverId?: string | null;
};

export type PaketRegulerCheckoutData = {
  result: Record<string, unknown>;
  formData: PaketRegulerCheckoutFormData;
};

export function savePaketRegulerCheckout(data: PaketRegulerCheckoutData) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Abaikan (mis. private browsing / storage penuh) — halaman ringkasan
    // akan menampilkan pesan "data tidak ditemukan" dan mengarahkan kembali.
  }
}

export function loadPaketRegulerCheckout(): PaketRegulerCheckoutData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PaketRegulerCheckoutData;
  } catch {
    return null;
  }
}

export function clearPaketRegulerCheckout() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}
