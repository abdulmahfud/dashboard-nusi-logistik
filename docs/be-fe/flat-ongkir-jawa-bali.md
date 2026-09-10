# Dokumentasi FE — Flat Ongkir Jawa & Bali

Fitur baru: admin bisa membuat **program ongkir flat** (harga tetap, tidak dihitung per rute) untuk cakupan provinsi tertentu — use case utamanya "Flat Ongkir Jawa & Bali" sesuai `docs/flow-prd/flat-ongkir/Flow Ongkir Flat Seluruh Pulau Jawa.pdf`, tapi strukturnya generik: admin bisa membuat program flat untuk cakupan provinsi apa saja, bukan cuma Jawa & Bali.

**Cara kerja singkat**: saat FE cek ongkir (`shipmentCost`), kalau **origin dan destination provinsinya sama-sama masuk cakupan** suatu program flat yang aktif (dan syarat berat/dimensi/service/vendor terpenuhi), harga yang dikembalikan adalah harga flat — bukan hasil hitungan vendor. Kalau tidak match, harga tetap normal seperti biasa (hasil vendor, dengan diskon kalau ada). **Flat rate dan diskon tidak bertumpuk** — kalau match flat rate, diskon diabaikan sepenuhnya.

**Tidak ada perubahan di endpoint create-order.** Sama seperti diskon, sistem create-order langsung percaya harga yang dikirim FE dari hasil cek ongkir — jadi begitu FE menampilkan harga flat dari response cek ongkir dan user submit order dengan harga itu, semuanya otomatis konsisten tanpa perlu logic tambahan di FE.

---

## 1. Endpoint admin — kelola program flat

Semua di bawah prefix `admin` (`/api/admin/...`), butuh `Authorization: Bearer <token>`.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| GET | `/admin/flat-shipping-rates` | `flat-shipping-rates.view` | List program flat |
| POST | `/admin/flat-shipping-rates` | `flat-shipping-rates.create` | Buat program flat baru |
| GET | `/admin/flat-shipping-rates/{id}` | `flat-shipping-rates.view` | Detail program flat |
| PUT | `/admin/flat-shipping-rates/{id}` | `flat-shipping-rates.update` | Update program flat |
| PATCH | `/admin/flat-shipping-rates/{id}/toggle-status` | `flat-shipping-rates.update` | Toggle aktif/nonaktif satu klik |
| DELETE | `/admin/flat-shipping-rates/{id}` | `flat-shipping-rates.delete` | Hapus program flat |

Permission ini otomatis ada untuk `superadmin` (semua) dan `admin` (semua kecuali `.delete`) — tidak perlu setting tambahan untuk dua role itu. Kalau role lain (mis. `operations`) perlu akses, tambahkan permission-nya manual ke role tersebut.

Response wrapper: `{status, message, data}` (bukan `{success, ...}`).

### GET `/admin/flat-shipping-rates`

