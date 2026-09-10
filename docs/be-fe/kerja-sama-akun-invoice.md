# Dokumentasi FE — Akun Kerja Sama (Postpaid / Pembayaran Bulanan)

Fitur baru: tipe akun ketiga selain **prepaid** (bayar via wallet/Xendit sebelum diproses) dan **COD** (uang ditagih ke penerima saat kirim). Akun kerja sama langsung diproses ke vendor **tanpa bayar di muka**, lalu ditagih belakangan lewat invoice bulanan berdasarkan limit kredit yang disepakati admin.

**Tidak ada alur pengajuan/verifikasi mandiri untuk customer.** Admin yang membuat akun kerja sama secara langsung dari dashboard, dengan data & limit yang sudah disepakati di luar sistem (offline). Tidak ada status "pending"/"ditolak" — begitu admin submit, akun langsung aktif.

Semua endpoint di bawah ini ada di bawah prefix `admin` (`/api/admin/...`), butuh header `Authorization: Bearer <token>` seperti endpoint admin lain, dan masing-masing dijaga permission (lihat tabel).

---

## 1. Konsep dasar

Field-field ini baru ditambahkan ke data User (customer/reseller):

| Field | Tipe | Keterangan |
|---|---|---|
| `account_type` | `"personal"` \| `"corporate"` | Default `"personal"` untuk semua akun lama. Bisa diubah lewat endpoint update. |
| `billing_mode` | `"prepaid"` \| `"postpaid"` | Default `"prepaid"`. Berubah jadi `"postpaid"` begitu admin mengaktifkan akun kerja sama. **Field inilah yang menentukan apakah order-nya lewat jalur kredit atau tidak** — terpisah dari `account_type`. |
| `credit_limit` | number | Batas kredit bulanan (rupiah). |
| `max_outstanding` | number \| null | Batas outstanding maksimum (opsional, kalau kosong pakai `credit_limit`). |
| `billing_due_day` | integer (1-31) | Tanggal jatuh tempo tetap tiap bulan, default **25**. Bukan dihitung dari tanggal kiriman — invoice yang digenerate jatuh tempo di tanggal ini (bulan berjalan kalau belum lewat, bulan depan kalau sudah lewat). Kalau tanggalnya lebih besar dari jumlah hari di bulan tersebut (mis. 31 di bulan Februari), otomatis dipakaikan hari terakhir bulan itu. |
| `kerja_sama_is_active` | boolean | Flag aktif/nonaktif (suspend). Kalau `false`, order baru **ditolak** (lihat §4). |
| `company_name`, `company_legality_no`, `npwp`, `pic_name`, `pic_ktp_no` | string \| null | Khusus `account_type = corporate`. |
| `ktp_no` | string \| null | Khusus `account_type = personal`. |
| `billing_address`, `billing_phone`, `billing_email`, `billing_bank_name`, `billing_bank_account_name`, `billing_bank_account_no` | string \| null | Data penagihan, berlaku untuk kedua tipe akun. |
| `pic_penagihan_name`, `pic_penagihan_phone` | string \| null | Kontak penagihan. |

**Outstanding balance** (piutang berjalan) **tidak** disimpan sebagai kolom statis — selalu dihitung real-time dari ledger transaksi, jadi selalu akurat. Diambil lewat endpoint `show`/`ledger` di bawah, field `outstanding_balance`.

---

## 2. Endpoint: Kelola Akun Kerja Sama

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| GET | `/admin/kerja-sama/accounts` | `kerja-sama.accounts.view` | List akun kerja sama (paginated) |
| POST | `/admin/kerja-sama/accounts` | `kerja-sama.accounts.create` | Aktifkan akun kerja sama untuk user yang sudah ada |
| GET | `/admin/kerja-sama/accounts/{user}` | `kerja-sama.accounts.view` | Detail akun + outstanding balance |
| PUT | `/admin/kerja-sama/accounts/{user}` | `kerja-sama.accounts.update` | Update data profil/legalitas/bank, termasuk ganti `account_type` |
| PATCH | `/admin/kerja-sama/accounts/{user}/credit-limit` | `kerja-sama.accounts.manage-credit` | Ubah limit kredit |
| PATCH | `/admin/kerja-sama/accounts/{user}/toggle-active` | `kerja-sama.accounts.suspend` | Suspend / aktifkan kembali |
| GET | `/admin/kerja-sama/accounts/{user}/ledger` | `kerja-sama.accounts.view` | Riwayat transaksi kredit (paginated) |
| POST | `/admin/kerja-sama/accounts/{user}/payments` | `kerja-sama.accounts.manage-credit` | Catat pembayaran manual (mengurangi outstanding) |

