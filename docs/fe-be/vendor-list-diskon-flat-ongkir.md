# Dokumentasi FE → BE — Sumber Data Vendor untuk Form Diskon & Flat Ongkir

**Status**: pertanyaan/permintaan konfirmasi dari FE, belum diimplementasikan. Menyangkut 2 fitur yang dokumentasinya sudah dikirim BE sebelumnya: [diskon-pengiriman.md](../be-fe/diskon-pengiriman.md) dan [flat-ongkir-jawa-bali.md](../be-fe/flat-ongkir-jawa-bali.md).

---

## 1. Masalah saat ini

Dropdown pilihan **vendor** di form create/edit **Diskon Pengiriman** (`DiscountForm.tsx`) dan **Flat Ongkir** (`FlatRateForm.tsx`) masing-masing **di-hardcode terpisah** di kode FE — bukan diambil dari API. Akibatnya:

- **Dua daftar berbeda, sudah tidak sinkron satu sama lain.** Daftar di form Diskon Pengiriman: `JNTEXPRESS, PAXEL, SAP, LION, SICEPAT, TIKI, POS`. Daftar di form Flat Ongkir: `IDEXPRESS, ANTERAJA, JNE, JNTCARGO, JNTEXPRESS, LION, NINJAEXPRESS, PAXEL, POSINDONESIA, SAP`.
- Daftar Diskon Pengiriman **kurang lengkap** — tidak ada `IDEXPRESS`, `JNE`, `ANTERAJA`, `NINJAEXPRESS`, `JNTCARGO`, padahal berdasarkan `diskon-pengiriman.md` §3, semua vendor itu **sudah menerapkan diskon**. Sebaliknya ada `SICEPAT`, `TIKI`, `POS` yang tidak jelas apakah benar-benar terintegrasi di sistem ini.
- **Tidak mencerminkan status aktif/nonaktif vendor** yang sebenarnya bisa berubah kapan saja lewat `GET/PATCH /admin/expedition-vendor-settings` — kalau BE menonaktifkan satu vendor, form ini tidak tahu sama sekali.
- Setiap kali BE menambah vendor baru, FE **wajib deploy ulang kode** hanya untuk menambah satu baris ke daftar hardcode.

FE ingin mengganti kedua daftar hardcode ini dengan **satu sumber data yang sama, diambil dari API**, supaya selalu konsisten dan tidak perlu deploy FE setiap ada perubahan vendor.

---

## 2. Yang FE sudah cari tahu sendiri

Dari `diskon-pengiriman.md` §3 dan `flat-ongkir-jawa-bali.md` §2, kedua fitur ternyata **berlaku untuk set vendor yang sama persis** (10 vendor, `GoSend` sengaja dikecualikan karena belum production / cara hitung ongkirnya beda):

```
IDEXPRESS, ANTERAJA, JNE, JNTCARGO, JNTEXPRESS, LION, NINJAEXPRESS, PAXEL, POSINDONESIA, SAP
```

FE juga sudah punya kandidat sumber data dinamis: `GET /admin/expedition-vendor-settings` (dipakai `getExpeditionVendorSettings()` di `apiClient.ts`), yang mengembalikan `{ vendor, is_active, is_cod_active }[]` — endpoint ini sudah dipakai FE di halaman Cek Ongkir & Paket Reguler untuk menentukan vendor mana yang aktif.

**Yang FE belum bisa pastikan sendiri** (perlu konfirmasi BE) ada di §3.

---

## 3. Pertanyaan untuk BE

1. **Apakah `GET /admin/expedition-vendor-settings` adalah sumber yang tepat** untuk mengisi dropdown vendor di form Diskon Pengiriman & Flat Ongkir? Atau ada endpoint lain yang lebih pas (mis. endpoint khusus "daftar vendor yang eligible untuk diskon/flat-ongkir")?
2. **Apakah daftar vendor dari endpoint itu persis sama dengan 10 vendor di atas** — tidak lebih (mis. tidak ikut memunculkan `GOSEND` yang menurut dokumentasi belum eligible), tidak kurang (semua 10 vendor pasti selalu ada barisnya, bukan cuma muncul kalau sudah pernah di-setting admin)?
3. **Format/casing field `vendor` di response endpoint itu** — apakah selalu uppercase persis seperti `"IDEXPRESS"`, `"JNTEXPRESS"`, dst (sama seperti yang dipakai di body `POST /admin/expedition-discounts` dan `POST /admin/flat-shipping-rates`)? FE menemukan di bagian lain aplikasi (`ShippingForm.tsx`) ada normalisasi manual (`.toLowerCase()`) terhadap field ini, yang mengindikasikan casing-nya mungkin tidak selalu konsisten.
4. **Konfirmasi perilaku yang FE rencanakan**: FE berencana **tetap menampilkan vendor yang `is_active: false`** di dropdown (hanya diberi tanda visual "Nonaktif"), bukan disembunyikan — supaya admin tetap bisa membuat/mengedit aturan diskon atau flat-ongkir untuk vendor yang sedang nonaktif sementara (misal disiapkan lebih dulu sebelum vendor diaktifkan lagi, atau supaya form edit tidak tiba-tiba menampilkan dropdown kosong untuk aturan yang vendornya baru saja dinonaktifkan). Apakah ini konsisten dengan asumsi BE, atau ada alasan bisnis kenapa vendor nonaktif sebaiknya tidak bisa diberi aturan diskon/flat-ongkir baru?

---

## 4. Rencana FE setelah dikonfirmasi

- Hapus dua daftar hardcode (`VENDORS` di `DiscountForm.tsx`, `FLAT_RATE_VENDORS` di `types/flatShippingRate.ts`), ganti dengan satu fungsi/hook yang fetch dari `getExpeditionVendorSettings()`.
- Normalisasi casing (uppercase) sebelum dipakai sebagai value dropdown, kalau ternyata BE belum menjamin konsisten (lihat pertanyaan §3.3).
- Tampilkan semua vendor dari response, beri badge/label "Nonaktif" untuk yang `is_active: false`, tanpa menyembunyikannya dari pilihan.
- Kalau BE konfirmasi ada vendor di response yang tidak seharusnya muncul di kedua form ini (mis. `GOSEND`), FE akan filter berdasarkan whitelist 10 vendor di §2 sebagai lapisan tambahan, supaya tidak bergantung 100% pada BE selalu tepat menyaring.
