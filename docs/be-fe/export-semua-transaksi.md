# Data Export Semua Transaksi (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-13 dari `docs/export/export.md`. Tidak ada template; isinya mengikuti halaman **Semua Transaksi** (admin), yaitu **riwayat mutasi wallet semua user** (`GET /admin/wallet/transactions/all`). Versi untuk user (data sendiri): `docs/be-fe/export-riwayat-dompet.md` — kolom dan artinya sama.

**Khusus admin, cakupan semua akun.** Hanya user dengan izin **`exports.wallet-transactions`** yang bisa membuatnya. Izin ini **baru**, dimiliki `superadmin` dan `admin`. Role `finance` **tidak** bisa, walaupun punya `wallet.transactions.view_all` untuk melihat halamannya. Tampilkan tombolnya hanya kalau `hasPermission("exports.wallet-transactions")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

> **Bukan yang sama dengan Laporan Mutasi Saldo Semua** (`docs/be-fe/export-laporan-mutasi-saldo-semua.md`). Itu riwayat **pembayaran** (termasuk pembayaran Xendit langsung yang tidak menyentuh saldo); export ini adalah **mutasi saldo wallet** (masuk/keluar dengan saldo sebelum/sesudah).

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `wallet-transactions` |
| `user_id` | tidak | Batasi ke satu akun. Harus id user yang ada (`422` kalau tidak) |
| `transaction_type` | tidak | `topup`, `payment`, `withdraw`, atau `cod_income`. Nilai lain → `422`. **Namanya bukan `type`** karena `type` sudah dipakai untuk jenis export |
| `status` | tidak | `pending`, `success`, atau `failed`. Nilai lain → `422` |
| `amount_min` / `amount_max` | tidak | Rentang nominal (angka ≥ 0). `amount_max` tidak boleh kurang dari `amount_min` (`422`) |
| `search` | tidak | Maks. 255 karakter. Cari di keterangan, nomor referensi top up/pembayaran, serta **nama dan email** pemilik akun |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan tanggal transaksi, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Perhatikan: nama tanggalnya `start_date`/`end_date` (konvensi semua export), **bukan** `date_from`/`date_to` seperti di endpoint halaman. Filter halaman (`user_id`, `type`, `status`, `amount_min`, `amount_max`) bisa diteruskan dengan penyesuaian nama `type` → `transaction_type` dan nama tanggal.

Tanpa filter → semua mutasi wallet semua akun. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Semua Transaksi`. Nama file: `semua-transaksi[_jenis][_status][_akun{id}]_{start}_{end}_{waktu}.xlsx`.

---

## 2. Isi file: 4 sheet

### Sheet 1 — "Semua Transaksi"

Isi kolomnya **sama dengan Riwayat Dompet** (lihat `docs/be-fe/export-riwayat-dompet.md` §2: jenis, arah, nominal, Uang Masuk/Keluar, saldo sebelum/sesudah, status, sumber, referensi, order terkait), ditambah **kolom akun**: **Nama Akun, Email Akun, Tipe Akun** (setelah ID Transaksi) dan **User ID** (paling kanan). Total 25 kolom. Header di baris 1 (tebal, dibekukan, ada filter). Urutan baris: transaksi paling lama dulu.

Ingat aturannya: hanya transaksi **Berhasil** yang mengubah saldo dan terisi di Uang Masuk / Uang Keluar; Saldo Sebelum/Sesudah bisa kosong untuk transaksi lama dan yang tidak mengubah saldo.

### Sheet 2 — "Dashboard"

Angka jadi (bukan rumus): Total Transaksi, **Jumlah Akun**; **Total Saldo Saat Ini** (jumlah saldo terkini akun-akun yang ada di export), Total Uang Masuk dan Total Uang Keluar (hanya yang Berhasil); tabel per Jenis Transaksi dan per Status (jumlah, nominal, nominal berhasil). Total mengikuti **filter export**; saldo selalu nilai saat file dibuat.

### Sheet 3 — "Ringkasan Per Akun"

Satu baris per akun yang ada di export, saldo terbesar dulu: Nama, Email, Tipe Akun, **Saldo Saat Ini**, Jumlah Transaksi, dan total transaksi **Berhasil** per jenis: Top Up, Pendapatan COD, Pembayaran Order, Penarikan Dana. Angka per jenis hanya mencakup transaksi yang ikut di export (sesuai filter).

### Sheet 4 — "Info Export"

Cakupan (`Semua akun` atau akun terpilih), filter yang dipakai (termasuk rentang nominal dan kata pencarian), siapa yang mengekspor, waktu dibuat, total transaksi, penjelasan kolom, serta peringatan **file berisi data keuangan semua pengguna, jangan dibagikan tanpa pengamanan**.

Teks bebas (nama, keterangan) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus.

---

## 3. Hal yang perlu diketahui

- Cakupan dan filter dievaluasi **saat file dibuat** (saat worker menjalankan job).
- Top up Xendit yang belum dibayar, dan pembayaran order langsung lewat Xendit (tanpa saldo), **tidak** muncul di sini karena tidak menyentuh saldo wallet. Withdraw yang menunggu persetujuan muncul sebagai `Menunggu`. Untuk semua pembayaran, pakai Laporan Mutasi Saldo Semua.
- File semua akun bisa besar; itu sebabnya export berjalan lewat antrian dan ditulis bertahap.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `wallet-transactions` di `config/exports.php`.
- **Permission baru `exports.wallet-transactions`** (di `PermissionsTableSeeder`); otomatis ikut ke `admin` dan `superadmin` setelah seeder role dijalankan ulang.
- Export Riwayat Dompet (user) tidak berubah perilakunya; implementasinya kini dipakai bersama.
- Tidak ada perubahan pada endpoint atau response API wallet.
