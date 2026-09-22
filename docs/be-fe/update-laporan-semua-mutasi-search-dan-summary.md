# Update: Cari Email/Nama & Kartu Ringkasan di `GET /admin/payments/all`

**Status**: sudah deploy ke production (2026-09-22). Menjawab `docs/fe-be/laporan-semua-mutasi-search-email-dan-summary.md`.

---

## 1. Parameter `search` sekarang juga mencocokkan user

`search` (string, opsional, sudah ada sebelumnya) sekarang **juga** mencocokkan (`LIKE %value%`, case-insensitive tergantung collation DB) nama dan email pemilik pembayaran, selain field yang sudah dicek sebelumnya:

- `reference_no`
- `external_id`
- `invoice_id`
- `payment_method`
- `payment_channel`
- **`user.name`** (baru)
- **`user.email`** (baru)

Tidak ada perubahan nama parameter atau cara memanggilnya — `GET /admin/payments/all?search=budi@example.com` sekarang akan menemukan semua pembayaran milik user dengan email itu, sama seperti sebelumnya sudah bisa mencari lewat `reference_no`.

---

## 2. Objek `summary` baru pada response

`GET /admin/payments/all` sekarang mengembalikan `summary` di level teratas, sejajar dengan `data`:

```jsonc
{
  "success": true,
  "message": "Daftar transaksi pembayaran semua user",
  "data": { /* paginator seperti biasa - tidak berubah */ },
  "summary": {
    "total": 161,
    "total_amount": 1245678900,
    "by_status": {
      "pending": { "count": 2, "total_amount": 20000 },
      "paid": { "count": 158, "total_amount": 1245638900 },
      "expired": { "count": 0, "total_amount": 0 },
      "failed": { "count": 1, "total_amount": 20000 }
    }
  }
}
```

**Perilaku scoping** (sesuai yang diminta):
- `summary` dihitung dari **semua filter aktif** (`user_id`, `payment_method`, `payment_channel`, `reference_no`, `external_id`, `invoice_id`, `search`, `date_from`, `date_to`, `amount_min`, `amount_max`) **kecuali `status`** — jadi breakdown `by_status` selalu lengkap (menampilkan count di setiap status) walau admin sedang menyaring tabel ke satu status tertentu.
- Kalau tidak ada filter apapun dikirim, `summary` otomatis jadi ringkasan **all-time** — ini nilai default yang dipakai kartu saat halaman pertama dibuka.
- `by_status` selalu berisi keempat key (`pending`, `paid`, `expired`, `failed`) meski count-nya `0` — aman untuk langsung di-destructure tanpa optional chaining tambahan per key.

Pola dan bentuk `summary` ini **sama persis** dengan yang sudah ada di `GET /admin/payments/history` (satu-satunya beda: endpoint ini tidak menyertakan `by_payment_method`, karena tidak diminta — kalau nanti dibutuhkan juga di halaman ini, beri tahu saja, tinggal disamakan).

---

## 3. Tidak ada perubahan lain

Shape `data` (paginator), parameter filter lain, dan endpoint-endpoint payment lainnya tidak berubah. Tidak ada migration, tidak ada permission baru.
