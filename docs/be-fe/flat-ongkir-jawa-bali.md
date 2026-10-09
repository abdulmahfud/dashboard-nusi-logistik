# Dokumentasi FE — Flat Ongkir Jawa & Bali

Fitur baru: admin bisa membuat **program ongkir flat** (harga tetap, tidak dihitung per rute) untuk cakupan provinsi tertentu — use case utamanya "Flat Ongkir Jawa & Bali" sesuai `docs/flow-prd/flat-ongkir/Flow Ongkir Flat Seluruh Pulau Jawa.pdf`, tapi strukturnya generik: admin bisa membuat program flat untuk cakupan provinsi apa saja, bukan cuma Jawa & Bali.

**Cara kerja singkat**: saat FE cek ongkir (`shipmentCost`), kalau **origin dan destination provinsinya sama-sama masuk cakupan** suatu program flat yang aktif (dan syarat berat/dimensi/service/vendor/tipe akun terpenuhi), harga yang dikembalikan adalah harga flat — bukan hasil hitungan vendor. Kalau tidak match, harga tetap normal seperti biasa (hasil vendor, dengan diskon kalau ada). **Flat rate dan diskon tidak bertumpuk** — kalau match flat rate, diskon diabaikan sepenuhnya (lihat `docs/be-fe/update-user-type-flat-ongkir.md` untuk update terbaru soal pembedaan per tipe akun).

**Tidak ada perubahan di endpoint create-order.** Sama seperti diskon, sistem create-order langsung percaya harga yang dikirim FE dari hasil cek ongkir — jadi begitu FE menampilkan harga flat dari response cek ongkir dan user submit order dengan harga itu, semuanya otomatis konsisten tanpa perlu logic tambahan di FE.

---

## 1a. Keputusan penting: tidak ada pilihan "jenis layanan"

**REGULER dan COD selalu memakai kebijakan flat-ongkir yang sama persis.** `Order.service_code` (`REGULER`/`COD`) itu cuma label pencatatan yang ditentukan saat order dibuat, bukan produk vendor yang berbeda — dan saat cek ongkir dihitung (titik di mana flat-ongkir dicocokkan), sistem belum tahu status COD sama sekali (lihat penjelasan lengkap di [diskon-pengiriman.md](diskon-pengiriman.md) §1, alasannya sama persis untuk fitur ini).

**Konsekuensi untuk FE**: form create/edit flat ongkir **tidak perlu ada field "jenis layanan"**. Kolom `service_types` yang sebelumnya ada di skema sekarang **selalu dipaksa `null` oleh server**, apa pun yang dikirim — jadi field ini aman dihapus dari UI.

---

## 1. Endpoint admin — kelola program flat

Semua di bawah prefix `admin` (`/api/admin/...`), butuh `Authorization: Bearer <token>`.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| GET | `/admin/flat-shipping-rates` | `flat-shipping-rates.view` | List program flat (filter: `vendor`, `user_type`, `is_active`, `search`) |
| POST | `/admin/flat-shipping-rates` | `flat-shipping-rates.create` | Buat program flat baru |
| GET | `/admin/flat-shipping-rates/{id}` | `flat-shipping-rates.view` | Detail program flat |
| PUT | `/admin/flat-shipping-rates/{id}` | `flat-shipping-rates.update` | Update program flat |
| PATCH | `/admin/flat-shipping-rates/{id}/toggle-status` | `flat-shipping-rates.update` | Toggle aktif/nonaktif satu klik |
| DELETE | `/admin/flat-shipping-rates/{id}` | `flat-shipping-rates.delete` | Hapus program flat |

Permission ini otomatis ada untuk `superadmin` (semua) dan `admin` (semua kecuali `.delete`) — tidak perlu setting tambahan untuk dua role itu. Kalau role lain (mis. `operations`) perlu akses, tambahkan permission-nya manual ke role tersebut.

Response wrapper: `{status, message, data}` (bukan `{success, ...}`).

### GET `/admin/flat-shipping-rates`

Query params opsional: `vendor` (filter exact match, case-insensitive di server), `is_active` (`0`/`1`), `search` (cari `name`), `per_page`. Terurut `priority` naik (1 dulu, prioritas tertinggi) lalu `created_at` desc.

