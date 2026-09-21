# Update FE — `payment_amount`, Filter `status`, dan Perbaikan Pagination di `GET /admin/list-orders`

Update ini menjawab permintaan yang diajukan di `docs/fe-be/pembayaran-paket-list-order-pending.md`, terutama untuk halaman **Pembayaran Paket**.

## 1. Field `payment_amount` — hapus fallback hardcode

Setiap item di `GET /admin/list-orders` sekarang punya field top-level **`payment_amount`** — nominal yang sama persis yang akan ditagih `POST /admin/payments/create`. **Hapus perhitungan fallback Rp100.000 + 4% COD di FE** — itu bukan angka dari sistem dan berisiko salah tagih.

```json
{
  "id": 220,
  "status": "menunggu_pembayaran",
  "payment_amount": 60000,
  "...": "field lain tidak berubah"
}
```

Secara desain, field ini **selalu ada** untuk order `menunggu_pembayaran` — semua 11 vendor menulisnya sebelum order dibuat. Kalau tetap ketemu `null`, itu genuinely data yang hilang (kemungkinan kecil/anomali), bukan sinyal untuk menghitung sendiri — tampilkan sebagai kondisi tidak normal, jangan tebak angkanya.

## 2. Filter `status` — baru

```
GET /admin/list-orders?status=menunggu_pembayaran
```

Nilai valid: `menunggu_pembayaran`, `belum_proses`, `belum_di_expedisi`, `proses_pengiriman`, `kendala_pengiriman`, `sampai_tujuan`, `retur`, `dibatalkan`. Status lain → `422`.

**Tidak ada pembatasan tanggal default** untuk kombinasi apa pun dengan `status` — kirim `status=menunggu_pembayaran` tanpa `start_date`/`end_date` untuk mendapatkan **semua** order pending, kapan pun dibuat (termasuk yang sudah berbulan-bulan). Ini sudah perilaku endpoint sejak awal, bukan perubahan baru.

## 3. Pagination — sudah ada, `meta`-nya baru diperbaiki

Pagination (`page`/`per_page`) **sudah ada sejak awal** di endpoint ini — bukan fitur baru. Tapi ada bug lama: `meta.current_page`/`last_page`/`per_page`/`total` muncul sebagai array 2 elemen (mis. `"total": [7, 7]`) bukan angka biasa — sudah diperbaiki. Sekarang:

```json
{
  "data": [ "..." ],
  "links": { "first": "...", "last": "...", "prev": null, "next": "..." },
  "meta": { "current_page": 1, "last_page": 4, "per_page": 15, "total": 52, "from": 1, "to": 15 }
}
```

## Yang perlu dilakukan FE

- Hapus logic `calculatePaymentAmount` / fallback Rp100.000+4% COD, ganti baca `payment_amount` langsung.
- Kirim `status=menunggu_pembayaran` (tanpa `start_date`/`end_date` default) ke `getListOrders` untuk halaman Pembayaran Paket, hapus logic unduh-semua-lalu-saring di FE.
- Tambahkan `start_date`/`end_date` cuma kalau user memang memilih filter tanggal secara eksplisit di UI.
- Tambahkan pagination bernomor memakai `meta.current_page`/`last_page`/`total`/`per_page` — sekarang datanya sudah benar, aman dipakai langsung.
