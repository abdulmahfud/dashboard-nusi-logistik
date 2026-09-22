# Role & Permission — Referensi Lengkap Scope Akses

Dokumen ini daftar **semua role** dan **semua permission** yang ada di backend, supaya FE tahu persis fitur/menu apa yang boleh diakses tiap jenis akun. Untuk detail cara assign role staff dan alasan bisnis di balik masing-masing role staff baru, lihat `docs/be-fe/staff-roles.md` — dokumen ini fokus ke **katalog permission lengkap**, termasuk yang dipakai role lama (`superadmin`, `admin`, `user`) yang belum pernah didaftar lengkap sebelumnya.

**Status**: akurat per 2026-09-22. Sudah termasuk perbaikan bug otorisasi yang ditemukan saat menyusun dokumen ini — lihat §4.

---

## 1. Role yang ada

| Role (`name`) | Untuk siapa |
|---|---|
| `superadmin` | Pemilik sistem — akses penuh ke semua fitur tanpa kecuali |
| `admin` | Tim internal kepercayaan — akses hampir sama seperti superadmin, **kecuali aksi hapus** (`.delete`/`.destroy`) |
| `user` | Customer/reseller (personal, corporate, agen — satu role yang sama untuk ketiga `account_type`) |
| `finance` | Staff — billing, invoice, payment, piutang (AR) |
| `sales` | Staff — onboarding & pengelolaan akun customer |
| `operations` | Staff — pengelolaan order & pengiriman |
| `customer-service` | Staff — dukungan customer, read-only ke order/customer |

Guard yang dipakai: `api` (JWT). Format nama permission: `resource.action` (kadang `resource.sub-resource.action` untuk expedition/kerja-sama).

---

## 2. Aturan umum

- **`superadmin` selalu punya SEMUA permission** yang ada di sistem, termasuk yang berakhiran `.delete`/`.destroy`. Kalau ada permission baru ditambahkan, superadmin otomatis dapat setelah `SuperadminRoleTableSeeder` di-re-run.
- **`admin` otomatis punya SEMUA permission KECUALI yang berakhiran `.delete`/`.destroy`** — bukan whitelist manual, tapi sinkron otomatis dari seluruh tabel permission (`AdminRolePermissionSeeder`). Permission baru yang bukan aksi hapus otomatis ikut ke admin setelah seeder itu di-re-run, tanpa perlu update kode.
- Role lain (`user`, `finance`, `sales`, `operations`, `customer-service`) pakai **whitelist eksplisit** — permission baru **tidak otomatis** masuk ke role ini, harus ditambahkan manual ke seeder masing-masing.
- Di tabel §3 di bawah, kolom **"Role lain"** hanya mencantumkan role **selain** `superadmin`/`admin` (karena keduanya sudah tercakup oleh 2 aturan di atas). Untuk permission yang berakhiran `.delete`/`.destroy`, kolom itu ditandai **"khusus superadmin"** kalau tidak ada role lain yang eksplisit memilikinya (ingat: admin TIDAK dapat permission jenis ini).
- Cara assign role ke user: `POST/PUT /admin/users` dengan field `roles` (array) — **hanya diproses kalau requester adalah superadmin**. Detail lengkap di `docs/be-fe/staff-roles.md` §2.

---

## 3. Katalog permission lengkap

### 3.1 RBAC — Roles & Permissions
| Permission | Deskripsi | Role lain |
|---|---|---|
| `permissions.index` | Lihat daftar permission di sistem | — |
| `roles.index` | Lihat daftar role | — |
| `roles.store` | Buat role baru | — |
| `roles.show` | Lihat detail satu role + permission-nya | — |
| `roles.update` | Ubah permission yang dimiliki suatu role | — |
| `roles.destroy` | Hapus role | khusus superadmin |

### 3.2 Users — Akun customer & staff
| Permission | Deskripsi | Role lain |
|---|---|---|
| `users.index` | Lihat daftar user | `user` (lihat daftar terbatas, endpoint sama), `sales`, `customer-service` |
| `users.store` | Buat user baru (termasuk staff — assign role staff cuma jalan kalau requester superadmin) | `sales` |
| `users.show` | Lihat detail satu user | `sales`, `customer-service` |
| `users.update` | Update data user | `sales` |
| `users.destroy` | Hapus user | khusus superadmin |

