# Dokumentasi FE — Tracking Akun Corporate yang Belum Bayar / Overdue

Fitur baru: sekarang ada proses otomatis harian yang menandai invoice kerja sama sebagai **`overdue`** kalau sudah lewat tanggal jatuh tempo dan belum dibayar. Sebelumnya status ini **tidak pernah berubah otomatis** — invoice yang telat bayar akan diam selamanya di status `issued` sampai ada pembayaran baru dicatat. Sekarang FE bisa membangun tampilan "daftar akun corporate yang belum bayar / overdue" dengan andal.

**Tidak ada endpoint baru** — pakai endpoint invoice yang sudah ada (`GET /admin/kerja-sama/invoices`), yang sekarang datanya jadi bermakna untuk kebutuhan ini.

---

## 1. Cara kerja di belakang layar

Setiap hari jam 01:00, sistem mengecek semua invoice yang statusnya bukan `draft`/`void`/`paid`, lalu:
- Kalau sudah lewat `due_date` dan belum ada pembayaran sama sekali → status jadi **`overdue`**.
- Kalau sudah lewat `due_date` tapi ada pembayaran sebagian → status jadi **`partially_paid`** (bukan overdue — prioritas tampilan tetap "sebagian sudah dibayar").
- Kalau belum lewat `due_date` → tetap `issued`.
- Invoice yang sudah lunas penuh sudah otomatis `paid` sejak pembayaran dicatat (tidak berubah oleh job ini).

**Penting — ini murni sinyal visibilitas untuk admin, TIDAK memengaruhi kemampuan akun order.** Batas order (limit kredit) dihitung real-time dari ledger transaksi, bukan dari status invoice — begitu admin mencatat pembayaran (`POST /admin/kerja-sama/accounts/{user}/payments`), limit langsung terbuka lagi saat itu juga, kapan pun itu terjadi, tidak terkait job harian ini.

---

## 2. Endpoint untuk FE

**`GET /admin/kerja-sama/invoices`** (sudah ada, permission `kerja-sama.invoices.view`)

Query params yang relevan untuk kebutuhan ini:
- `status` — filter salah satu: `draft`, `issued`, `partially_paid`, `overdue`, `paid`, `void`.
- `user_id` — opsional, kalau mau fokus ke satu akun tertentu.
- `per_page` — default 15.

### Contoh: daftar semua invoice yang overdue (belum bayar, sudah lewat jatuh tempo)

```
GET /admin/kerja-sama/invoices?status=overdue
```

Response `200`:
```json
{
  "status": "success",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 7,
        "user_id": 20,
        "invoice_no": "INV-KS-260910-1234",
        "status": "overdue",
        "grand_total": "1250000.00",
        "paid_amount": "0.00",
        "due_date": "2026-09-10",
        "issued_at": "2026-09-01T08:00:00.000000Z",
        "user": {
          "id": 20,
          "name": "Budi Santoso",
          "email": "finance@contoh.co.id",
          "company_name": "PT Contoh Sejahtera",
          "account_type": "corporate"
        }
      }
    ],
    "total": 1,
    "per_page": 15
  }
}
```

Field `user` (relasi, sudah di-include otomatis) berisi `id`, `name`, `email`, `company_name`, `account_type` — cukup untuk menampilkan tabel "akun mana yang overdue" tanpa perlu panggilan tambahan.

### Contoh: gabungan "belum lunas" (issued + partially_paid + overdue)

Kalau FE ingin satu tampilan "semua yang belum lunas" tanpa breakdown status, panggil endpoint ini 3x dengan `status` berbeda (`issued`, `partially_paid`, `overdue`) dan gabungkan di FE — **tidak ada** dukungan filter multi-status dalam satu request saat ini (`status=issued,overdue` tidak didukung).

---

## 3. Yang perlu dilakukan FE

- Buat halaman/tab "Invoice Overdue" atau "Belum Bayar" yang memanggil `GET /admin/kerja-sama/invoices?status=overdue` (dan/atau `issued`/`partially_paid` sesuai kebutuhan tampilan).
- Tampilkan `user.company_name`, `grand_total`, `paid_amount`, `due_date` per baris — cukup untuk admin tahu siapa yang perlu ditagih dan berapa sisa tagihannya.
- **Jangan gunakan status invoice ini untuk menentukan apakah akun boleh order atau tidak** — itu logic terpisah yang sudah ditangani backend sepenuhnya (lihat `kerja-sama-akun-invoice.md` §4). Status invoice di sini murni untuk tampilan/laporan penagihan.
