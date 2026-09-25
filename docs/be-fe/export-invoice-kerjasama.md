# Data Export Invoice Kerjasama (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-9 dari `docs/export/export.md`. Tidak ada file template untuk export ini ("sesuai website"), jadi kolomnya mengikuti daftar invoice kerja sama.

**Khusus admin, cakupan semua akun.** Hanya user dengan izin **`exports.kerja-sama-invoices`** yang bisa membuatnya. Izin ini **baru**, dimiliki `superadmin` dan `admin`. Role `finance` **tidak** bisa, walaupun punya `kerja-sama.invoices.view` untuk melihat invoice. Tampilkan tombolnya hanya kalau `hasPermission("exports.kerja-sama-invoices")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `kerja-sama-invoices` |
| `status` | tidak | Kode status invoice: `draft`, `issued`, `partially_paid`, `paid`, `overdue`, `void` (sama dengan filter `status` di API invoice). Nilai lain → `422` |
| `user_id` | tidak | Batasi ke invoice satu akun. Harus id user yang ada (`422` kalau tidak) |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **Tanggal Dibuat** invoice, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Tanpa filter → semua invoice semua akun. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Invoice Kerjasama`. Nama file: `invoice-kerjasama[_status][_akun{id}]_{start}_{end}_{waktu}.xlsx`.

---

## 2. Isi file: 5 sheet

### Sheet 1 — "Data Invoice" (satu baris per invoice)

Header di baris 1 (tebal, dibekukan, ada filter). Urutan baris: invoice paling lama dibuat dulu.

| Kolom | Isi |
|---|---|
| No. | Nomor urut |
| No. Invoice | Nomor invoice (mis. `INV-KS-260909-1234`) |
| Nama Akun, Email Akun, Perusahaan | Pemilik invoice |
| Periode Mulai, Periode Selesai | Periode tagihan (`YYYY-MM-DD`; hanya label administratif) |
| Status | `Draft`, `Diterbitkan`, `Dibayar Sebagian`, `Lunas`, `Jatuh Tempo`, `Dibatalkan` |
| Tanggal Dibuat, Tanggal Terbit, Jatuh Tempo, Tanggal Lunas | `YYYY-MM-DD`. Tanggal Terbit kosong untuk draft; Tanggal Lunas kosong bila belum lunas |
| Jumlah Pengiriman | Jumlah baris pengiriman dalam invoice |
| Subtotal, Biaya Tambahan, Diskon, Pajak, Total Tagihan | Nominal invoice (angka) |
| Terbayar | Total yang sudah dibayar |
| Sisa Tagihan | Lihat aturan di bawah |
| Terlambat (Hari) | Lihat aturan di bawah |
| Dibuat Oleh | Admin yang men-generate invoice |
| Catatan | Catatan invoice |
| ID Invoice | Id invoice (angka, sama dengan `id` di API invoice) |
| PDF Tersedia | `Ya` bila file PDF invoice sudah dibuat |

**Sisa Tagihan** = Total Tagihan − Terbayar, **hanya untuk invoice yang sudah terbit dan belum lunas** (`Diterbitkan`, `Dibayar Sebagian`, `Jatuh Tempo`). Untuk `Draft` (belum dikirim ke customer), `Dibatalkan`, dan `Lunas`, Sisa Tagihan = 0.

**Terlambat (Hari)** = jumlah hari lewat jatuh tempo (dihitung sampai saat file dibuat), untuk invoice yang masih punya sisa tagihan. Kolom ini **tidak bergantung pada kolom Status**, karena status `Jatuh Tempo` diperbarui oleh proses terjadwal dan bisa tertinggal; invoice berstatus `Diterbitkan` tapi sudah lewat jatuh tempo tetap tampil terlambat di sini. Kosong bila tidak terlambat.

### Sheet 2 — "Dashboard"

Angka jadi (bukan rumus): Total Invoice, jumlah invoice terlambat, lalu **piutang** dari invoice yang sudah terbit (Total Tagihan, Total Terbayar, Sisa Tagihan, dan Sisa Tagihan yang Terlambat), lalu tabel per Status (jumlah invoice dan total tagihan). Draft dan Dibatalkan **tidak** dihitung sebagai tagihan.

### Sheet 3 — "Per Akun"

Satu baris per akun, diurutkan dari sisa tagihan terbesar: Nama, Email, Perusahaan, Jumlah Invoice Terbit, Total Tagihan, Terbayar, Sisa Tagihan, Invoice Terlambat. Hanya menghitung invoice yang sudah terbit (termasuk Lunas); akun yang hanya punya draft/dibatalkan tidak muncul. Berguna untuk finance menagih.

### Sheet 4 — "Detail Item"

Satu baris per **pengiriman di dalam invoice** (snapshot yang disimpan saat invoice dibuat): No. Invoice, Status Invoice, Nama Akun, No. Referensi, No. Waybill, Ekspedisi, Tanggal Kirim, Nama Pengirim, Nama Penerima, Berat, Layanan, Ongkir, Biaya Tambahan, Diskon, Pajak, Total. Header dibekukan dan ada filter.

### Sheet 5 — "Info Export"

Filter yang dipakai, siapa yang mengekspor, waktu dibuat, total invoice, penjelasan aturan hitung di atas, dan peringatan **file berisi data penagihan pengguna, jangan dibagikan tanpa pengamanan**.

Teks dari user (nama akun, catatan) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus.

---

## 3. Hal yang perlu diketahui

- Isi **Detail Item** adalah snapshot saat invoice dibuat, jadi tidak berubah walau data order berubah kemudian.
- Saat ini Biaya Tambahan, Diskon, dan Pajak pada invoice selalu 0 (sistem penagihan belum memakainya); kolomnya sudah disiapkan bila nanti dipakai.
- File PDF invoice tidak ikut diexport, hanya keterangan `PDF Tersedia`. PDF tetap diunduh dari endpoint invoice (`GET /admin/kerja-sama/invoices/{id}/download`).
- Belum ada invoice kerja sama di produksi saat export ini dibuat, jadi file dari produksi masih berisi header saja; format lengkapnya sudah diuji dengan data uji.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `kerja-sama-invoices` di `config/exports.php`.
- **Permission baru `exports.kerja-sama-invoices`** (di `PermissionsTableSeeder`); otomatis ikut ke `admin` dan `superadmin` setelah seeder role dijalankan ulang (sudah dilakukan di produksi).
- Tidak ada perubahan pada endpoint atau response API invoice kerja sama.