### 3.3 CMS — Posts & Categories
_Konten blog/CMS internal, tidak ada role staff yang memegangnya saat ini (hanya superadmin/admin)._

| Permission | Deskripsi | Role lain |
|---|---|---|
| `posts.index`, `.store`, `.show`, `.update` | Kelola artikel/post | — |
| `posts.destroy` | Hapus post | khusus superadmin |
| `categories.index`, `.store`, `.show`, `.update` | Kelola kategori post | — |
| `categories.destroy` | Hapus kategori | khusus superadmin |

### 3.4 Shipper & Receiver — Buku alamat pengirim/penerima
| Permission | Deskripsi | Role lain |
|---|---|---|
| `shipper.index`, `.store`, `.update` | Kelola buku alamat pengirim milik sendiri | `user` |
| `shipper.index`, `.store`, `.show`, `.update` | (sama, plus lihat detail satu alamat) | `sales` (kelola atas nama customer saat onboarding) |
| `shipper.destroy` | Hapus alamat pengirim | **belum diimplementasikan di controller** — route ada, tapi method `destroy()` di-nonaktifkan (comment-out). Jangan tampilkan tombol hapus shipper di FE dulu. |
| `receiver.*` | Sama persis polanya dengan `shipper.*` di atas | sama seperti shipper |

### 3.5 Products
| Permission | Deskripsi | Role lain |
|---|---|---|
| `products.index`, `.store`, `.show`, `.update` | Kelola produk milik sendiri | `user` |
| `products.destroy` | Hapus produk **milik sendiri** (dicek kepemilikan di controller, bukan cuma permission) | `user` |

### 3.6 Orders
| Permission | Deskripsi | Role lain |
|---|---|---|
| `orders.index` | Lihat daftar order (di-scope ke order sendiri kecuali punya `orders.view_all`) | `user`, `operations`, `customer-service` |
| `orders.create` | Buat order baru (proses ke ekspedisi) | `user`, `operations` |
| `orders.show` | Lihat detail satu order | `operations`, `customer-service` |
| `orders.update` | Update/retry order | `operations` |
| `orders.view_all` | Lihat order **semua customer**, bukan cuma milik sendiri — lihat §4.2 | `operations`, `customer-service` |

**Catatan**: `orders.store`/`orders.destroy` ada di tabel permission (dibuat otomatis lewat pola CRUD generik) tapi **tidak ada method `store()`/`destroy()` di `OrderController`** — jangan dipakai untuk gating fitur FE, endpoint-nya belum ada.

### 3.7 Bank Accounts
| Permission | Deskripsi | Role lain |
|---|---|---|
| `bank-accounts.index` | Lihat daftar rekening bank milik sendiri | `user`, `finance` |
| `bank-accounts.store` | Ajukan rekening baru / edit / hapus (request) / set-default milik sendiri — lihat `docs/be-fe/update-rekening-bank-multi-akun.md` | `user` |
| `bank-accounts.show` | Lihat detail satu rekening | `finance` |
| `bank-accounts.approve` | Setujui rekening baru, setujui penghapusan, atau ubah/hapus rekening **milik user lain** | `finance` |
| `bank-accounts.reject` | Tolak rekening baru / tolak penghapusan | `finance` |
| `bank-accounts.view_all` | Lihat rekening bank **semua user** (bukan cuma milik sendiri) | `finance` |
| `bank-accounts.update`, `.destroy` | Ada di tabel permission tapi **tidak dipakai** — endpoint update/delete rekening di-gate oleh `bank-accounts.store`/`.approve` (lihat dokumen di atas), bukan permission ini | — |

### 3.8 Withdraws — Penarikan saldo
| Permission | Deskripsi | Role lain |
|---|---|---|
| `withdraws.store` | Ajukan penarikan saldo (perlu rekening bank berstatus `approved`) | `user` |
| `withdraws.index` | Lihat daftar pengajuan withdraw | `finance` |
| `withdraws.show` | Lihat detail satu withdraw | `finance` |
| `withdraws.update` | Approve/reject withdraw | `finance` |