Response `200`:
```json
{
  "status": "success",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "name": "Flat Ongkir Jawa & Bali",
        "vendor": null,
        "user_type": null,
        "flat_price": "15000.00",
        "covered_provinces": ["DKI JAKARTA", "JAWA BARAT", "JAWA TENGAH", "JAWA TIMUR", "BANTEN", "DI YOGYAKARTA", "BALI"],
        "service_types": null,
        "max_weight": "5.00",
        "max_length": 40,
        "max_width": 40,
        "max_height": 40,
        "is_active": true,
        "valid_from": null,
        "valid_until": null,
        "priority": 3,
        "description": "Promo flat ongkir seluruh Jawa & Bali",
        "created_at": "...",
        "updated_at": "..."
      }
    ],
    "total": 1,
    "per_page": 15
  }
}
```

### POST `/admin/flat-shipping-rates`

Body:
```json
{
  "name": "Flat Ongkir Jawa & Bali",
  "vendor": null,
  "user_type": null,
  "flat_price": 15000,
  "covered_provinces": ["DKI Jakarta", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Banten", "DI Yogyakarta", "Bali"],
  "max_weight": 5,
  "max_length": 40,
  "max_width": 40,
  "max_height": 40,
  "is_active": true,
  "valid_from": null,
  "valid_until": null,
  "priority": 3,
  "description": "Promo flat ongkir seluruh Jawa & Bali"
}
```

Validasi:
- `name` **wajib**.
- `flat_price` **wajib**, angka ≥ 0.
- `covered_provinces` **wajib**, array minimal 1 nama provinsi. Nama provinsi **di-uppercase otomatis di server** — FE tidak perlu uppercase sendiri, tapi harus mengirim nama provinsi yang persis sama ejaannya dengan master data provinsi di sistem (yang dipakai fitur cek ongkir), supaya matching-nya kena.
- `max_weight` **wajib**, angka > 0 (dalam kg) — ini batas berat maksimum agar program flat berlaku.
- `vendor` opsional. **Kosongkan (`null`) untuk berlaku di SEMUA vendor sekaligus** (ini kasus default/umum, termasuk contoh "Flat Ongkir Jawa & Bali" di PDF). Isi dengan kode vendor (mis. `"IDEXPRESS"`) hanya kalau ingin program flat khusus satu vendor saja.
- `user_type` opsional: `"personal"`, `"corporate"`, atau kosongkan (`null`) untuk berlaku ke semua tipe akun. **Baru** — lihat `docs/be-fe/update-user-type-flat-ongkir.md` untuk detail lengkap dan contoh.
- `max_length`/`max_width`/`max_height` opsional (cm). **Catatan penting**: limit dimensi ini baru dicek kalau FE memang mengirim `length`/`width`/`height` saat cek ongkir. Saat ini payload cek ongkir standar (lihat `docs/payload-fe.md`) **tidak mengirim dimensi**, jadi di praktiknya untuk saat ini limit dimensi belum benar-benar ditegakkan — hanya limit berat yang aktif menyaring. Ini bukan bug, tapi konsekuensi dari payload cek ongkir yang belum membawa dimensi.
- `is_active` opsional, default `true`.
- `valid_from`/`valid_until` opsional (tanggal) — untuk program flat musiman/promo bertanggal.
- `priority` opsional, **1 (tertinggi) - 5 (terendah)**, default `3`. **Dipakai untuk resolve konflik**: kalau ada 2 program flat yang sama-sama match untuk satu request (mis. program umum semua-vendor vs program khusus satu vendor untuk rute yang sama), yang `priority` angkanya lebih kecil yang dipakai.
- `description` opsional, catatan bebas untuk admin.
- `service_types` — **jangan tampilkan field ini di form.** REGULER dan COD selalu memakai kebijakan flat-ongkir yang sama (lihat §1a) — kalaupun dikirim, server selalu memaksanya jadi `null`.

Response `201` — object program flat lengkap. Response `422` kalau validasi gagal.

### GET `/admin/flat-shipping-rates/{id}`

`404` kalau tidak ditemukan.

### PUT `/admin/flat-shipping-rates/{id}`

Semua field di body POST bersifat opsional di sini (kirim yang mau diubah saja).

### PATCH `/admin/flat-shipping-rates/{id}/toggle-status`

Tidak butuh body — otomatis membalik `is_active`. Untuk tombol Aktif/Nonaktif satu klik.

```json
{ "status": "success", "message": "Status updated successfully", "data": { "is_active": false } }
```

### DELETE `/admin/flat-shipping-rates/{id}`

Hapus permanen (bukan soft-delete).

---

## 2. Kaitan dengan cek ongkir (shipment cost)

