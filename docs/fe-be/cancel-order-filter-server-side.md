# Dokumentasi FE → BE — Filter di Server untuk Halaman Cancel Order (`/dashboard/paket/cancel-order`)

**Status**: permintaan **optimasi** dari FE — belum diimplementasikan. Halaman tetap berjalan tanpa ini; ini hanya untuk mengurangi data yang diunduh.

---

## 1. Cara halaman bekerja sekarang

Halaman menampilkan order yang **bisa dibatalkan**: status `proses_pengiriman` **dan** punya `awb_no`. Desain baru menambah filter **rentang tanggal**, **vendor**, **service type**, plus pencarian `reference_no` / `awb_no`.

Karena `GET /admin/list-orders` berpaginasi (default per halaman kecil), FE sekarang:

1. memanggil `GET /admin/list-orders?status=proses_pengiriman&page=N&per_page=100` **berulang sampai `meta.last_page`** (maks. 30 halaman),
2. membuang di FE order yang `awb_no`-nya kosong,
3. **menyaring** pencarian, vendor, service type, dan tanggal di FE, lalu memberi pagination sendiri.

Ini benar (tidak ada order terlewat) tetapi **mengunduh semua order `proses_pengiriman`** tiap halaman dibuka/di-refresh. Untuk akun dengan ribuan paket dalam perjalanan ini boros.

*Catatan terkait*: `docs/be-fe/update-list-orders-payment-amount-status-filter.md` menyebut endpoint ini sudah berpaginasi sejak awal. Halaman lain (Laporan Pengiriman) masih memanggilnya tanpa `page` sehingga mungkin hanya menampilkan halaman pertama — itu di luar cakupan dokumen ini.

---

## 2. Permintaan (semua opsional, boleh bertahap)

Pada `GET /admin/list-orders`, mohon dukung query tambahan, boleh digabung dengan `status`, `page`, `per_page`:

| Query | Keterangan |
|---|---|
| `has_awb` | `1` = hanya order yang `awb_no`-nya terisi (bukan `null`/kosong). Menggantikan penyaringan AWB di FE. |
| `search` | Cari parsial, tidak peka huruf besar/kecil, pada `reference_no` **dan** `awb_no`. |
| `vendor` | Kode vendor persis (mis. `JNTEXPRESS`), sama dengan yang dipakai di pengaturan ekspedisi. |
| `service_type_code` | Nilai `service_type_code` persis (mis. `reguler`, `cod`). |
| `start_date`, `end_date` | Sudah ada; mohon konfirmasi berlaku pada `created_at` order, inklusif, zona Asia/Jakarta. |

### Pertanyaan

1. **Batas maksimum `per_page`** pada endpoint ini berapa? FE meminta 100; kalau BE membatasi lebih kecil, FE tetap benar (mengikuti `meta.last_page`) tetapi jumlah request bertambah.
2. Untuk mengisi pilihan **vendor** dan **service type** di filter, FE sekarang mengambilnya dari data yang sudah diunduh. Kalau nanti filter dipindah ke server, apakah ada endpoint daftar nilai `service_type_code` yang valid, atau FE cukup memakai daftar tetap?

---

## 3. Rencana FE setelah BE menyediakan

- Ganti pengambilan semua halaman dengan **satu halaman per permintaan** (`status=proses_pengiriman&has_awb=1&page=&per_page=` + filter di atas), dan pakai `meta` untuk pagination.
- Hapus penyaringan AWB/pencarian/vendor/service type/tanggal di FE.
