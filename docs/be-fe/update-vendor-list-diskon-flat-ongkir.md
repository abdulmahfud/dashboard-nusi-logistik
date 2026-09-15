# Update FE — Sumber Data Vendor untuk Dropdown Diskon Pengiriman & Flat Ongkir

Update ini untuk mengganti dua daftar vendor yang di-hardcode terpisah di FE (`VENDORS` di `DiscountForm.tsx` dan `FLAT_RATE_VENDORS` di `types/flatShippingRate.ts`) dengan satu sumber data dari API, sesuai pertanyaan yang diajukan di `docs/fe-be/vendor-list-diskon-flat-ongkir.md` — dokumen ini isinya ringkasan actionable dari jawaban di sana.

## Endpoint yang dipakai

**Tidak ada endpoint baru.** Tetap pakai `GET /admin/expedition-vendor-settings` (permission `expedition.settings.view`) yang sudah dipakai FE di halaman Cek Ongkir & Paket Reguler.

Response sekarang punya **2 field baru** per baris (field lama tidak berubah sama sekali — aman, tidak ada breaking change untuk pemakaian yang sudah ada):

```json
{
  "id": 4,
  "vendor": "jntexpress",
  "is_active": true,
  "is_cod_active": true,
  "note": null,
  "created_at": "...",
  "updated_at": "...",
  "vendor_code": "JNTEXPRESS",
  "eligible_for_pricing_rules": true
}
```

| Field | Status | Kegunaan |
|---|---|---|
| `vendor` | lama, tidak berubah | Lowercase, kunci internal untuk routing (`/admin/expedition/{vendor}/...`). **Jangan** dipakai sebagai value dropdown Diskon/Flat Ongkir. |
| `vendor_code` | **baru** | Uppercase, dijamin sama persis dengan value yang tersimpan di `expedition_discounts.vendor` / `flat_shipping_rates.vendor`. **Pakai ini sebagai value dropdown.** |
| `eligible_for_pricing_rules` | **baru**, boolean | `true` untuk vendor yang didukung diskon/flat-ongkir, `false` untuk `GOSEND`. **Filter dengan field ini**, tidak perlu whitelist manual di FE. |

## Yang perlu dilakukan FE

1. Hapus daftar hardcode `VENDORS` (`DiscountForm.tsx`) dan `FLAT_RATE_VENDORS` (`types/flatShippingRate.ts`).
2. Fetch `GET /admin/expedition-vendor-settings` (fungsi `getExpeditionVendorSettings()` yang sudah ada di `apiClient.ts`), lalu filter `eligible_for_pricing_rules === true`.
3. Isi dropdown vendor di form Diskon Pengiriman dan Flat Ongkir dengan pasangan **label** = nama vendor (bisa dari `vendor_code` atau mapping label yang sudah ada di FE) dan **value** = `vendor_code`.
4. Tampilkan semua vendor hasil filter di atas tanpa disembunyikan, termasuk yang `is_active: false` — cukup beri badge "Nonaktif" seperti rencana awal FE. Tidak ada aturan bisnis yang melarang admin membuat aturan diskon/flat-ongkir untuk vendor yang sedang nonaktif.
5. **Tidak perlu** normalisasi casing manual (`.toUpperCase()`/`.toLowerCase()`) untuk keperluan ini — `vendor_code` sudah selalu uppercase dari server.

## Koreksi penting: Ninja Express

Kalau FE sebelumnya mengira kode vendor Ninja Express di sistem diskon/flat-ongkir adalah `NINJAEXPRESS`, itu **salah** — kode yang benar adalah **`NINJA`** (`vendor_code` untuk baris `vendor: "ninja"` akan bernilai `"NINJA"`). Ini sudah dicek cocok dengan kode vendor yang sebenarnya dipakai backend untuk mencocokkan diskon/flat-ongkir Ninja Express. Kalau di FE ada referensi ke `NINJAEXPRESS` sebagai value vendor untuk 2 form ini, ganti jadi `NINJA`.

## Konfirmasi lain (tidak perlu tindakan FE)

- Endpoint ini **selalu** mengembalikan 11 baris (10 vendor yang didukung diskon/flat-ongkir + GoSend) — sudah diverifikasi ke database production, tidak pernah ada baris yang hilang/belum muncul.
- Belum ada data diskon/flat-ongkir tersimpan di production sampai saat ini, jadi tidak ada data lama yang perlu dikoreksi akibat perbedaan casing/kode vendor di atas.
