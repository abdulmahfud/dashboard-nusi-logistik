# Dokumentasi FE — Diskon Pengiriman

Admin bisa membuat aturan diskon ongkir per vendor (potongan persen atau nominal tetap), yang otomatis dihitung saat user cek ongkir. Diskon **tidak bertumpuk** dengan flat ongkir (lihat [flat-ongkir-jawa-bali.md](flat-ongkir-jawa-bali.md)) — kalau ada program flat yang match, diskon diabaikan sepenuhnya.

## 1. Keputusan penting: tidak ada pilihan "jenis layanan"

**REGULER dan COD selalu memakai kebijakan diskon yang sama persis.** Ini keputusan bisnis yang sengaja diambil, bukan keterbatasan sementara — alasannya:

- `Order.service_code` (`REGULER`/`COD`) di database itu **cuma label pencatatan**, ditentukan saat order dibuat. Itu tidak menentukan produk vendor yang dipanggil — misalnya JNE selalu memakai produk REG23 baik order-nya COD maupun bukan, cuma beda ada `cod_value`-nya atau tidak.
- Saat cek ongkir dihitung (titik di mana diskon benar-benar dicocokkan), sistem **belum tahu** apakah order itu nanti COD atau bukan — payload cek ongkir sengaja tidak memuat info COD (lihat `docs/payload-fe.md` §1).

**Konsekuensi untuk FE**: form create/edit diskon pengiriman **tidak perlu ada field "jenis layanan"** (jangan tampilkan pilihan REGULER/COD/EXPRESS/INSTAN dkk). Kalaupun field `service_type` masih dikirim di body request, **server akan selalu memaksanya jadi `null`** — apa pun yang dikirim, hasilnya tetap berlaku untuk semua jenis layanan (universal). Jadi field ini aman dihapus dari UI kapan saja tanpa menunggu backend berubah.

---

## 2. Endpoint

Semua di bawah prefix `admin` (`/api/admin/...`), butuh `Authorization: Bearer <token>`. Response wrapper: `{status, message, data}`.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| GET | `/admin/expedition-discounts` | `discounts.view` | List diskon |
| POST | `/admin/expedition-discounts` | `discounts.create` | Buat diskon baru |
| GET | `/admin/expedition-discounts/statistics` | `discounts.view` | Ringkasan jumlah diskon |
| GET | `/admin/expedition-discounts/available` | `discounts.view` | Cek diskon terbaik untuk vendor + nilai order tertentu |
| GET | `/admin/expedition-discounts/{id}` | `discounts.view` | Detail diskon |
| PUT | `/admin/expedition-discounts/{id}` | `discounts.update` | Update diskon |
| PATCH | `/admin/expedition-discounts/{id}/toggle-status` | `discounts.update` | Toggle aktif/nonaktif satu klik |
| DELETE | `/admin/expedition-discounts/{id}` | `discounts.delete` | Hapus diskon |

### GET `/admin/expedition-discounts`

Query params opsional: `vendor`, `is_active` (`0`/`1`), `user_type` (`personal`/`corporate`), `search` (cari `description`), `per_page`. **Tidak ada lagi filter `service_type`** — dihapus karena konsepnya sudah tidak ada.

### POST `/admin/expedition-discounts`

Body:
```json
{
  "vendor": "JNTEXPRESS",
  "discount_type": "percentage",
  "discount_value": 10,
  "minimum_order_value": 50000,
  "maximum_discount_amount": 15000,
  "user_type": null,
  "is_active": true,
  "valid_from": null,
  "valid_until": null,
  "description": "Diskon 10% JNT Express",
  "usage_limit": null,
  "priority": 0
}
```

Validasi:
- `vendor` **wajib**, kode vendor (di-uppercase otomatis di server).
- `discount_type` **wajib**: `percentage` atau `fixed_amount`.
- `discount_value` **wajib**, angka ≥ 0 (persen untuk `percentage`, nominal Rupiah untuk `fixed_amount`).
- `minimum_order_value` opsional — ongkir minimum agar diskon berlaku.
- `maximum_discount_amount` opsional — cap nominal potongan, khusus tipe `percentage`.
- `user_type` opsional: `personal`, `corporate`, atau kosongkan untuk berlaku ke semua tipe user. **Tidak ada batas penggunaan minimum yang diwajibkan berbeda antara personal dan corporate** — kalau ingin salah satu tipe user tanpa batas pakai, cukup kosongkan `usage_limit`.
- `is_active` opsional, default `true`.
- `valid_from` / `valid_until` opsional — untuk promo bertanggal.
- `description` opsional.
- `usage_limit` opsional. **Penting**: ini kuota **global** (total pemakaian oleh SEMUA user gabungan), bukan kuota per-user. Kosongkan untuk tidak dibatasi.
- `priority` opsional, default `0` — dipakai kalau lebih dari satu diskon match, yang `priority` lebih tinggi menang.
- `service_type` — **boleh dikirim atau tidak, tidak berpengaruh**. Server selalu menyimpannya sebagai `null`.

