# Data Export Ringkasan Pengiriman (Excel)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-3 dari `docs/export/export.md`.

Isinya adalah angka di balik kartu-kartu **Ringkasan** di Beranda (`GET /admin/order-statistics`): jumlah order per status dipisah Reguler dan COD, paket bermasalah, dan rincian per ekspedisi. Angkanya sudah dicek identik dengan endpoint `order-statistics` untuk data dan periode yang sama.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Siapa boleh apa

| Siapa | Cakupan data | Filter `user_id` |
|---|---|---|
| Customer (personal / corporate / agen), izin `orders.index` | Order **miliknya sendiri** | **Tidak boleh** dikirim — kalau dikirim, dibalas `422` (`user_id` prohibited) |
| `superadmin` dan staff dengan izin `orders.view_all` (`admin`, `operations`, `customer-service`) | **Semua akun** | Boleh: batasi ke satu akun tertentu |
| Tanpa izin `orders.index` (mis. `finance`, `sales`) | — | `403` |

Aturan cakupannya sama dengan halaman Laporan Pengiriman dan `order-statistics`, jadi FE cukup memakai `hasPermission("orders.view_all")` untuk menentukan apakah pemilih akun (`user_id`) ditampilkan.

---

## 2. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `shipping-summary` |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **tanggal order dibuat**, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |
| `user_id` | tidak | **Khusus yang boleh melihat semua akun.** Id user; harus ada (`422` kalau tidak) |

Tanpa `start_date`/`end_date` → **semua waktu** (berbeda dengan Beranda yang default bulan berjalan). Kalau ingin sama dengan Beranda, kirim tanggal awal dan akhir bulan ini.

Contoh admin untuk satu akun:

```json
{ "type": "shipping-summary", "user_id": 42, "start_date": "2026-09-01", "end_date": "2026-09-30" }
```

Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Ringkasan Pengiriman`. Nama file: `ringkasan-pengiriman[_akun{id}]_{start}_{end}_{waktu}.xlsx`. `total_rows` pada item export berisi **jumlah order yang diringkas**.

---

## 3. Isi file: 3 sheet

### Sheet 1 — "Ringkasan"

Tiga tabel kecil bertumpuk (bukan tabel data, tanpa filter):

**Ringkasan Status Pengiriman** — kolom `Status | Total | Reguler | COD`, satu baris per status (Menunggu Pembayaran, Belum Diproses, Belum di Ekspedisi, Proses Pengiriman, Kendala Pengiriman, Sampai Tujuan, Retur, Dibatalkan) plus baris **Total Order**. Semua order dihitung, **termasuk Dibatalkan**.

- **COD** = nilai COD lebih dari 0 atau layanan COD. **Reguler** = selain itu.

**Paket Bermasalah** — order yang belum Sampai Tujuan / Retur / Dibatalkan, dikelompokkan menurut umur sejak tanggal order dibuat (dihitung dari saat file dibuat): `Dibuat 4 - 7 hari lalu`, `Dibuat 8 - 30 hari lalu`, `Dibuat lebih dari 30 hari lalu`.

**Nilai** (tanpa order Dibatalkan) — Total Pengiriman, Total Ongkir, Pengiriman Tanpa Data Ongkir, Jumlah Order COD, Total Nilai COD.

### Sheet 2 — "Per Ekspedisi"

Satu baris per ekspedisi (huruf besar; `idexpress` dan `IDEXPRESS` digabung), urut dari order terbanyak: Total Order, Total Pengiriman (tanpa Dibatalkan), jumlah per status (8 kolom), Total Ongkir.

### Sheet 3 — "Info Export"

Jenis, periode, **cakupan** (`Semua akun`, `Akun: {nama} ({email})`, atau `Akun sendiri ({email})`), siapa yang mengekspor, waktu dibuat, total order, dan catatan cara hitung.

Kolom uang dan jumlah adalah angka (bisa dijumlahkan di Excel). Ongkir = nominal yang ditagihkan (setelah diskon, termasuk asuransi); order lama tanpa nominal tersimpan tidak ikut dijumlahkan dan dihitung di *Pengiriman Tanpa Data Ongkir*.

---

## 4. Hal yang perlu diketahui

- **Celah 7–8 hari di kartu Beranda.** Definisi "paket bermasalah" di `order-statistics` memakai rentang 4–7 hari dan 8–30 hari, sehingga order yang umurnya di antara 7 dan 8 hari tidak masuk kelompok mana pun. Export sengaja memakai batas yang sama supaya angkanya cocok dengan kartu, dan hal ini dicatat di sheet Info. Kalau ingin diperbaiki, perbaikannya harus dilakukan di `order-statistics` dan export sekaligus.
- Nama "no update" pada `trouble_stats` sebenarnya menghitung umur sejak **order dibuat**, bukan sejak update terakhir.

---

## 5. Ringkasan perubahan BE

- Tipe export baru `shipping-summary` di `config/exports.php`; tidak ada tabel, endpoint, atau permission baru (memakai `orders.index` dan `orders.view_all`).
- Kontrak exporter sekarang menerima user yang meminta export (agar `user_id` bisa dilarang untuk non-admin dan Info Export bisa mencantumkan siapa yang mengekspor). Tidak ada perubahan bentuk API.
