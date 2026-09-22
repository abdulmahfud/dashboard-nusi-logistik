# Update: Scoping Data per Role di `GET /admin/order-statistics` & `GET /admin/list-orders`

**Status**: sudah deploy ke production (2026-09-22). Menjawab `docs/fe-be/order-statistics-dan-list-orders-scoping-per-role.md`.

---

## Jawaban singkat

1. **Ya, scoping berdasarkan token sudah ada dan sudah berjalan sejak fitur ini dibuat** — bukan bug baru, dan bukan kebocoran data ke customer biasa. `GET /admin/order-statistics`, `GET /admin/list-orders`, dan `GET /admin/monthly-summary` semuanya men-scope ke `user_id` yang login untuk role `user` (personal/corporate/agen).
2. **Permission-nya sekarang bernama `orders.view_all`** (baru ditambahkan) — dimiliki `superadmin`, `admin`, `operations`, `customer-service`. Detail lengkap di §2 bawah, mengikuti pola resource lain (payments/wallet/bank-accounts) yang FE minta.
3. Tidak berlaku (sudah ada scoping, bukan kondisi "semua token melihat semua data").

---

## 1. Yang sebenarnya kami temukan & perbaiki

Saat investigasi jawaban ini, ditemukan **bug nyata**: sebelum perbaikan ini, pengecekan "lihat semua order" di ketiga endpoint tadi memakai `hasRole('superadmin')` secara langsung — **bukan** permission. Akibatnya:

- `operations` dan `customer-service` — dua role yang secara eksplisit sudah diberi permission `orders.index`/`.show` justru **tidak** benar-benar bisa melihat order customer manapun kecuali kebetulan `user_id` order itu sama dengan akun staff-nya sendiri (yang notabene tidak pernah membuat order). Dashboard Operations/CS untuk order akan **kosong**, bukan menampilkan seluruh order platform seperti seharusnya fungsi mereka.
- `admin` (non-superadmin) kena hal yang sama.

Ini **bukan kebocoran data** (arahnya terbalik — staff yang seharusnya bisa lihat malah tidak bisa), tapi tetap bug fungsional yang menghambat kerja Operations/CS. Sudah diperbaiki dengan menambahkan permission `orders.view_all` dan mengassign-nya ke role yang seharusnya memang bisa melihat semua order.

---

## 2. Permission `orders.view_all` per role

| Role | Punya `orders.view_all`? | Cakupan data order |
|---|---|---|
| `superadmin` | Ya | Semua order di platform |
| `admin` | Ya | Semua order di platform |
| `operations` | Ya (baru) | Semua order di platform |
| `customer-service` | Ya (baru) | Semua order di platform |
| `user` (personal/corporate/agen) | Tidak | Hanya order miliknya sendiri |
| `finance`, `sales` | Tidak (tidak punya `orders.index` sama sekali) | Tidak bisa akses endpoint ini |

Ini melengkapi tabel permission per role yang sudah ada di `docs/be-fe/staff-roles.md` (§3 Operations, §3 Customer Service) — `orders.view_all` ditambahkan ke permission list kedua role tersebut di sana juga.

---

## 3. Untuk FE

- **Tidak perlu menyembunyikan kartu ringkasan Beranda dari customer biasa** — scoping sudah benar sejak awal, customer personal/corporate/agen hanya pernah melihat data miliknya sendiri.
- Kalau FE ingin menampilkan label "Semua akun" vs "Akun Anda" di kartu ringkasan berdasarkan siapa yang login, pakai `hasPermission("orders.view_all")` (bukan cek role langsung), supaya konsisten kalau suatu saat role lain juga diberi permission ini.
- **Belum ada perubahan pada shape response** ketiga endpoint — tidak ada field baru untuk dikonsumsi FE, ini murni perbaikan otorisasi di sisi BE.
- Response body item `Order`/`OrderResource` juga tidak berubah.
