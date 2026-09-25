# Data Export Cancel Order (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-4 dari `docs/export/export.md`.

**Khusus admin, cakupan semua akun.** Hanya user dengan izin **`exports.cancel-orders`** yang bisa membuatnya. Izin ini **baru**, dimiliki `superadmin` dan `admin`. Staff lain (`operations`, `customer-service`, `finance`, `sales`) dan customer mendapat `403`, walaupun `operations`/`customer-service` bisa melihat semua order. Tampilkan tombolnya hanya kalau `hasPermission("exports.cancel-orders")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `cancel-orders` |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **tanggal cancel** (bukan tanggal order), inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |
| `user_id` | tidak | Batasi ke satu akun. Harus id user yang ada (`422` kalau tidak) |

Tanpa filter → semua order yang dibatalkan, semua akun, semua waktu. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Cancel Order`. Nama file: `cancel-order[_akun{id}]_{start}_{end}_{waktu}.xlsx`.

Yang masuk hanya order berstatus **Dibatalkan**. Tanggal cancel diambil dari pencatatan pembatalan (sejak 2026-09-25), untuk pembatalan lama dari riwayat order.

---

## 2. Isi file: 3 sheet

### Sheet 1 — "Cancel Order" (satu baris per order dibatalkan, 29 kolom)

| Kolom | Isi |
|---|---|
| No | Nomor urut |
| No. Referensi, No. Waybill, Ekspedisi, Layanan | Identitas order. Waybill kosong bila belum sempat dapat resi |
| Nama Akun, Email Akun, Tipe Akun | Pemilik order (`Personal` / `Corporate` / `Agen`) |
| Tanggal Order, Tanggal Cancel | `YYYY-MM-DD HH:MM:SS` (WIB) |
| Lama Sebelum Cancel (jam) | Selisih Tanggal Order ke Tanggal Cancel, satu desimal |
| Sumber Cancel | `Manual` = dibatalkan lewat endpoint cancel; `Otomatis (Sistem / Ekspedisi)` = webhook ekspedisi, sinkron tracking, atau proses otomatis; `Tidak tercatat` = dibatalkan sebelum 2026-09-25 |
| PIC Cancel | Nama user yang membatalkan (Manual). `Sistem / Ekspedisi` untuk Otomatis. **Kosong untuk `Tidak tercatat`** (tidak bisa ditelusuri mundur) dan bila akun PIC sudah dihapus |
| Alasan Cancel | Keterangan pembatalan dari riwayat order (mis. `Order cancelled via JNTEXPRESS`). Alasan terstruktur belum disimpan |
| Nama Pengirim, Kota Pengirim | Data pengirim saat order dibuat |
| Nama Penerima, Kota Penerima, Provinsi Penerima | Data penerima saat order dibuat |
| Nama Barang, Kategori Barang, Jumlah Barang, Berat, Nilai Barang | Isi paket |
| COD, Nilai COD | `COD` / `NONCOD` dan nominalnya |
| Metode Pembayaran | `COD`, `Saldo Wallet`, `Kerja Sama`, atau metode pembayaran online. Kosong bila belum ada pembayaran |
| Status Pembayaran | `Sudah dibayar`, `Belum dibayar`, `Kedaluwarsa`, `Gagal`, `COD`, `Pembayaran massal`, atau `Kerja Sama (tagihan dibatalkan)`. Kosong bila tidak ada data pembayaran |
| Total Ditagihkan | Nominal yang ditagihkan untuk order (setelah diskon, termasuk asuransi). Kosong bila tidak tersimpan, atau order dalam pembayaran massal (nominalnya tidak bisa dibagi per order) |

Sheet ini punya header tebal, baris header dibekukan, dan filter. Kolom uang dan jumlah adalah angka; teks dari user ditulis sebagai teks biasa.

### Sheet 2 — "Ringkasan Cancel"

Satu baris per ekspedisi, urut dari cancel terbanyak: Total Cancel, jumlah Manual, Otomatis, Tidak Tercatat, dan Total Ditagihkan.

### Sheet 3 — "Info Export"

Periode (dengan keterangan "berdasarkan tanggal cancel"), akun, siapa yang mengekspor, waktu dibuat, total order dibatalkan, total ditagihkan, dan catatan cara membaca kolom.

---

## 3. Hal yang perlu diketahui

- **Status Pembayaran bukan status refund.** Kolom itu hanya menunjukkan apakah pembayaran order sudah masuk. Sistem **tidak mencatat pengembalian dana** di data order, dan tidak ada proses yang mengembalikan saldo secara otomatis saat order dibatalkan. Order berstatus `Sudah dibayar` di file ini adalah kandidat untuk ditinjau oleh finance.
- **PIC Cancel** baru tercatat sejak 2026-09-25. Selama ini yang boleh membatalkan lewat API hanya `superadmin`, jadi PIC untuk `Manual` adalah superadmin.
- Tidak ada perubahan pada endpoint atau response API lain.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `cancel-orders` di `config/exports.php`.
- **Permission baru `exports.cancel-orders`** (di `PermissionsTableSeeder`); otomatis ikut ke `admin` dan `superadmin` setelah seeder role dijalankan ulang (sudah dilakukan di produksi).
- Logika bersama antar export (data pengirim/penerima, kategori barang, metode pembayaran, info pembatalan) dipindahkan ke satu kelas; hasil export Laporan Pengiriman diverifikasi identik sebelum dan sesudah pemindahan.
