# Update FE — Deteksi Tipe Akun Lewat `/me`

Update ini menjawab kebutuhan yang muncul setelah fitur Agen/Corporate: FE butuh cara untuk tahu tipe akun user yang sedang login (personal/corporate/agen) supaya bisa mengatur UI (sembunyikan opsi bayar Xendit untuk agen, tampilkan info limit kredit untuk corporate, dst — lihat [akun-agen.md](akun-agen.md) §2 dan [kerja-sama-akun-invoice.md](kerja-sama-akun-invoice.md)). Sebelumnya **tidak ada endpoint yang mengembalikan ini sama sekali** — baik `/me` maupun response login cuma mengembalikan `name`/`email`/`whatsapp`/`email_verified_at`.

## Apa yang berubah

**`GET /admin/me`** (endpoint yang sudah ada, permission `users.index`) sekarang mengembalikan field tambahan:

```json
{
  "success": true,
  "message": "Authenticated User",
  "data": {
    "id": 20,
    "name": "PT Contoh Sejahtera",
    "email": "finance@contoh.co.id",
    "whatsapp": "081234567890",
    "email_verified_at": "2026-01-01T00:00:00.000000Z",
    "account_type": "corporate",
    "billing_mode": "postpaid",
    "roles": ["user"],
    "permissions": ["expedition.orders.create", "..."],
    "credit": {
      "credit_limit": "5000000.00",
      "max_outstanding": null,
      "outstanding_balance": 1250000,
      "kerja_sama_is_active": true
    }
  }
}
```

- **`account_type`** — `"personal"` | `"corporate"` | `"agen"`. Ini field utama yang dipakai untuk logic UI.
- **`billing_mode`** — `"prepaid"` | `"postpaid"`. Berguna untuk kasus edge: akun `personal` yang kebetulan diaktifkan postpaid lewat `kerja-sama/accounts` (lihat catatan di `kerja-sama-akun-invoice.md` §5) tetap `account_type = "personal"` tapi `billing_mode = "postpaid"`.
- **Blok `credit`** — **hanya muncul kalau `account_type === "corporate"`**. Sama isinya dengan yang ditampilkan di `GET /admin/kerja-sama/accounts/{user}`, jadi FE tidak perlu panggil endpoint terpisah cuma untuk menampilkan sisa limit di header/dashboard.

Field lama (`id`, `name`, `email`, `whatsapp`, `email_verified_at`, `roles`, `permissions`) **tidak berubah**.

## Yang perlu dilakukan FE

- Setelah login, panggil `GET /admin/me` dan simpan `account_type` di state aplikasi (mis. auth context/store).
- Kalau `account_type === "agen"` → sembunyikan/nonaktifkan pilihan bayar Xendit di halaman checkout, cuma tampilkan opsi bayar via saldo wallet.
- Kalau `account_type === "corporate"` → tampilkan info `credit.outstanding_balance` / `credit.credit_limit` kalau relevan di UI, dan jangan tampilkan tombol "bayar sekarang" untuk order yang gagal dibuat karena limit tidak cukup (lihat `kerja-sama-akun-invoice.md` §4 — order langsung ditolak, tidak ada lagi opsi bayar manual).
- `account_type === "personal"` — perilaku default, tidak ada pembatasan tambahan.

## Catatan

**Response login (`POST /login`) belum diubah** — masih cuma `name`/`email`/`email_verified_at`, tidak termasuk `account_type`. Kalau FE butuh `account_type` segera setelah login tanpa request tambahan, beri tahu — saat ini asumsinya FE memanggil `/me` terpisah setelah login berhasil (pola yang sudah umum dipakai untuk ambil detail user).
