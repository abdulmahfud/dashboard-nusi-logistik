// Skala prioritas dipakai sama persis oleh Diskon Pengiriman & Flat Ongkir.
// Lihat docs/be-fe/update-skala-prioritas-diskon-flat-ongkir.md
//
// Angka LEBIH KECIL = prioritas LEBIH TINGGI (1 = tertinggi, 5 = terendah).
// Default server kalau field dikosongkan: 3 (Sedang).
//
// - Flat ongkir: priority jadi penentu utama kalau >1 program match sekaligus
//   (angka terkecil yang eligible langsung dipakai).
// - Diskon pengiriman: pemenang utama tetap potongan terbesar buat customer;
//   priority di sini cuma tiebreaker kalau 2 aturan menghasilkan potongan
//   yang persis sama nominalnya.

export const PRIORITY_OPTIONS = [
  { value: "1", label: "1 (Tertinggi)" },
  { value: "2", label: "2 (Tinggi)" },
  { value: "3", label: "3 (Sedang)" },
  { value: "4", label: "4 (Rendah)" },
  { value: "5", label: "5 (Terendah)" },
];

export const DEFAULT_PRIORITY = "3";
