# Data Export Laporan Mutasi Saldo (Excel, data akun sendiri)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-14 dari `docs/export/export.md`. Tidak ada template; isinya mengikuti halaman **Laporan Mutasi Saldo**, yaitu riwayat pembayaran (`GET /admin/payments/history`), **bukan** mutasi wallet (untuk itu lihat export Riwayat Dompet).

**Hanya data akun sendiri, untuk semua role.** Export ini untuk customer. Admin/superadmin/finance yang mengekspor juga hanya mendapat pembayaran **milik akun mereka sendiri**; tidak ada pilihan akun lain (`user_id` tidak ada, kalau dikirim diabaikan). Untuk semua akun, admin memakai export **Semua Transaksi** (`docs/be-fe/export-semua-transaksi.md`).

**Izin: `payments.view`** (sama dengan halaman Laporan Mutasi Saldo). Dimiliki `user`, `finance`, `admin`, `superadmin`. Role tanpa izin ini (`sales`, `operations`, `customer-service`) mendapat `403`. **Tidak ada permission baru.** Tampilkan tombol export di halaman Laporan Mutasi Saldo bila `hasPermission("payments.view")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `payment-history` |
| `search` | tidak | Maks. 255 karakter. Cari di nomor referensi, external id, invoice id, metode, dan kanal pembayaran (sama dengan kolom pencarian di halaman) |
| `status` | tidak | `pending`, `paid`, `expired`, atau `failed`. Nilai lain → `422` |
| `payment_method` | tidak | `wallet`, `cod`, atau `xendit`. Nilai lain → `422`. `xendit` = semua yang bukan wallet dan bukan COD |
| `transaction_type` | tidak | `order` (pembayaran order), `topup` (top up saldo), atau `cod_income` (pendapatan COD). Nilai lain → `422`. **Namanya bukan `type`** karena `type` sudah dipakai untuk jenis export |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan tanggal transaksi (saat pembayaran dibuat), inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Perhatikan: nama tanggalnya `start_date`/`end_date` (konvensi semua export), **bukan** `date_from`/`date_to` seperti di `GET /payments/history`. Filter halaman bisa diteruskan ke export dengan penyesuaian nama ini.

Beda dengan halaman: `payment_method` di halaman berupa teks bebas (mis. `BANK_TRANSFER`), di export berupa tiga pilihan di atas.

Tanpa filter → seluruh riwayat pembayaran akun. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Laporan Mutasi Saldo`. Nama file: `laporan-mutasi-saldo[_jenis][_metode][_status]_{start}_{end}_{waktu}.xlsx`.

---

## 2. Isi file: 3 sheet

Isi dan artinya **sama dengan export Semua Transaksi** (lihat `docs/be-fe/export-semua-transaksi.md` §2 untuk tabel jenis, status, kanal), dengan perbedaan:

- Sheet 1 bernama **"Laporan Mutasi Saldo"** dan **tidak punya kolom akun** (Nama Akun, Email Akun, Tipe Akun, User ID), karena semua barisnya milik akun peminta. Jadi **20 kolom** (Semua Transaksi: 24).
- Judul Dashboard: `DASHBOARD LAPORAN MUTASI SALDO BHISAKIRIM`.
- Sheet "Info Export" menampilkan akun pemilik dan kata pencarian.

Ringkas, kolom sheet 1: No., Tanggal Transaksi, Jam, No. Referensi, Jenis Transaksi (`Pembayaran Order` / `Top Up Saldo` / `Pendapatan COD`), Nominal, Status (`Menunggu Pembayaran` / `Lunas` / `Kedaluwarsa` / `Gagal`), Metode Pembayaran (`Saldo Wallet` / `COD` / `Xendit`), Kanal Pembayaran, Tanggal Dibayar, Batas Waktu Bayar, No. Referensi Order, No. Waybill, Ekspedisi, Status Order, No. Transaksi Wallet, External ID, Invoice ID, Mata Uang, ID.

Sheet "Dashboard": Total Transaksi; Total Nominal (semua status), Total Nominal Lunas, Total Nominal Menunggu Pembayaran; tabel per Status, per Jenis Transaksi, dan per Metode Pembayaran (jumlah, nominal, nominal lunas). Tabel per Metode adalah padanan `summary.by_payment_method` di halaman, tetapi menghitung **semua status** dengan kolom "Nominal Lunas" terpisah (di halaman hanya yang `paid`).

Teks bebas selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus. Link pembayaran tidak dimasukkan.

---

## 3. Hal yang perlu diketahui

- Data yang diambil adalah data akun **yang menjalankan job**, dievaluasi saat file dibuat. Tidak ada cara meminta pembayaran akun lain lewat export ini, bahkan oleh admin.
- Metode `Xendit` mencakup semua yang bukan wallet/COD, termasuk invoice yang belum dibayar (metode belum diketahui). Kanal terisi setelah dibayar.
- Halaman ini adalah riwayat **pembayaran**. Untuk mutasi saldo wallet (masuk/keluar dengan saldo sebelum/sesudah), gunakan export Riwayat Dompet.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `payment-history` di `config/exports.php`.
- **Tidak ada permission atau seeder baru**; memakai `payments.view`.
- Export Semua Transaksi (admin) sekarang juga menerima filter `search` (nomor referensi, external id, invoice id, metode, kanal, serta nama/email pemilik). Tambahan saja; yang sudah ada tidak berubah.
- Tidak ada perubahan pada endpoint atau response API pembayaran.