**Tidak ada endpoint baru untuk cek ongkir** — flat rate otomatis ikut dievaluasi di endpoint cek ongkir yang sudah ada per vendor (`POST /admin/expedition/{vendor}/cost` atau sejenisnya, sesuai `docs/payload-fe.md`). Kalau ada program flat yang match (origin & destination sama-sama masuk `covered_provinces`, berat ≤ `max_weight`, dan syarat vendor/service/dimensi terpenuhi kalau diisi), response cek ongkir akan menunjukkan flat rate ini lewat field tambahan.

**Penting: nama field harga & lokasinya di response TIDAK 100% seragam antar vendor**, mengikuti bentuk response masing-masing vendor yang memang sudah berbeda-beda sebelum fitur ini ada. Tapi pola field tambahannya (`flat_rate_applied`, `flat_rate_name`, plus `discount_applied`/`discount_amount` di sebelahnya) selalu sama — cuma field harga yang di-override yang beda nama/lokasi.

**Koreksi tabel (2026-10-08)**: versi sebelumnya dari tabel ini mengelompokkan semua vendor sebagai "list", padahal beberapa di antaranya sebenarnya object tunggal. Ini sudah dicek ulang satu per satu langsung ke response sandbox tiap vendor — berikut lokasi yang benar:

| Vendor | Field harga yang di-override | Lokasi `flat_rate_applied`/`flat_rate_name`/field harga |
|---|---|---|
| IdExpress, JNE, JntExpress, Paxel | `final_cost` | **List** di `shipping_costs_with_discount[i]` — key top-level, **sejajar** dengan `data`, bukan di dalamnya |
| NinjaExpress, PosIndonesia | `final_cost` | **Object tunggal** langsung di `data.final_cost` (bukan list) |
| Lion | `final_cost` | **Object tunggal** langsung di `data.final_cost` — **dan** diulang di tiap item `data.available_services[i]` / `data.vendor_service` (list, isinya sama). FE boleh baca cukup dari `data.final_cost` saja, tidak perlu masuk ke list |
| JntCargo | `total_cost` | **List** di `data.services[i]` (sekaligus tersedia juga sebagai `costs[i]` di level atas untuk kompatibilitas lama) |
| SAP | `total_cost` | `data.services[0]` (setelah difilter, cuma tersisa 1 layanan: SATRIA REG) |
| Anteraja | `cost` | **Top-level**, sejajar dengan `data`/`status` (response bukan list, cuma 1 object) |

**2 bug yang ditemukan & diperbaiki saat verifikasi tabel ini (2026-10-08)**:
- **Lion**: `flat_rate_applied`/`flat_rate_name` sebelumnya **tidak pernah** muncul di `data` level atas — cuma ada di dalam `data.available_services[]`/`data.vendor_service`, padahal `discount_applied`/`discount_amount` sudah lebih dulu ada di `data` level atas. Kalau FE membaca `data.flat_rate_applied` langsung (pola yang sama dipakai untuk baca diskon), badge Flat Ongkir **tidak akan pernah muncul untuk Lion** walau programnya match. **Sudah diperbaiki** — sekarang `data.flat_rate_applied`/`data.flat_rate_name` konsisten ada, sejajar dengan `discount_applied`/`discount_amount`.
- **SAP**: ada bug variabel di kode BE yang membuat flat rate **tidak pernah bisa match sama sekali** untuk vendor ini (provinsi tujuan tidak pernah terbaca saat mengecek kecocokan program flat) — bukan soal lokasi field di response, tapi fitur flat ongkir untuk SAP memang belum pernah berfungsi sejak awal. **Sudah diperbaiki dan sudah diverifikasi** lewat sandbox: `flat_rate_applied: true` sekarang muncul dengan benar saat program flat match untuk SAP.

Kedua fix di atas sudah di-deploy ke production dan diverifikasi langsung lewat cek ongkir sungguhan (bukan cuma tes lokal).

**Temuan terpisah, BELUM diperbaiki — Paxel**: diskon **dan** flat ongkir ternyata tidak pernah benar-benar berfungsi untuk Paxel, independen dari fitur flat ongkir ini. Kode BE mencari harga di field `price`/`cost`/`rate` dari response Paxel, tapi response sandbox Paxel yang sesungguhnya memakai field `small_price`/`medium_price`/`large_price`/`custom_price`/`fixed_price` (berbasis dimensi paket) — jadi `$cost` selalu `0` dan `shipping_costs_with_discount` selalu kosong untuk Paxel. Ini bukan sesuatu yang saya perbaiki sekarang karena butuh keputusan bisnis: field mana (`fixed_price`, atau salah satu dari `small/medium/large/custom_price`) yang seharusnya jadi "harga" yang dipakai customer dan yang dihitung diskon/flat ongkirnya. Mohon konfirmasi ke BE sebelum FE mengasumsikan badge Flat Ongkir/Diskon akan tampil untuk Paxel.