Response `201` — object diskon lengkap (`service_type` akan selalu `null`). Response `422` kalau validasi gagal.

**Catatan constraint database**: kombinasi `(vendor, user_type, discount_type)` harus unik (karena `service_type` sekarang selalu `null`, kombinasi lama `vendor+service_type+user_type+discount_type` otomatis menyempit jadi ini). Artinya **admin cuma bisa punya satu aturan `percentage` dan satu aturan `fixed_amount` per vendor per `user_type`** — kalau butuh dua promo persen berbeda untuk vendor yang sama, salah satunya harus dinonaktifkan dulu atau memakai `user_type` yang berbeda. Kalau ini menabrak constraint, sistem saat ini membalas error generik (500) — sengaja tidak diubah jadi pesan khusus di iterasi ini, tapi FE sebaiknya validasi dulu di sisi form (misal cek dulu lewat GET list) supaya tidak sering menyentuh error ini.

### GET `/admin/expedition-discounts/{id}`

`404` kalau tidak ditemukan.

### PUT `/admin/expedition-discounts/{id}`

Semua field di body POST bersifat opsional (kirim yang mau diubah saja). `service_type` tetap dipaksa `null` sama seperti saat create.

### PATCH `/admin/expedition-discounts/{id}/toggle-status`

Tidak butuh body, membalik `is_active`.

### DELETE `/admin/expedition-discounts/{id}`

Hapus permanen.

### GET `/admin/expedition-discounts/available`

Query params: `vendor` (wajib), `order_value` (opsional — kalau diisi, response menyertakan perhitungan potongan). Response di-cache 30 menit (`cache.response:1800`). Berguna untuk preview "diskon apa saja yang tersedia untuk vendor ini" tanpa memanggil cek-ongkir penuh.

### GET `/admin/expedition-discounts/statistics`

Ringkasan jumlah diskon (total, aktif, nonaktif, per vendor, per tipe, total pemakaian) — untuk dashboard admin.

---

## 3. Kaitan dengan cek ongkir

**Tidak ada endpoint baru untuk cek ongkir** — diskon otomatis dievaluasi saat FE memanggil endpoint cek ongkir per vendor yang sudah ada. Kalau ada diskon aktif yang match vendor (dan `user_type` user yang login, kalau diisi), harga di response akan menunjukkan potongannya lewat field tambahan `discount_applied` (boolean), `discount_amount` (nominal potongan), dan harga akhir di field cost/`final_cost` masing-masing vendor sudah otomatis terpotong.

**Sebelumnya ada 2 vendor yang diskonnya tidak pernah berlaku sama sekali** — **SAP** dan **Anteraja** tidak pernah memanggil sistem perhitungan diskon di `getShipmentCost()` mereka, jadi diskon apa pun yang dibuat untuk kedua vendor ini tidak pernah muncul di harga. Ini sudah diperbaiki:
- **SAP** — potongan sekarang diterapkan pada `data.services[0].total_cost` (field yang sama yang selama ini dibaca FE untuk harga SATRIA REG), plus field baru `original_cost`, `discount_applied`, `discount_amount`, `flat_rate_applied`, `flat_rate_name` di object yang sama.
- **Anteraja** — potongan diterapkan pada field `cost` di level atas response, plus field baru `discount_applied`/`discount_amount` di samping `original_cost`/`flat_rate_applied`/`flat_rate_name` yang sudah ada sebelumnya.

Vendor lain (IdExpress, JNE, JntCargo, JntExpress, Lion, NinjaExpress, Paxel, PosIndonesia) sudah menerapkan diskon sejak awal, tidak berubah.

**GoSend** belum masuk production, jadi belum diikutkan ke sistem diskon.

---

## 4. Catatan scope

- `user_type` (`personal`/`corporate`) dan `service_type` adalah dua sumbu yang berbeda — `user_type` masih relevan dan bisa dipilih admin, hanya `service_type` yang dihapus konsepnya.
- Diskon dan flat ongkir tidak bertumpuk (flat ongkir menang kalau match).
- `usage_limit` adalah kuota global, bukan kuota per-user — kalau nanti dibutuhkan kuota per-user (misal "tiap user cuma boleh pakai promo ini sekali"), itu perlu pengembangan terpisah (tabel tracking pemakaian per user).
