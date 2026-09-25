# Data Export Semua Transaksi (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-12 dari `docs/export/export.md`. Tidak ada template; kolom mengikuti daftar transaksi pembayaran semua user (`GET /admin/payments/all`).

**Khusus admin, cakupan semua akun.** Hanya user dengan izin **`exports.transactions`** yang bisa membuatnya. Izin ini **baru**, dimiliki `superadmin` dan `admin`. Role `finance` **tidak** bisa, walaupun punya akses melihat pembayaran. Tampilkan tombolnya hanya kalau `hasPermission("exports.transactions")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

> **Yang dimaksud "transaksi" di sini**: catatan pembayaran (tabel `payments`) — pembayaran ongkir order, top up saldo lewat Xendit, dan pendapatan COD. **Bukan** mutasi saldo wallet; itu dicakup export **Riwayat Dompet** dan **Laporan Mutasi Saldo**.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `transactions` |
| `transaction_type` | tidak | `order` (pembayaran order), `topup` (top up saldo), atau `cod_income` (pendapatan COD). Nilai lain → `422`. **Namanya bukan `type`** karena `type` sudah dipakai untuk jenis export |
| `payment_method` | tidak | `wallet`, `cod`, atau `xendit`. Nilai lain → `422` |
| `status` | tidak | `pending`, `paid`, `expired`, atau `failed` (sama dengan status di `GET /payments/all`). Nilai lain → `422` |
| `user_id` | tidak | Batasi ke satu akun. Harus id user yang ada (`422` kalau tidak) |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **Tanggal Transaksi** (saat pembayaran dibuat), inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Tanpa filter → semua transaksi semua akun. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Semua Transaksi`. Nama file: `semua-transaksi[_jenis][_metode][_status][_akun{id}]_{start}_{end}_{waktu}.xlsx`.

Filter `payment_method=xendit` mencakup semua pembayaran yang bukan wallet dan bukan COD (lewat checkout Xendit).

---

## 2. Isi file: 3 sheet

### Sheet 1 — "Data Transaksi"

Header di baris 1 (tebal, dibekukan, ada filter). Urutan baris: transaksi paling lama dulu. 24 kolom:

| Kolom | Isi |
|---|---|
| No. | Nomor urut |
| Tanggal Transaksi, Jam | `YYYY-MM-DD` dan `HH:MM` (WIB) |
| No. Referensi | Nomor pembayaran (`PAY-…`) |
| Jenis Transaksi | `Pembayaran Order`, `Top Up Saldo`, atau `Pendapatan COD` |
| Nama Akun, Email Akun, Tipe Akun | Pemilik transaksi; tipe `Personal`/`Corporate`/`Agen` |
| Nominal | Jumlah pembayaran |
| Status | `Menunggu Pembayaran`, `Lunas`, `Kedaluwarsa`, atau `Gagal` |
| Metode Pembayaran | `Saldo Wallet`, `COD`, atau `Xendit` |
| Kanal Pembayaran | Saldo Wallet → `Saldo Wallet`; COD → `COD Diterima`; Xendit → metode/kanal yang dilaporkan Xendit, mis. `BANK_TRANSFER / BCA`. Untuk Xendit **kosong** selama belum dibayar (atau bila Xendit tidak melaporkannya) |
| Tanggal Dibayar | `YYYY-MM-DD HH:MM`; kosong bila belum dibayar |
| Batas Waktu Bayar | Batas invoice Xendit; kosong untuk Saldo Wallet dan COD |
| No. Referensi Order, No. Waybill, Ekspedisi, Status Order | Order yang dibayar (kosong untuk Top Up). Ekspedisi huruf besar (mis. `JNTEXPRESS`). Waybill dan Status Order adalah kondisi order **saat file dibuat**. Bila order sudah tidak ada, nomor referensi dan ekspedisi tetap diambil dari catatan pembayaran |
| No. Transaksi Wallet | Nomor mutasi wallet terkait (mis. `WTX-0038`), bila ada |
| External ID, Invoice ID | Identitas invoice di Xendit |
| Mata Uang | `IDR` |
| ID, User ID | Id pembayaran dan id pemilik |

**Jenis Transaksi**

| Nilai di file | `transaction_type` | Arti |
|---|---|---|
| Pembayaran Order | `order` | Pembayaran ongkir sebuah order (Saldo Wallet atau Xendit) |
| Top Up Saldo | `topup` | Pengisian saldo wallet lewat Xendit |
| Pendapatan COD | `cod_income` | Dana COD yang dikreditkan ke saldo pengirim setelah paket diterima |

**Status**

| Nilai di file | `status` | Arti |
|---|---|---|
| Menunggu Pembayaran | `pending` | Invoice dibuat, belum dibayar |
| Lunas | `paid` | Sudah dibayar. Pembayaran Saldo Wallet dan Pendapatan COD langsung Lunas |
| Kedaluwarsa | `expired` | Tidak dibayar sampai batas waktu |
| Gagal | `failed` | Pembayaran gagal |

### Sheet 2 — "Dashboard"

Angka jadi (bukan rumus): Total Transaksi; Total Nominal (semua status), Total Nominal Lunas, Total Nominal Menunggu Pembayaran; lalu tabel per **Status**, per **Jenis Transaksi**, dan per **Metode Pembayaran** (jumlah, nominal, nominal lunas).

**Jangan menjumlahkan semua jenis sebagai uang masuk**: pembayaran order dengan Saldo Wallet memakai saldo yang berasal dari top up, dan Pendapatan COD hanya menambah saldo. Uang yang benar-benar masuk lewat Xendit = Nominal Lunas pada baris Metode **Xendit**.

### Sheet 3 — "Info Export"

Filter yang dipakai, siapa yang mengekspor, waktu dibuat, total transaksi, penjelasan jenis/status/kanal, serta peringatan **file berisi data pembayaran semua pengguna, jangan dibagikan tanpa pengamanan**.

Teks dari user (nama) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus.

---

## 3. Hal yang perlu diketahui

- Metode **Xendit** adalah semua yang bukan wallet/COD, termasuk invoice yang belum dibayar (metode belum diketahui). Karena itu pembayaran Xendit yang Menunggu/Kedaluwarsa/Gagal juga berlabel Xendit.
- Link pembayaran (`invoice_url`) sengaja **tidak** dimasukkan ke file.
- Cakupan dan filter dievaluasi **saat file dibuat** (saat worker menjalankan job).

---

## 4. Ringkasan perubahan BE

- Tipe export baru `transactions` di `config/exports.php`.
- **Permission baru `exports.transactions`** (di `PermissionsTableSeeder`); otomatis ikut ke `admin` dan `superadmin` setelah seeder role dijalankan ulang.
- Tidak ada perubahan pada endpoint atau response API pembayaran.