`{user}` = ID user (integer).

### GET `/admin/kerja-sama/accounts`

Query params opsional: `account_type` (`personal`/`corporate`), `kerja_sama_is_active` (`0`/`1`), `search` (cari di name/email/company_name), `per_page`.

Response `200`:
```json
{
  "status": "success",
  "data": {
    "current_page": 1,
    "data": [ { "id": 12, "name": "...", "account_type": "corporate", "billing_mode": "postpaid", "credit_limit": "5000000.00", "kerja_sama_is_active": true, "...": "..." } ],
    "total": 3,
    "per_page": 15
  }
}
```
Hanya user dengan `billing_mode = postpaid` yang muncul di list ini.

### POST `/admin/kerja-sama/accounts`

Body:
```json
{
  "user_id": 12,
  "account_type": "corporate",
  "company_name": "PT Contoh Sejahtera",
  "company_legality_no": "NIB1234567890",
  "npwp": "01.234.567.8-901.000",
  "pic_name": "Budi Santoso",
  "pic_ktp_no": "3201xxxxxxxxxxxx",
  "billing_address": "Jl. Sudirman No. 1, Jakarta",
  "billing_phone": "081234567890",
  "billing_email": "finance@contoh.co.id",
  "billing_bank_name": "BCA",
  "billing_bank_account_name": "PT Contoh Sejahtera",
  "billing_bank_account_no": "1234567890",
  "credit_limit": 5000000,
  "max_outstanding": 5000000,
  "billing_due_day": 25,
  "pic_penagihan_name": "Siti",
  "pic_penagihan_phone": "081298765432",
  "kerja_sama_notes": "Disepakati per meeting 5 Sept 2026"
}
```

Validasi:
- `user_id` **wajib**, harus user yang sudah ada.
- `account_type` **wajib**, `personal` atau `corporate`.
- Kalau `account_type = corporate` → `company_name` dan `pic_name` **wajib**.
- Kalau `account_type = personal` → `ktp_no` **wajib**.
- `credit_limit` **wajib**, angka ≥ 0.
- Field lain opsional.

Setelah sukses, otomatis: `billing_mode = postpaid`, `kerja_sama_is_active = true`, `kerja_sama_activated_at = sekarang`. Kalau `billing_due_day` tidak diisi, default 25.

Response `201` — object User lengkap dengan field baru. Response `422` kalau validasi gagal, format standar Laravel (`errors: { field: [...] }`).

### GET `/admin/kerja-sama/accounts/{user}`

Response `200`:
```json
{
  "status": "success",
  "data": {
    "id": 12,
    "name": "...",
    "account_type": "corporate",
    "billing_mode": "postpaid",
    "credit_limit": "5000000.00",
    "kerja_sama_is_active": true,
    "outstanding_balance": 1250000,
    "...": "field User lainnya"
  }
}
```

### PUT `/admin/kerja-sama/accounts/{user}`

Body: subset field profil (semua opsional) — `account_type`, `company_name`, `company_legality_no`, `npwp`, `pic_name`, `pic_ktp_no`, `ktp_no`, `billing_address`, `billing_phone`, `billing_email`, `billing_bank_name`, `billing_bank_account_name`, `billing_bank_account_no`, `pic_penagihan_name`, `pic_penagihan_phone`, `kerja_sama_notes`.

**Ini juga endpoint untuk upgrade personal → corporate** (atau sebaliknya): kirim `account_type: "corporate"` beserta field corporate yang relevan.

