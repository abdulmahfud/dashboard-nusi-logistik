# Dokumentasi FE → BE — Kartu Ringkasan & Filter di Laporan Mutasi Saldo (`/dashboard/laporan/laporan-mutasi-saldo`)

**Status**: pertanyaan/permintaan dari FE, belum diimplementasikan. Terkait redesain halaman **Laporan Mutasi Saldo**. Tombol **Export** di desain **tidak dikerjakan** (belum ada implementasi BE) — tidak termasuk dokumen ini.

---

## 1. Kondisi sekarang

Tabel halaman ini membaca `GET /admin/payments/history?per_page=100` (riwayat **pembayaran**: `reference_no`, `amount`, `status`, `created_at`, `paid_at`/`expired_at`). Pencarian, rentang tanggal, dan status disaring **di FE**, dan hanya **100 baris pertama** yang terbaca (endpoint tidak menerima `page`).

Desain baru menambah **4 kartu ringkasan** di atas tabel:

| Kartu | Sumber di FE sekarang |
|---|---|
| Total Mutasi | `pagination.total` dari `/admin/payments/history` |
| Total Masuk | `total_topup` dari `GET /admin/wallet/summary` — **bulan berjalan** |
| Total Keluar | `total_usage` dari `GET /admin/wallet/summary` — **bulan berjalan** (ditampilkan `-Rp…`) |
| Saldo Akhir | `balance` dari `GET /admin/wallet/summary` (saldo saat ini) |

Kartu berlabel periode ("· Juli 2026") supaya tidak dikira total seumur hidup.

---

## 2. Permintaan & pertanyaan

### 2.1 Halaman ini sebenarnya menampilkan data apa?

Judulnya "Mutasi **Saldo**", tetapi tabelnya adalah riwayat **pembayaran** (termasuk yang lewat Xendit, yang tidak menggerakkan saldo wallet), sedangkan kartu Masuk/Keluar/Saldo dihitung dari **wallet**. Dua sumber data ini bisa tidak sinkron secara makna.

**Mohon BE/produk pilih arah:**

- **A.** Tabel tetap **riwayat pembayaran** dan judul/kartu disesuaikan (kartu diganti jumlah & nominal per status pembayaran), **atau**
- **B.** Tabel diganti ke **mutasi wallet** (`GET /admin/wallet/transactions`), yang sudah punya `balance_before/after`, filter `search`/`date_from`/`date_to`/`type`/`status`, dan pagination server. Konsekuensi: kolom **"Tanggal Rilis"** tidak ada padanannya di data wallet — perlu diputuskan diganti apa (mis. `updated_at`) atau dihapus.

FE condong ke **B** (sesuai nama halaman, dan semua kartu jadi konsisten), tetapi butuh konfirmasi karena mengubah isi laporan.

### 2.2 Kartu Total Masuk / Total Keluar mengikuti rentang tanggal

Sekarang kartu hanya bisa menampilkan **bulan berjalan** (`GET /admin/wallet/summary?month=YYYY-MM`). Padahal halaman punya filter rentang tanggal.

**Mohon**: `GET /admin/wallet/summary` juga menerima **`date_from` & `date_to`** (`YYYY-MM-DD`, inklusif, Asia/Jakarta) sebagai alternatif `month`, dengan `total_topup`, `total_usage`, `total_withdraw`, `total_cod_income`, `transactions_count` dihitung untuk rentang itu. `balance` tetap saldo saat ini.

### 2.3 Jika tetap memakai `/admin/payments/history` (opsi A)

Mohon dukung `page` (sekarang hanya `per_page`), plus filter `search`, `date_from`, `date_to`, `status`, dan objek ringkasan (`total`, jumlah & total nominal per status: `paid`, `pending`, `failed`/`expired`) — supaya FE tidak menarik 100 baris lalu menyaring sendiri.

---

## 3. Rencana FE setelah dikonfirmasi

- Opsi B: tabel memakai `getMyWalletTransactions` dengan filter/pagination server (pola yang sama dengan halaman Riwayat Dompet), kartu memakai `wallet/summary` dengan rentang tanggal.
- Opsi A: pagination dan filter dipindah ke server; kartu diganti ringkasan status pembayaran.