### 3.9 Payments
| Permission | Deskripsi | Role lain |
|---|---|---|
| `payments.create` | Buat pembayaran (checkout order) | `user` |
| `payments.view` | Lihat riwayat pembayaran milik sendiri | `user`, `finance` |
| `payments.view_all` | Lihat pembayaran **semua user** | `finance` |
| `payments.cancel` | Batalkan pembayaran pending | `user`, `finance` |

### 3.10 Wallet
| Permission | Deskripsi | Role lain |
|---|---|---|
| `wallet.view` | Lihat saldo & mutasi wallet milik sendiri | `user`, `finance` |
| `wallet.topup` | Top up saldo | `user` |
| `wallet.withdraw` | Ajukan penarikan lewat endpoint wallet (jalur kedua selain `withdraws.store`) | `user` |
| `wallet.transactions.view_all` | Lihat mutasi wallet **semua user** (rekonsiliasi) | `finance` |

### 3.11 Expedition — Operasional pengiriman/vendor
| Permission | Deskripsi | Role lain |
|---|---|---|
| `expedition.shipment_cost.calculate` | Cek ongkir | `user`, `operations` |
| `expedition.orders.create` | Kirim order ke vendor ekspedisi | `user` |
| `expedition.orders.list`, `.view`, `.check_status` | Lihat/cek status order di sisi vendor | `user`, `operations`, `customer-service` |
| `expedition.orders.cancel` | Batalkan order di vendor | `operations` |
| `expedition.pickup.request` | Ajukan pickup | `user`, `operations` |
| `expedition.tracking.view`, `.trackingjnt.view` | Lacak status kiriman | `user`, `operations`, `customer-service` |
| `expedition.settings.view` | Lihat pengaturan vendor (read-only) | `user`, `operations` |
| `expedition.settings.update` | Ubah konfigurasi vendor | — (hanya superadmin/admin) |

### 3.12 Discounts — Diskon ongkir
| Permission | Deskripsi | Role lain |
|---|---|---|
| `discounts.view` | Lihat tarif diskon aktif | `user`, `finance`, `sales` |
| `discounts.create`, `.update` | Kelola diskon | — |
| `discounts.delete` | Hapus diskon | khusus superadmin |

### 3.13 Flat Shipping Rates — Program ongkir flat
| Permission | Deskripsi | Role lain |
|---|---|---|
| `flat-shipping-rates.view` | Lihat program flat ongkir aktif | — |
| `flat-shipping-rates.create`, `.update` | Kelola program flat ongkir | — |
| `flat-shipping-rates.delete` | Hapus program | khusus superadmin |

### 3.14 Kerja Sama — Billing postpaid/corporate
| Permission | Deskripsi | Role lain |
|---|---|---|
| `kerja-sama.accounts.view` | Lihat daftar akun kerja sama | `finance`, `sales` |
| `kerja-sama.accounts.view-own` | Lihat kredit/limit akun kerja sama **milik sendiri** (self-service, controller tetap cek kepemilikan) | `user` |
| `kerja-sama.accounts.create`, `.update` | Onboarding/update akun kerja sama | `sales` |
| `kerja-sama.accounts.manage-credit` | Ubah limit kredit | `finance` |
| `kerja-sama.accounts.suspend` | Suspend akun kerja sama | — (hanya superadmin/admin) |
| `kerja-sama.invoices.view` | Lihat invoice kerja sama | `finance` |
| `kerja-sama.invoices.generate` | Generate invoice baru | `finance` |
| `kerja-sama.invoices.manage` | Tandai invoice issued/lunas, dsb | `finance` |
| `kerja-sama.invoices.delete` | Hapus invoice | khusus superadmin |

### 3.15 Agen Accounts
| Permission | Deskripsi | Role lain |
|---|---|---|
| `agen-accounts.view`, `.create`, `.update` | Kelola akun tipe agen (profil bisnis, tanpa field kredit) | — (hanya superadmin/admin saat ini) |

### 3.16 Reports — Laporan aktivitas pengiriman
| Permission | Deskripsi | Role lain |
|---|---|---|
| `reports.shipping.view` | Lihat laporan aktivitas pengiriman **user manapun** | — |
| `reports.shipping.view-own` | Lihat laporan aktivitas pengiriman **milik sendiri** (self-service) | `user` |