Endpoint ini **tidak** mengubah `credit_limit`/`billing_mode`/`kerja_sama_is_active` — pakai endpoint khusus di bawah untuk itu.

### PATCH `/admin/kerja-sama/accounts/{user}/credit-limit`

Body:
```json
{ "credit_limit": 7500000, "max_outstanding": 7500000, "billing_due_day": 25 }
```
`credit_limit` wajib. Response `200` berisi `credit_limit`, `max_outstanding`, `billing_due_day`, `outstanding_balance` terbaru.

### PATCH `/admin/kerja-sama/accounts/{user}/toggle-active`

Tidak butuh body untuk mengaktifkan kembali. Untuk suspend, boleh kirim alasan:
```json
{ "reason": "Tagihan belum lunas > 30 hari" }
```
Endpoint ini **toggle** — sekali panggil akan membalik status saat ini (aktif→nonaktif atau sebaliknya). Response:
```json
{ "status": "success", "message": "Account suspended", "data": { "kerja_sama_is_active": false, "suspended_at": "2026-09-09T10:00:00Z", "suspended_reason": "Tagihan belum lunas > 30 hari" } }
```

**Efek suspend**: order baru dari akun ini akan ditolak (lihat §4) sampai diaktifkan kembali. Order yang sudah berjalan tidak terpengaruh.

### GET `/admin/kerja-sama/accounts/{user}/ledger`

Query: `type` (`charge`/`adjustment`/`payment`/`write_off`), `status` (`pending`/`confirmed`/`invoiced`/`voided`), `per_page`.

Response:
```json
{
  "status": "success",
  "data": { "current_page": 1, "data": [ { "id": 1, "order_id": 45, "type": "charge", "amount": "150000.00", "status": "confirmed", "description": "Ongkir order REF... via IDEXPRESS", "created_at": "..." } ] },
  "outstanding_balance": 1250000
}
```
Catatan tanda nilai `amount`: `charge` positif (menambah utang), `payment`/`write_off` negatif (mengurangi utang). `status`:
- `pending` — order baru dibuat, belum sampai tujuan.
- `confirmed` — order sudah delivered, nilai final.
- `invoiced` — sudah masuk ke satu invoice (masih terhitung outstanding sampai dibayar).
- `voided` — order dibatalkan, tidak dihitung.

### POST `/admin/kerja-sama/accounts/{user}/payments`

Untuk mencatat pembayaran manual (transfer dari customer di luar sistem).

Body:
```json
{ "amount": 1250000, "description": "Transfer BCA 9 Sept 2026", "kerja_sama_invoice_id": 3 }
```
`amount` wajib (> 0). `kerja_sama_invoice_id` opsional — kalau diisi, invoice terkait otomatis di-update status-nya (`paid`/`partially_paid`).

Response `201` — berisi `transaction` dan `outstanding_balance` terbaru.

---

## 3. Endpoint: Invoice Kerja Sama

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| GET | `/admin/kerja-sama/invoices` | `kerja-sama.invoices.view` | List invoice |
| POST | `/admin/kerja-sama/invoices/generate` | `kerja-sama.invoices.generate` | Generate invoice baru dari transaksi yang belum ditagih |
| GET | `/admin/kerja-sama/invoices/{id}` | `kerja-sama.invoices.view` | Detail invoice |
| PATCH | `/admin/kerja-sama/invoices/{id}/issue` | `kerja-sama.invoices.manage` | Tandai draft → issued |
| GET | `/admin/kerja-sama/invoices/{id}/download` | `kerja-sama.invoices.view` | Download file PDF |
| DELETE | `/admin/kerja-sama/invoices/{id}` | `kerja-sama.invoices.delete` | Hapus invoice (**hanya status draft**) |

### POST `/admin/kerja-sama/invoices/generate`

Body:
```json
{ "user_id": 12, "period_start": "2026-08-01", "period_end": "2026-08-31" }
```
`user_id` wajib. `period_start`/`period_end` opsional — hanya label administratif untuk ditampilkan di invoice, **bukan** filter tanggal order (semua charge yang statusnya `confirmed` dan belum pernah ter-invoice otomatis diikutkan, apa pun tanggalnya).

