# Data Export Riwayat Dompet (Excel, data akun sendiri)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-13 dari `docs/export/export.md`. Tidak ada template; kolom mengikuti tabel riwayat wallet di layar (`GET /admin/wallet/transactions`).

**Hanya data akun sendiri, untuk semua role.** Export ini untuk customer. Admin/superadmin/finance yang mengekspor juga hanya mendapat transaksi wallet **milik akun mereka sendiri**; tidak ada pilihan akun lain (`user_id` tidak ada, kalau dikirim diabaikan). Untuk melihat wallet semua akun, pakai export **Semua Transaksi** (`docs/be-fe/export-semua-transaksi.md`) atau **Laporan Mutasi Saldo Semua**.

**Izin: `wallet.view`** (sama dengan halaman riwayat dompet). Dimiliki `user`, `finance`, `admin`, `superadmin`. Role tanpa izin ini (`sales`, `operations`, `customer-service`) mendapat `403`. **Tidak ada permission baru.** Tampilkan tombol export di halaman Riwayat Dompet bila `hasPermission("wallet.view")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `wallet-history` |
| `transaction_type` | tidak | `topup`, `payment`, `withdraw`, atau `cod_income` (sama dengan filter `type` di riwayat wallet). Nilai lain → `422`. **Namanya bukan `type`** karena `type` sudah dipakai untuk jenis export |
| `status` | tidak | `pending`, `success`, atau `failed`. Nilai lain → `422` |
| `search` | tidak | Maks. 255 karakter. Cari di keterangan **dan** nomor referensi top up / pembayaran, sama seperti kolom pencarian di riwayat wallet |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan tanggal transaksi, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Perhatikan: nama tanggalnya `start_date`/`end_date` (konvensi semua export), **bukan** `date_from`/`date_to` seperti di endpoint riwayat wallet. Filter di halaman bisa langsung diteruskan ke export dengan penyesuaian nama ini.

Tanpa filter → seluruh riwayat wallet akun. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Riwayat Dompet`. Nama file: `riwayat-dompet[_jenis][_status]_{start}_{end}_{waktu}.xlsx`.

---

## 2. Isi file: 3 sheet

### Sheet 1 — "Riwayat Dompet"

Header di baris 1 (tebal, dibekukan, ada filter). Urutan baris: transaksi paling lama dulu (urutan sebuah mutasi saldo). 21 kolom:

| Kolom | Isi |
|---|---|
| No. | Nomor urut |
| Tanggal, Jam | `YYYY-MM-DD` dan `HH:MM` (WIB) |
| ID Transaksi | Dibentuk dari id, mis. `WTX-0038` |
| Jenis Transaksi | Lihat tabel di bawah |
| Arah | `Masuk` atau `Keluar` |
| Nominal | Jumlah transaksi (selalu positif) |
| Uang Masuk / Uang Keluar | Nominal, **hanya** untuk transaksi berstatus Berhasil (yang benar-benar mengubah saldo); selain itu kosong |
| Saldo Sebelum / Saldo Sesudah | Saldo tepat sebelum dan sesudah transaksi. **Bisa kosong** (lihat di bawah) |
| Status | `Menunggu`, `Berhasil`, atau `Gagal` |
| Keterangan | Deskripsi transaksi |
| Sumber | `Top Up (Xendit)`, `Pembayaran Order`, `Pendapatan COD`, `Permintaan Withdraw`, atau `Manual` |
| No. Referensi | Nomor top up / pembayaran (`PAY-…`) / withdraw (`WD-0012`); kosong untuk `Manual` |
| Status Sumber | Status catatan di balik transaksi: top up/pembayaran → `Menunggu`/`Lunas`/`Kedaluwarsa`/`Gagal`; withdraw → `Menunggu`/`Disetujui`/`Ditolak` |
| No. Referensi Order, No. Waybill, Ekspedisi | Order terkait, untuk Pembayaran Order dan Pendapatan COD (kosong untuk yang lain). Waybill adalah kondisi order saat file dibuat |
| External ID | Identitas invoice di Xendit (top up dan pembayaran) |
| ID | Id transaksi wallet |

**Jenis Transaksi**

| Nilai di file | `transaction_type` | Arah | Efek pada saldo |
|---|---|---|---|
| Top Up Saldo | `topup` | Masuk | menambah |
| Pendapatan COD | `cod_income` | Masuk | menambah |
| Pembayaran Order | `payment` | Keluar | mengurangi |
| Penarikan Dana (Withdraw) | `withdraw` | Keluar | mengurangi |

**Saldo Sebelum / Sesudah kosong** untuk: transaksi lama (dibuat sebelum pencatatan saldo diberlakukan), dan transaksi yang tidak mengubah saldo (`Menunggu`, `Gagal`, withdraw yang ditolak). Ini sama dengan yang tampil "—" di kolom Saldo Akhir pada layar (`docs/be-fe/update-wallet-summary-dan-saldo-akhir.md`).

### Sheet 2 — "Dashboard"

Angka jadi (bukan rumus): Total Transaksi; **Saldo Saat Ini** (saat file dibuat), Total Uang Masuk dan Total Uang Keluar (hanya yang Berhasil); tabel per Jenis Transaksi dan per Status (jumlah, nominal, dan nominal berhasil).

Total di dashboard mengikuti **filter export**, kecuali Saldo Saat Ini yang selalu saldo akun sekarang.

### Sheet 3 — "Info Export"

Akun pemilik, filter yang dipakai (termasuk kata pencarian), waktu dibuat, total transaksi, penjelasan kolom, serta peringatan **file berisi data keuangan, jangan dibagikan tanpa pengamanan**.

Teks bebas (keterangan) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus.

---

## 3. Hal yang perlu diketahui

- Data yang diambil adalah data akun **yang menjalankan job**, dievaluasi saat file dibuat. Tidak ada cara meminta wallet akun lain lewat export ini, bahkan oleh admin.
- Top Up dan Pembayaran Order di sini dilihat dari sisi mutasi saldo. Top up lewat Xendit yang belum dibayar, atau pembayaran order langsung lewat Xendit (tanpa saldo), **tidak** muncul di sini karena tidak menyentuh saldo wallet; keduanya ada di export Semua Transaksi (admin).
- Withdraw yang masih menunggu persetujuan tampil sebagai `Menunggu` dan belum mengurangi saldo.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `wallet-history` di `config/exports.php`.
- **Tidak ada permission atau seeder baru**; memakai `wallet.view`.
- Tidak ada perubahan pada endpoint atau response API wallet.