### 3.17 Support Tickets
| Permission | Deskripsi | Role lain |
|---|---|---|
| `support.tickets.view` | Lihat tiket dukungan | `user`, `customer-service` |
| `support.tickets.create` | Buat tiket | `user`, `customer-service` |
| `support.tickets.reply` | Balas tiket | `user`, `customer-service` |
| `support.tickets.manage` | Kelola/tutup tiket | `customer-service` |

### 3.18 Feedbacks
| Permission | Deskripsi | Role lain |
|---|---|---|
| `feedbacks.index` | Lihat daftar feedback | `customer-service` |
| `feedbacks.create` | Kirim feedback | `user` |

---

## 4. Perbaikan otorisasi yang baru dilakukan (2026-09-22)

Saat menyusun dokumen ini ditemukan dan diperbaiki dua bug otorisasi nyata:

### 4.1 `destroy` bisa diakses lewat permission lain (celah keamanan)

`Route::apiResource(...)->middleware('permission:a|b|c|d')` ternyata menerapkan **satu daftar OR yang sama ke SEMUA verb** (index/store/show/update/destroy), bukan per-verb. Akibatnya, untuk `roles`, `users`, `categories`, `posts`, `shipper`, `receiver`, `products` — request `DELETE` hanya butuh **salah satu** dari keempat permission yang terdaftar, bukan permission `.destroy` secara spesifik. Dua dampak nyata yang dikonfirmasi lewat pengujian:

- Customer biasa (role `user`, yang sengaja **tidak** diberi `shipper.destroy`/`receiver.destroy`) bisa lolos gerbang otorisasi `DELETE /admin/shipper/{id}` hanya karena punya `shipper.index`. (Untungnya method `destroy()` shipper/receiver memang belum diimplementasikan di controller, jadi tidak ada risiko kehilangan data — tapi gerbang izinnya tetap salah.)
- Role `admin` — yang **by design** tidak pernah dapat permission `.destroy` (lihat §2) — tetap bisa lolos `DELETE /admin/categories/{id}` dan `DELETE /admin/posts/{id}` karena punya `categories.index`/`.store`/`.update`, padahal kedua controller itu tidak punya pengecekan tambahan di levelnya sendiri.

**Perbaikan**: `destroy` sekarang dipisah dari grup OR tadi (pakai `middlewareFor('destroy', ...)`), jadi hanya butuh `{resource}.destroy` secara spesifik. Permission `index`/`store`/`show`/`update` tidak berubah. Sudah diverifikasi: superadmin tetap bisa hapus semua resource ini, `user` tetap bisa hapus produk miliknya sendiri (memang sengaja dapat `products.destroy`), tapi `admin` sekarang benar-benar diblokir dari hapus categories/posts/roles/users, dan `user` diblokir dari hapus shipper/receiver.

### 4.2 `orders.view_all` — staff Operations/Customer Service sebelumnya malah TIDAK bisa lihat semua order

Sudah dijelaskan detail di `docs/be-fe/update-order-statistics-list-orders-scoping.md` — ringkasnya, `GET /admin/list-orders`/`order-statistics`/`monthly-summary` sebelumnya cuma mengecek `hasRole('superadmin')` untuk akses semua order, bukan permission. `operations`/`customer-service` yang harusnya lihat semua order malah ter-scope ke order milik akun staff sendiri (kosong). Sudah diperbaiki dengan permission `orders.view_all` (lihat §3.6).

---

## 5. Untuk FE

- Pakai tabel §3 sebagai referensi utama untuk gating menu/tombol berdasarkan `hasPermission()` dari user yang login, bukan cek `role` langsung — permission lebih presisi karena satu role bisa berubah cakupannya seiring waktu (contoh: `orders.view_all` baru ditambahkan tanpa mengubah nama role).
- Untuk resource yang permission-nya "belum dipakai"/"belum diimplementasikan" (ditandai eksplisit di §3.4, §3.6, §3.7) — jangan tampilkan tombol terkait di FE dulu, endpoint-nya belum siap.
- Response `UserResource`/data user menyertakan field `roles` (array nama role) untuk keperluan gating — belum ada endpoint terpisah yang mengembalikan daftar permission langsung per user; kalau FE butuh itu, beri tahu, bisa ditambahkan ke `/me`.