Kalau tidak ada charge yang bisa ditagih → response `422`:
```json
{ "status": "error", "message": "No uninvoiced confirmed charges found for this account." }
```

Response `201` sukses:
```json
{
  "status": "success",
  "message": "Invoice generated successfully",
  "data": {
    "id": 3,
    "invoice_no": "INV-KS-260909-1234",
    "status": "draft",
    "period_start": "2026-08-01",
    "period_end": "2026-08-31",
    "due_date": "2026-09-15",
    "subtotal": "1250000.00",
    "surcharge_total": "0.00",
    "discount_total": "0.00",
    "tax_total": "0.00",
    "grand_total": "1250000.00",
    "paid_amount": "0.00",
    "line_items": [
      {
        "order_id": 45,
        "reference_no": "REF260901123456",
        "awb_no": "IDE700xxxxxxxx",
        "vendor": "IDEXPRESS",
        "shipment_date": "2026-08-16",
        "sender_name": "Toko ABC",
        "receiver_name": "Budi",
        "weight": 1.2,
        "service_code": "REGULER",
        "ongkir": 150000,
        "surcharge": 0,
        "discount": 0,
        "tax": 0,
        "total": 150000
      }
    ],
    "pdf_path": "invoices/kerja-sama/INV-KS-260909-1234.pdf"
  }
}
```
`due_date` adalah **satu tanggal tetap untuk seluruh invoice** (bukan per-item) — kemunculan `billing_due_day` berikutnya dari akun ini, dihitung saat invoice digenerate: kalau tanggal itu belum lewat bulan ini, jatuh tempo bulan ini; kalau sudah lewat, jatuh tempo bulan depan. Contoh: `billing_due_day = 25`, invoice digenerate tanggal 9 Sept → `due_date = 2026-09-25`. Kalau digenerate tanggal 26 Sept → `due_date = 2026-10-25`.

Setelah generate, semua transaksi yang ikut ter-invoice otomatis berubah status jadi `invoiced` (tetap terhitung sebagai outstanding sampai dibayar).

### PATCH `/admin/kerja-sama/invoices/{id}/issue`

Tandai invoice sudah dikirim ke customer. Hanya bisa untuk invoice `status = draft`. Setelah ini, status jadi `issued`.

### GET `/admin/kerja-sama/invoices/{id}/download`

Response: file PDF langsung (`Content-Type: application/pdf`), bukan JSON. Nama file: `{invoice_no}.pdf`. **v1 tidak ada pengiriman email otomatis** — admin download lalu kirim manual ke customer.

### DELETE `/admin/kerja-sama/invoices/{id}`

Hanya untuk invoice `status = draft` (kalau sudah `issued`/`paid` akan ditolak `422`, karena sudah jadi dokumen resmi). Transaksi yang ter-link ke invoice ini akan dikembalikan ke status `confirmed` (bisa di-generate ulang ke invoice baru).

### Status invoice

| Status | Arti |
|---|---|
| `draft` | Baru digenerate, belum dikirim |
| `issued` | Sudah ditandai terkirim ke customer |
| `partially_paid` | Ada pembayaran masuk tapi belum lunas |
| `paid` | Lunas |
| `overdue` | Sudah lewat `due_date`, belum lunas |
| `void` | Dibatalkan |

---

## 4. Dampak ke alur Create Order yang sudah ada

**Tidak ada perubahan payload dari FE.** Endpoint `POST /admin/expedition/{vendor}/order` yang sudah ada tetap sama persis — sistem otomatis mendeteksi kalau user yang login adalah akun kerja sama dengan sisa limit cukup, lalu memprosesnya langsung ke vendor tanpa menunggu pembayaran (persis seperti alur COD yang sudah ada).

Dua hal yang berubah di **response**:

