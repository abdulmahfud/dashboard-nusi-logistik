# Dokumentasi FE → BE — Scoping Data per Role di `GET /admin/order-statistics` & `GET /admin/list-orders`

**Status**: pertanyaan/permintaan dari FE, belum dikonfirmasi BE. Terkait redesain halaman **Beranda** (`/dashboard`) dan **Laporan Pengiriman** (`/dashboard/laporan/laporan-pengiriman`).

---

## 1. Kondisi sekarang

Beranda menampilkan beberapa kartu ringkasan (`Ringkasan Paket COD`, `Ringkasan Paket Reguler`, `Ringkasan Paket Bermasalah`, `Ringkasan Pengiriman`, `Ringkasan Status Pengiriman`) yang seluruhnya membaca `GET /admin/order-statistics` dan/atau `GET /admin/list-orders` (lewat `getOrderStatistics`, `getOrders`, `getOrdersPage` di `src/lib/apiClient.ts`). Halaman **Laporan Pengiriman** memakai endpoint yang sama.

FE hanya mengirim filter tanggal/status/pagination ke kedua endpoint ini — **tidak ada logika scoping berdasarkan user/role di FE**. FE mengasumsikan backend men-scope response berdasarkan token yang login (admin → semua order, user personal/corporate/agen → order miliknya sendiri saja), tapi asumsi ini **belum pernah dikonfirmasi** dan tidak didokumentasikan di mana pun.

---

## 2. Kenapa ini penting

Kartu-kartu di atas dirender untuk **semua user yang login** ke Beranda, bukan hanya admin/staff. Kalau ternyata `/admin/order-statistics` dan `/admin/list-orders` mengembalikan **seluruh order di platform** tanpa memandang siapa yang login, maka:

- User personal/corporate/agen biasa bisa melihat jumlah/statistik order milik user lain — ini masalah **kebocoran data**, bukan sekadar bug tampilan.
- Sebaliknya, kalau endpoint ini salah kaprah men-scope ke "order milik sendiri" untuk SEMUA token termasuk admin, maka dashboard admin untuk memantau seluruh platform jadi tidak berfungsi sebagaimana mestinya.

Untuk resource lain yang polanya mirip (pembayaran, transaksi wallet, rekening bank), sudah ada pemisahan permission yang jelas dan terdokumentasi di `docs/be-fe/staff-roles.md`:

| Resource | Permission "lihat semua" |
|---|---|
| Payments | `payments.view`, `payments.view_all` |
| Wallet transactions | `wallet.view`, `wallet.transactions.view_all` |
| Bank accounts | `bank-accounts.index`/`.show`, `.view_all` |
| **Orders** | **tidak ada `orders.view_all`** — hanya `orders.index`, `.show`, `.update`, `.create` (role Operations) dan `orders.index`, `.show` (role Customer Service, read-only) |

Order adalah satu-satunya resource di daftar itu yang **tidak** punya varian `.view_all`, sehingga FE tidak tahu apakah pemisahan "lihat semua vs lihat milik sendiri" ini memang sengaja tidak ada (karena scoping sudah otomatis dari token) atau memang belum dibuatkan.

---

## 3. Pertanyaan untuk BE

1. **Apakah `GET /admin/order-statistics` dan `GET /admin/list-orders` (beserta `GET /admin/list-orders` versi `getOrdersPage`) sudah men-scope response berdasarkan token yang login** — admin/staff dengan permission tertentu melihat **semua** order di platform, sedangkan user personal/corporate/agen hanya melihat **order miliknya sendiri**?
2. Kalau sudah, **permission apa** yang menentukan seorang staff dianggap "lihat semua" (setara `orders.view_all`)? Mohon didokumentasikan di `docs/be-fe/staff-roles.md` seperti resource lain, supaya FE bisa memakai `hasPermission("orders.view_all")` untuk menyesuaikan copy/UI (mis. label "Ringkasan Paket Bermasalah" jadi "— seluruh platform" untuk admin, atau "— akun Anda" untuk user biasa) alih-alih diam-diam mengandalkan asumsi.
3. Kalau **belum** ada pemisahan ini sama sekali (yaitu setiap token yang berhasil auth ke endpoint tersebut mendapat **seluruh** data order di platform), mohon konfirmasi eksplisit — supaya FE tahu ini bukan bug, dan supaya kartu-kartu ringkasan di Beranda bisa disembunyikan/diberi guard khusus admin sampai scoping per-user benar-benar tersedia.

---

## 4. Rencana FE setelah dikonfirmasi

- Kalau scoping per-token sudah berjalan dan ada permission `orders.view_all` (atau setara): FE menambahkan label kecil di kartu ringkasan yang menjelaskan cakupan data ("Semua akun" vs "Akun Anda") berdasarkan `hasPermission`.
- Kalau scoping belum ada / semua token melihat semua data: FE menggeser render kartu-kartu ini (`SectionCardsCod`, `SectionCardsReguler`, `SectionCardsTrouble`, `SectionCardsShipmentSummary` di `src/app/dashboard/page.tsx`) di balik pengecekan permission admin, supaya user biasa tidak melihat data platform-wide sampai BE menambahkan scoping yang benar.
