# Dokumentasi FE → BE — Pembayaran Paket Jadi Halaman "Review Sebelum Proses ke Ekspedisi"

**Status**: permintaan/pertanyaan dari FE, belum diimplementasikan. Terkait redesain halaman **Pembayaran Paket** (`/dashboard/paket/pembayaran-paket`).

---

## 1. Tujuan baru halaman ini

Sebelumnya halaman ini cuma untuk akun **Personal** non-COD: daftar order `menunggu_pembayaran`, dipilih beberapa (bulk), lalu dibayar (wallet/Xendit).

**Tujuan barunya** (dikonfirmasi user): halaman ini jadi tempat **memeriksa ulang paket yang sudah dibuat di `/dashboard/paket/paket-reguler` sebelum diproses ke ekspedisi** — berlaku untuk **kedua tipe akun**, bukan cuma Personal:

- **Personal**: review order yang menunggu pembayaran, pilih beberapa, lalu **bayar** (wallet atau Xendit, sesuai pilihan — ini sudah ada).
- **Corporate (kerja sama)**: review order yang baru dibuat, pilih beberapa, lalu **proses ke ekspedisi** dengan ongkir dibebankan ke limit kredit akun — **ini belum ada** di sistem sekarang.

Dua "status" yang ditampilkan di UI (dua tombol/tab di atas daftar):

| Tab FE | Arti | Status order (per `OrderStatusFilter` yang sudah ada) |
|---|---|---|
| **Belum Diproses** | Order yang masih perlu ditinjau user sebelum dikirim ke ekspedisi (belum dibayar untuk Personal, belum "diproses" untuk Corporate) | `menunggu_pembayaran` (Personal) |
| **Sudah Dibayar** | Order yang sudah lolos tahap ini dan siap/sedang dikirim ke ekspedisi | `belum_proses` |

---

## 2. Yang sudah berjalan (tidak perlu perubahan BE)

- `GET /admin/list-orders?status=menunggu_pembayaran` — daftar order Personal yang menunggu pembayaran. Sudah dipakai FE.
- `GET /admin/list-orders?status=belum_proses` — menurut `docs/be-fe/update-list-orders-payment-amount-status-filter.md`, ini adalah nilai `status` yang valid. FE akan memakainya untuk tab **"Sudah Dibayar"**.
- `POST /admin/payments/create` (bulk, lewat `shipping_data.vendor = "bulk_payment"`) — FE asumsikan setelah pembayaran sukses, status order Personal berubah dari `menunggu_pembayaran` menjadi `belum_proses` (ini konsisten dengan contoh di `CalculationResults.tsx` yang menampilkan "Status: Belum Diproses" setelah order COD dibuat, dan dengan daftar status di atas). **Mohon konfirmasi** ini benar, supaya tab "Sudah Dibayar" FE langsung berisi order yang baru saja dibayar tanpa delay.

---

## 3. Yang belum ada — butuh BE: alur review untuk Corporate

Menurut `docs/be-fe/kerja-sama-akun-invoice.md` §4: order akun kerja sama (Corporate) **langsung diproses ke vendor saat dibuat** (`POST /admin/expedition/{vendor}/order`) — "persis seperti alur COD", tidak menunggu apa pun. Tidak ada jeda untuk user meninjau ulang sebelum order benar-benar terkirim ke ekspedisi dan kreditnya kepotong.

**Yang diminta FE**: Corporate butuh jeda yang sama seperti Personal — order dibuat dulu dalam status "belum diproses" (bisa ditinjau, bisa dibatalkan kalau salah), baru setelah user menekan tombol **bulk "Proses ke Ekspedisi"** di halaman ini, order itu benar-benar dikirim ke vendor dan limit kreditnya terpakai.

### Pertanyaan untuk BE

1. **Bisakah order Corporate dibuat tanpa langsung diproses ke vendor?** Kalau ya, status apa yang dipakai untuk kondisi "sudah dibuat FE, belum dikirim ke vendor, belum kena limit kredit" — reuse `menunggu_pembayaran` (walau Corporate tidak benar-benar "membayar"), atau perlu status baru (mis. `menunggu_proses`)? FE mengikuti apa pun yang BE sediakan, tidak memaksakan nama status tertentu.
2. **Endpoint bulk untuk commit order Corporate** — analog dengan bulk payment Personal (`POST /admin/payments/create` dengan `vendor: "bulk_payment"`), apakah ada/akan ada endpoint serupa untuk Corporate yang menerima daftar `order_id`, lalu untuk tiap order: memotong limit kredit dan mengirim ke vendor (membuat AWB)? Atau FE memanggil endpoint proses **per order** satu-satu dalam sebuah loop (kalau begitu, endpoint mana)?
3. Kalau limit kredit **tidak cukup** untuk sebagian order yang dipilih dalam satu batch — apakah BE memproses yang cukup dan menolak sisanya (partial success), atau menolak semuanya? FE perlu tahu bentuk response-nya untuk menampilkan hasil per order.
4. Order Corporate yang gagal diproses (mis. limit habis) — tetap di status "belum diproses" supaya user bisa coba lagi nanti setelah top up/pelunasan, atau dibatalkan otomatis?
5. Setelah order Corporate berhasil diproses, status akhirnya jadi apa — `belum_proses` juga (sama seperti Personal setelah bayar), atau langsung lompat ke `belum_di_expedisi`/`proses_pengiriman` karena vendor-nya sudah dipanggil saat itu juga?

---

## 4. Rencana FE setelah dikonfirmasi

- Tab **"Belum Diproses"** menampilkan gabungan: order Personal `menunggu_pembayaran` (tombol bulk "Bayar") **dan** order Corporate yang berstatus "belum diproses" menurut jawaban BE (tombol bulk "Proses ke Ekspedisi", bukan "Bayar" — sesuai `account_type` user yang login).
- Tab **"Sudah Dibayar"** menampilkan order berstatus `belum_proses` untuk kedua tipe akun.
- Metode "pembayaran" pada bulk action jadi mengikuti tipe akun: Personal pilih Wallet/Xendit seperti alur kirim paket reguler yang sudah ada; Corporate tidak ada pilihan metode (otomatis lewat limit kredit).

## 5. Sudah dikerjakan FE sekarang (tanpa menunggu BE)

Karena baru Personal yang didukung backend saat ini, redesain halaman yang sudah jalan:

- Dua tab di atas daftar: **Belum Diproses** (status `menunggu_pembayaran`, alur bulk-bayar yang sudah ada, tidak diubah) dan **Sudah Dibayar** (status `belum_proses`, daftar baca-saja untuk sekarang).
- Untuk user **Corporate**, kedua tab ini kemungkinan selalu kosong (order mereka tidak pernah transit lewat `menunggu_pembayaran`) — FE menampilkan catatan penjelas di halaman ini untuk akun Corporate, bukan membiarkan tampilan kosong tanpa konteks, sambil menunggu konfirmasi §3 di atas.