1. **Field `billing_mode` baru** muncul di `data` pada response create-order — nilainya `"cod"`, `"postpaid"`, atau `"prepaid"`. Field `is_cod`/`requires_payment` tetap ada dan berperilaku sama seperti sebelumnya (tidak breaking).

2. **Response baru: `403` kalau akun kerja sama sedang di-suspend**:
```json
{ "success": false, "message": "Akun kerja sama Anda sedang nonaktif. Silakan hubungi admin." }
```
Ini muncul di endpoint create-order manapun (semua vendor), sebelum order sempat dibuat sama sekali.

**Kalau limit kredit tidak cukup**: order tetap dibuat, tapi statusnya `menunggu_pembayaran` — sama persis seperti alur prepaid biasa (customer bisa bayar manual untuk order itu, atau admin naikkan limitnya).

---

## 5. Diskon per tipe akun (personal/corporate)

Endpoint diskon ekspedisi (`/admin/expedition-discounts`, **sudah ada sebelum fitur kerja sama**, bukan endpoint baru) sekarang bisa membedakan tarif diskon berdasarkan `account_type` customer (personal/corporate) — sebelumnya field ini ada di skema tapi tidak pernah benar-benar dipakai oleh sistem.

Field yang relevan di endpoint ini: `user_type` — nilai `"personal"`, `"corporate"`, atau **kosong/`null`** (kosong = berlaku untuk semua tipe akun).

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/expedition-discounts` | `discounts.view` |
| POST | `/admin/expedition-discounts` | `discounts.create` |
| GET | `/admin/expedition-discounts/{id}` | `discounts.view` |
| PUT | `/admin/expedition-discounts/{id}` | `discounts.update` |
| DELETE | `/admin/expedition-discounts/{id}` | `discounts.delete` |
| PATCH | `/admin/expedition-discounts/{id}/toggle-status` | `discounts.update` |
| GET | `/admin/expedition-discounts/available` | `discounts.view` |
| GET | `/admin/expedition-discounts/statistics` | `discounts.view` |

Contoh membuat 2 baris diskon berbeda untuk vendor yang sama — satu untuk personal, satu untuk corporate:

```json
// Diskon untuk customer personal
{ "vendor": "IDEXPRESS", "user_type": "personal", "discount_type": "fixed_amount", "discount_value": 1000, "is_active": true }

// Diskon untuk customer corporate (rate berbeda)
{ "vendor": "IDEXPRESS", "user_type": "corporate", "discount_type": "fixed_amount", "discount_value": 5000, "is_active": true }
```

Sistem otomatis memilih baris yang sesuai `account_type` customer yang login saat menghitung ongkir/membuat order — tidak perlu FE kirim parameter tambahan apa pun, ini murni logic server-side.

Kombinasi `(vendor, service_type, user_type, discount_type)` harus unik — tidak bisa ada 2 baris diskon aktif dengan kombinasi persis sama.

**Batasan saat ini**: `user_type` hanya membedakan **personal vs corporate** (identitas legal akun), **belum** membedakan **prepaid vs postpaid (kerja sama)**. Artinya customer personal biasa (prepaid) dan customer personal yang akun kerja sama (postpaid) saat ini mendapat tarif diskon yang sama, selama `account_type`-nya sama-sama `personal`. Kalau ke depannya dibutuhkan tarif diskon khusus untuk akun kerja sama yang berbeda dari personal/corporate prepaid biasa, itu perlu pengembangan tambahan (belum dibangun).

---

## 6. Permission untuk gating UI

Kalau FE ingin menyembunyikan/menampilkan menu berdasarkan hak akses, permission berikut relevan (cek lewat data role/permission user yang login, sama seperti pola permission lain di sistem ini):

- `kerja-sama.accounts.view` / `.create` / `.update` / `.manage-credit` / `.suspend`
- `kerja-sama.invoices.view` / `.generate` / `.manage` / `.delete`
- `discounts.view` / `.create` / `.update` / `.delete` (untuk kelola diskon per `account_type`, §5)

`superadmin` otomatis punya semua. `admin` punya semua **kecuali** `kerja-sama.invoices.delete` (hanya superadmin yang boleh hapus invoice).
