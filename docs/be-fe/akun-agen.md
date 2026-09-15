# Dokumentasi FE — Akun Agen

Tipe akun ketiga selain `personal` dan `corporate`. Field form-nya **sama persis** dengan akun Corporate (lihat [kerja-sama-akun-invoice.md](kerja-sama-akun-invoice.md) §1) — bedanya cuma di cara bayar: **Agen tidak pernah dapat kredit/tagihan bulanan seperti Corporate.** Agen wajib **top up saldo wallet di awal**, dan order-nya **hanya bisa dibayar pakai saldo wallet** — tidak bisa sama sekali lewat payment gateway (Xendit) langsung per-order.

**Dikelola lewat endpoint terpisah dari akun Corporate** (`/admin/agen/accounts`, bukan `/admin/kerja-sama/accounts`) — karena Agen tetap `billing_mode = prepaid` selamanya, tidak relevan dengan konsep kredit/limit/invoice yang ada di endpoint kerja-sama.

---

## 1. Endpoint

Semua di bawah prefix `admin` (`/api/admin/...`), butuh `Authorization: Bearer <token>`. Response wrapper: `{status, message, data}`.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| GET | `/admin/agen/accounts` | `agen-accounts.view` | List akun agen |
| POST | `/admin/agen/accounts` | `agen-accounts.create` | Jadikan user yang sudah ada sebagai akun agen |
| GET | `/admin/agen/accounts/{user}` | `agen-accounts.view` | Detail akun |
| PUT | `/admin/agen/accounts/{user}` | `agen-accounts.update` | Update data profil bisnis |

`{user}` = ID user (integer).

**Tidak ada alur pengajuan/verifikasi mandiri untuk customer** — sama seperti akun Corporate, admin yang mengaktifkan langsung dari dashboard dengan data yang sudah disepakati offline.

### GET `/admin/agen/accounts`

Query params opsional: `search` (cari di name/email/company_name), `per_page`.

### POST `/admin/agen/accounts`

Body — field yang sama persis seperti form Corporate, **tanpa** field kredit (`credit_limit`/`max_outstanding`/`billing_due_day` tidak ada di sini sama sekali, karena tidak relevan):
```json
{
  "user_id": 12,
  "company_name": "PT Contoh Agen",
  "company_legality_no": "NIB1234567890",
  "npwp": "01.234.567.8-901.000",
  "pic_name": "Budi Santoso",
  "pic_ktp_no": "3201xxxxxxxxxxxx",
  "billing_address": "Jl. Sudirman No. 1, Jakarta",
  "billing_phone": "081234567890",
  "billing_email": "finance@contohagen.co.id",
  "billing_bank_name": "BCA",
  "billing_bank_account_name": "PT Contoh Agen",
  "billing_bank_account_no": "1234567890",
  "pic_penagihan_name": "Siti",
  "pic_penagihan_phone": "081298765432",
  "kerja_sama_notes": "Disepakati per meeting 14 Sept 2026"
}
```

Validasi:
- `user_id` **wajib**, harus user yang sudah ada.
- `company_name`, `pic_name` **wajib**.
- Field lain opsional.

Setelah sukses, otomatis: `account_type = "agen"`, `billing_mode = "prepaid"` (dipaksa, tidak bisa diubah lewat endpoint ini).

Response `201` — object User lengkap. Response `422` kalau validasi gagal.

### GET `/admin/agen/accounts/{user}`

Response `200` — object User lengkap (tidak ada field `outstanding_balance`/`credit_limit` seperti akun Corporate, karena tidak relevan).

### PUT `/admin/agen/accounts/{user}`

Body: subset field profil di atas (semua opsional, kirim yang mau diubah saja). Tidak bisa mengubah `account_type`/`billing_mode` lewat endpoint ini.

---

## 2. Aturan pembayaran: wallet-only

**Akun agen tidak bisa membayar order lewat payment gateway (Xendit) sama sekali** — cuma lewat saldo wallet. Kalau FE mengirim `POST /admin/payments/create` dengan `payment_method` selain `"wallet"` (termasuk kalau field ini tidak dikirim sama sekali, karena default-nya `"xendit"`) untuk user agen, responsnya:

```json
{ "success": false, "message": "Akun agen hanya bisa membayar menggunakan saldo wallet." }
```
HTTP `422`.

**Konsekuensi untuk FE**: kalau user yang login `account_type === "agen"`, sembunyikan/nonaktifkan pilihan metode bayar Xendit di halaman checkout — cuma tampilkan opsi bayar via saldo wallet. Kalau saldo tidak cukup, arahkan user ke alur top-up (lihat §3), bukan ke Xendit checkout.

Aturan ini **tidak mempengaruhi COD** — COD tetap berlaku normal untuk akun agen (bukan "pembayaran manual", kurir yang mengumpulkan uang saat kirim).

---

## 3. Top up saldo (tidak ada perubahan)

**Endpoint top-up wallet yang sudah ada dipakai apa adanya** — tidak ada endpoint baru khusus agen. `POST /admin/wallet/topup` tetap sama untuk semua tipe akun, tetap lewat Xendit (top-up ke saldo memang boleh lewat Xendit — yang dilarang cuma bayar order langsung per-order lewat Xendit, bukan top-up saldonya). Setelah saldo terisi, order dibayar dari saldo itu via `payment_method: "wallet"` di §2.

---

## 4. Diskon & flat ongkir

Diskon pengiriman sekarang bisa di-scope khusus `user_type = "agen"` — lihat [diskon-pengiriman.md](diskon-pengiriman.md) §1a. Flat ongkir tetap berlaku sama rata untuk semua tipe akun (tidak dibedakan per `account_type`).

---

## 5. Laporan aktivitas pengiriman

Akun agen dapat laporan aktivitas pengiriman yang sama seperti akun personal (total pengiriman, total ongkir, breakdown per vendor per periode) — **tidak ada** tracking limit kredit seperti akun corporate, karena agen memang tidak punya limit kredit. Lihat [laporan-aktivitas-pengiriman.md](laporan-aktivitas-pengiriman.md).