Contoh (IdExpress dkk — pola per-service list):
```json
{
  "original_cost": 9000,
  "final_cost": 15000,
  "flat_rate_applied": true,
  "flat_rate_name": "Flat Ongkir Jawa & Bali",
  "discount_applied": false,
  "discount_amount": 0
}
```

Contoh Anteraja (top-level, bukan list):
```json
{
  "status": "success",
  "cost": 15000,
  "original_cost": 9000,
  "flat_rate_applied": true,
  "flat_rate_name": "Flat Ongkir Jawa & Bali",
  "discount_applied": false,
  "discount_amount": 0,
  "response": { "...": "response asli Anteraja" }
}
```

- `flat_rate_applied` (boolean) — `true` kalau harga di field cost tersebut berasal dari program flat (bukan hasil hitungan vendor/diskon).
- `flat_rate_name` (string|null) — nama program flat yang match, untuk ditampilkan ke user (mis. badge "Flat Ongkir Jawa & Bali" di UI).
- Kalau `flat_rate_applied === true`, field diskon (`discount_applied`/`discount_amount`) tetap ada di response tapi **tidak relevan dipakai** — harga final sudah dari flat rate, diskon tidak ikut dihitung/ditambahkan.

FE cukup cek `flat_rate_applied` sebelum menampilkan harga, dan pakai field cost yang sudah di-override apa adanya (sesuai tabel di atas) — tidak perlu logic hitung ulang di FE.

**Catatan riwayat**: sebelumnya SAP dan Anteraja tidak pernah menerapkan diskon sama sekali di endpoint cek ongkir (bug, sudah diperbaiki) — cuma flat rate saja yang berlaku. Sekarang keduanya menerapkan diskon **dan** flat rate seperti vendor lain, dengan flat rate tetap menang kalau match (tidak bertumpuk dengan diskon, sesuai aturan umum).

### Vendor yang TIDAK punya flat rate: GoSend

**GoSend sengaja tidak diikutkan.** GoSend menghitung ongkir berdasarkan koordinat lat/long (kurir instan dalam kota), bukan nama provinsi asal/tujuan — jadi konsep "cakupan provinsi" tidak cocok secara fundamental untuk vendor ini. Cek ongkir GoSend tetap berjalan seperti biasa tanpa field `flat_rate_*`.

---

## 3. Catatan scope & limitasi

- **Cakupan hanya level provinsi**, bukan kota/kecamatan. PDF menyebut kemungkinan cakupan lebih detail, tapi versi ini disederhanakan ke level provinsi saja — cukup untuk use case "seluruh Jawa & Bali". Kalau nanti perlu granularitas kota/kecamatan, perlu pengembangan lanjutan.
- **Limit dimensi (`max_length`/`max_width`/`max_height`) baru berlaku kalau FE mengirim dimensi saat cek ongkir.** Payload cek ongkir standar saat ini belum membawa `length`/`width`/`height`, jadi di praktiknya hanya limit berat yang aktif menyaring untuk saat ini.
- **Flat rate berlaku vendor-agnostic secara default** (`vendor = null`), dengan opsi override khusus satu vendor (isi `vendor` + `priority` angka lebih kecil, mis. `1`, supaya menang dibanding program umum untuk rute yang sama).
- **Flat rate tidak bertumpuk dengan diskon** — kalau match flat rate, diskon diabaikan sepenuhnya, tidak ditambahkan/dikurangkan dari harga flat.
- **Tidak ada pilihan jenis layanan** — lihat §1a. `service_types` selalu `null`, berlaku untuk REGULER dan COD tanpa dibedakan.
- **Bisa dibedakan per tipe akun** (`user_type`: `personal`/`corporate`/kosong=semua) — lihat `docs/be-fe/update-user-type-flat-ongkir.md`.
- Order creation tidak berubah — sistem tetap percaya harga yang dikirim FE dari hasil cek ongkir, jadi begitu FE menampilkan field cost yang sudah di-override (lihat tabel field harga di atas) dan user submit order dengan angka itu, semuanya konsisten otomatis.

Lihat juga [diskon-pengiriman.md](diskon-pengiriman.md) untuk penjelasan lengkap kenapa REGULER dan COD disamakan.