Query params opsional: `vendor` (filter exact match, case-insensitive di server), `is_active` (`0`/`1`), `search` (cari `name`), `per_page`. Terurut `priority` desc lalu `created_at` desc.

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
        "flat_price": "15000.00",
        "covered_provinces": ["DKI JAKARTA", "JAWA BARAT", "JAWA TENGAH", "JAWA TIMUR", "BANTEN", "DI YOGYAKARTA", "BALI"],
        "service_types": ["REGULER"],
        "max_weight": "5.00",
        "max_length": 40,
        "max_width": 40,
        "max_height": 40,
        "is_active": true,
        "valid_from": null,
        "valid_until": null,
        "priority": 0,
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
  "flat_price": 15000,
  "covered_provinces": ["DKI Jakarta", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "Banten", "DI Yogyakarta", "Bali"],
  "service_types": ["REGULER"],
  "max_weight": 5,
  "max_length": 40,
  "max_width": 40,
  "max_height": 40,
  "is_active": true,
  "valid_from": null,
  "valid_until": null,
  "priority": 0,
  "description": "Promo flat ongkir seluruh Jawa & Bali"
}
```

Validasi:
- `name` **wajib**.
- `flat_price` **wajib**, angka ≥ 0.
- `covered_provinces` **wajib**, array minimal 1 nama provinsi. Nama provinsi **di-uppercase otomatis di server** — FE tidak perlu uppercase sendiri, tapi harus mengirim nama provinsi yang persis sama ejaannya dengan master data provinsi di sistem (yang dipakai fitur cek ongkir), supaya matching-nya kena.
- `max_weight` **wajib**, angka > 0 (dalam kg) — ini batas berat maksimum agar program flat berlaku.
- `vendor` opsional. **Kosongkan (`null`) untuk berlaku di SEMUA vendor sekaligus** (ini kasus default/umum, termasuk contoh "Flat Ongkir Jawa & Bali" di PDF). Isi dengan kode vendor (mis. `"IDEXPRESS"`) hanya kalau ingin program flat khusus satu vendor saja.
- `service_types` opsional, array kode service (mis. `["REGULER"]`). Kosongkan untuk berlaku di semua service.
- `max_length`/`max_width`/`max_height` opsional (cm). **Catatan penting**: limit dimensi ini baru dicek kalau FE memang mengirim `length`/`width`/`height` saat cek ongkir. Saat ini payload cek ongkir standar (lihat `docs/payload-fe.md`) **tidak mengirim dimensi**, jadi di praktiknya untuk saat ini limit dimensi belum benar-benar ditegakkan — hanya limit berat yang aktif menyaring. Ini bukan bug, tapi konsekuensi dari payload cek ongkir yang belum membawa dimensi.
- `is_active` opsional, default `true`.
- `valid_from`/`valid_until` opsional (tanggal) — untuk program flat musiman/promo bertanggal.
- `priority` opsional, default `0`. **Dipakai untuk resolve konflik**: kalau ada 2 program flat yang sama-sama match untuk satu request (mis. program umum semua-vendor vs program khusus satu vendor untuk rute yang sama), yang `priority` lebih tinggi yang dipakai.
- `description` opsional, catatan bebas untuk admin.

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

**Penting: bentuk field tambahan ini TIDAK 100% seragam antar vendor**, mengikuti bentuk response masing-masing vendor yang memang sudah berbeda-beda sebelum fitur ini ada. FE perlu menangani per-vendor:

### Pola A — field per-service (mayoritas vendor)

Berlaku untuk: **IdExpress, Anteraja, JNE, JntCargo, JntExpress, Lion, NinjaExpress, Paxel, PosIndonesia**.

Setiap object service/tarif di response mendapat field tambahan, dan `final_cost` (atau field cost utama yang sudah ada) langsung memakai harga flat kalau match:

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

- `flat_rate_applied` (boolean) — `true` kalau harga di `final_cost` berasal dari program flat (bukan hasil hitungan vendor/diskon).
- `flat_rate_name` (string|null) — nama program flat yang match, untuk ditampilkan ke user (mis. badge "Flat Ongkir Jawa & Bali" di UI).
- Kalau `flat_rate_applied === true`, field diskon (`discount_applied`/`discount_amount`) tetap ada di response tapi **tidak relevan dipakai** — harga final sudah dari flat rate, diskon tidak ikut dihitung/ditambahkan.

FE cukup cek `flat_rate_applied` di tiap service sebelum menampilkan harga, dan pakai `final_cost` apa adanya — tidak perlu logic hitung ulang di FE.

### Pola B — field top-level saja (Sap)

Vendor **Sap** tidak punya field cost per-service yang jelas terpisah di response mentahnya, jadi info flat rate ditaruh sebagai field **top-level** (bukan di dalam tiap service), terpisah dari harga per-service:

```json
{
  "status": "success",
  "flat_rate_applied": true,
  "flat_rate_name": "Flat Ongkir Jawa & Bali",
  "flat_rate_price": 15000,
  "data": { "...": "response asli Sap" }
}
```

FE untuk vendor Sap: kalau `flat_rate_applied === true`, pakai `flat_rate_price` sebagai harga final (override harga apa pun yang FE baca dari `data`), bukan `final_cost` di dalam service seperti vendor lain.

### Vendor yang TIDAK punya flat rate: GoSend

**GoSend sengaja tidak diikutkan.** GoSend menghitung ongkir berdasarkan koordinat lat/long (kurir instan dalam kota), bukan nama provinsi asal/tujuan — jadi konsep "cakupan provinsi" tidak cocok secara fundamental untuk vendor ini. Cek ongkir GoSend tetap berjalan seperti biasa tanpa field `flat_rate_*`.

---

## 3. Catatan scope & limitasi

- **Cakupan hanya level provinsi**, bukan kota/kecamatan. PDF menyebut kemungkinan cakupan lebih detail, tapi versi ini disederhanakan ke level provinsi saja — cukup untuk use case "seluruh Jawa & Bali". Kalau nanti perlu granularitas kota/kecamatan, perlu pengembangan lanjutan.
- **Limit dimensi (`max_length`/`max_width`/`max_height`) baru berlaku kalau FE mengirim dimensi saat cek ongkir.** Payload cek ongkir standar saat ini belum membawa `length`/`width`/`height`, jadi di praktiknya hanya limit berat yang aktif menyaring untuk saat ini.
- **Flat rate berlaku vendor-agnostic secara default** (`vendor = null`), dengan opsi override khusus satu vendor (isi `vendor` + `priority` lebih tinggi supaya menang dibanding program umum untuk rute yang sama).
- **Flat rate tidak bertumpuk dengan diskon** — kalau match flat rate, diskon diabaikan sepenuhnya, tidak ditambahkan/dikurangkan dari harga flat.
- Order creation tidak berubah — sistem tetap percaya harga yang dikirim FE dari hasil cek ongkir, jadi begitu FE menampilkan `final_cost` (atau `flat_rate_price` untuk Sap) dan user submit order dengan angka itu, semuanya konsisten otomatis.
