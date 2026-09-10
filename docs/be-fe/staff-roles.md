# Dokumentasi FE — Role Staff Baru

Penambahan 4 role staff baru: **Finance**, **Sales**, **Operations**, **Customer Service** — mengacu ke `docs/flow-prd/staff/Flow Management Staff.pdf`, tapi **hanya bagian penambahan role & permission-nya saja**. Role **Viewer** sengaja tidak dibuat (sesuai instruksi).

**Yang belum dibangun** (bagian lain dari dokumen tersebut, di luar scope saat ini): field staff tambahan (Employee ID, Jabatan, Department, Branch/Area), alur approval penambahan staff, invitation via email, status lifecycle akun (`INVITED`/`PENDING_ACTIVATION`/`SUSPENDED`/`DEACTIVATED`), dan scope akses per company/branch. Saat ini staff baru **langsung dibuat aktif** oleh superadmin lewat endpoint user yang sudah ada, sama seperti user biasa — cuma beda role-nya.

---

## 1. Role yang tersedia sekarang

| Role (`name` di sistem) | Fungsi |
|---|---|
| `superadmin` | Kelola seluruh sistem (sudah ada) |
| `admin` | Kelola data & operasional (sudah ada) |
| `user` | Reseller/customer (sudah ada) |
| `finance` | **Baru** — billing, invoice, payment, piutang (AR) |
| `sales` | **Baru** — customer & account management |
| `operations` | **Baru** — shipment & operasional |
| `customer-service` | **Baru** — dukungan customer & pelacakan kiriman |

Role baru ini **whitelist permission spesifik** (bukan pola "semua kecuali delete" seperti `admin`) — masing-masing cuma dapat permission yang relevan dengan fungsinya.

---

## 2. Cara assign role ke staff

**Tidak ada endpoint baru** — pakai endpoint user yang sudah ada, field `roles` (array):

```
POST /admin/users        (buat user baru)
PUT  /admin/users/{id}   (update user existing)
```

Body:
```json
{
  "name": "Budi Finance",
  "email": "budi.finance@bhisakirim.com",
  "password": "...",
  "roles": ["finance"]
}
```

**Penting**: field `roles` **hanya diproses kalau yang melakukan request adalah `superadmin`**. Kalau bukan superadmin yang assign, field `roles` diabaikan dan user otomatis dapat role `user` (default). Jadi UI "assign role staff" ini **hanya boleh ditampilkan ke superadmin**.

Filter list user berdasarkan role: `GET /admin/users?role=finance` (atau `?role_name=finance`).

Response user (`UserResource`/list) menyertakan field `roles` — array nama role yang dimiliki user tersebut, contoh: `"roles": ["finance"]`.

---

## 3. Detail permission per role

### Finance
_Billing, invoice, payment, AR (accounts receivable)_

| Permission | Untuk apa |
|---|---|
| `kerja-sama.accounts.view` | Lihat akun kerja sama |
| `kerja-sama.accounts.manage-credit` | Ubah limit kredit akun kerja sama |
| `kerja-sama.invoices.view` | Lihat invoice kerja sama |
| `kerja-sama.invoices.generate` | Generate invoice |
| `kerja-sama.invoices.manage` | Tandai invoice issued, dsb |
| `payments.view`, `payments.view_all` | Lihat data pembayaran (milik sendiri/semua) |
| `payments.cancel` | Batalkan pembayaran |
| `wallet.view`, `wallet.transactions.view_all` | Rekonsiliasi transaksi wallet |
| `bank-accounts.index`, `.show`, `.approve`, `.reject`, `.view_all` | Verifikasi rekening bank customer |
| `withdraws.index`, `.show`, `.update` | Proses pengajuan withdraw |
| `discounts.view` | Lihat tarif diskon aktif (untuk kalkulasi revenue) |

**Catatan**: Finance **tidak** punya `kerja-sama.invoices.delete` (hanya superadmin) dan **tidak** punya `kerja-sama.accounts.suspend` (itu keputusan admin/sales, bukan murni finance).

### Sales
_Customer & account management_

| Permission | Untuk apa |
|---|---|
| `users.index`, `.store`, `.show`, `.update` | Kelola akun customer (bukan staff — tidak bisa assign role karena bukan superadmin) |
| `kerja-sama.accounts.view`, `.create`, `.update` | Onboarding akun kerja sama baru (personal/corporate) |
| `shipper.*`, `receiver.*` (index/store/show/update) | Kelola buku alamat pengirim/penerima customer |
| `discounts.view` | Lihat tarif diskon untuk keperluan penawaran ke customer |

**Catatan**: Sales **tidak** punya `kerja-sama.accounts.manage-credit`/`.suspend` (itu wewenang finance/admin) dan **tidak** punya `users.destroy`.

### Operations
_Shipment & operational management_

| Permission | Untuk apa |
|---|---|
| `orders.index`, `.show`, `.update`, `.create` | Lihat/update/buat ulang order |
| `expedition.orders.list`, `.view`, `.check_status`, `.cancel` | Kelola order ekspedisi |
| `expedition.pickup.request` | Ajukan pickup |
| `expedition.tracking.view`, `.trackingjnt.view` | Lacak status kiriman |
| `expedition.shipment_cost.calculate` | Cek ongkir |
| `expedition.settings.view` | Lihat pengaturan vendor (read-only) |

**Catatan**: Operations **tidak** punya `expedition.settings.update` (ubah konfigurasi vendor tetap admin/superadmin) dan **tidak** punya `orders.destroy`.

### Customer Service
_Customer & shipment support_

| Permission | Untuk apa |
|---|---|
| `support.tickets.view`, `.create`, `.reply`, `.manage` | Kelola tiket dukungan |
| `users.index`, `.show` | Cari data customer (read-only) |
| `orders.index`, `.show` | Cari data order (read-only) |
| `expedition.orders.list`, `.view`, `.check_status` | Cek status order untuk bantu customer |
| `expedition.tracking.view`, `.trackingjnt.view` | Lacak kiriman untuk customer |
| `feedbacks.index` | Lihat feedback |

**Catatan**: Customer Service ini **murni read-only** untuk data order/customer — tidak bisa mengubah order, pembayaran, atau kredit. Kalau customer butuh perubahan data, CS mengarahkan ke role terkait (operations/finance/sales).

---

## 4. Ringkasan untuk gating UI

Kalau FE mau menyembunyikan menu tertentu berdasarkan role/permission staff yang login, cek `roles`/permission list user seperti pola yang sudah ada di sistem ini. Beberapa contoh gating yang masuk akal:

- Menu "Kelola Staff / Assign Role" → **hanya `superadmin`**.
- Menu "Kerja Sama (Invoice/Kredit)" → `finance`, `admin`, `superadmin`.
- Menu "Onboarding Customer/Kerja Sama" → `sales`, `admin`, `superadmin`.
- Menu "Order & Tracking (kelola)" → `operations`, `admin`, `superadmin`.
- Menu "Order & Tracking (lihat saja)" → tambahkan `customer-service` (read-only).
- Menu "Support Tickets" → `customer-service`, `admin`, `superadmin`.

`admin` dan `superadmin` tetap punya akses ke hampir semua hal seperti sebelumnya (tidak berubah oleh penambahan role ini).
