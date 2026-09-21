# Update FE — Laporan Mutasi Saldo: Filter, Pagination & Ringkasan Status

Update ini menjawab permintaan di `docs/fe-be/laporan-mutasi-saldo-kartu-dan-filter.md`.

## Keputusan arah (§1 dokumen FE)

**Tabel di halaman Laporan Mutasi Saldo tetap riwayat pembayaran** (`GET /admin/payments/history`), **tidak diganti** ke mutasi wallet. Kartu ringkasan diganti jadi **ringkasan per status pembayaran**, bukan lagi Masuk/Keluar/Saldo Akhir dari `wallet/summary`.

## Apa yang berubah di `GET /admin/payments/history`

Endpoint yang sama, sekarang menerima query tambahan:

| Query | Keterangan |
|---|---|
| `search` | Cari di `reference_no`, `external_id`, `invoice_id`, `payment_method`, `payment_channel` |
| `date_from` / `date_to` | `YYYY-MM-DD`, inklusif, Asia/Jakarta. `date_to` < `date_from` → `422` |
| `status` | `pending` \| `paid` \| `expired` \| `failed`. Nilai lain → `422` |
| `page` / `per_page` | `page` sebenarnya **sudah bisa dipakai sejak awal** (paginator Laravel otomatis membaca ini) — belum pernah dicoba sebelumnya, bukan fitur baru |

Response sekarang punya blok **`summary`** baru untuk kartu ringkasan:

```json
{
  "success": true,
  "data": [ "..." ],
  "pagination": { "current_page": 1, "last_page": 3, "per_page": 15, "total": 42 },
  "summary": {
    "total": 42,
    "total_amount": 15750000,
    "by_status": {
      "pending": { "count": 5, "total_amount": 750000 },
      "paid": { "count": 30, "total_amount": 14500000 },
      "expired": { "count": 3, "total_amount": 100000 },
      "failed": { "count": 4, "total_amount": 400000 }
    }
  }
}
```

**Penting**: `summary` menghitung dari rentang `search`/`date_from`/`date_to` yang aktif, tapi **mengabaikan filter `status`** — supaya kartu ringkasan tetap menampilkan breakdown lengkap semua status walau tabel sedang difilter ke satu status/tab tertentu. `by_status` selalu ada ke-4 key-nya (termasuk yang nilainya 0), aman diakses langsung.

## Update lanjutan: `by_payment_method` — rincian saldo vs transfer vs COD

Ditambahkan setelah klarifikasi tujuan laporan ini: melihat pemakaian saldo untuk pengiriman, baik lewat **deposit (saldo wallet)** maupun **transfer langsung**, termasuk **saldo masuk dari COD**. `summary` sekarang juga punya `by_payment_method` (dihitung khusus dari pembayaran berstatus `paid`):

```json
"summary": {
  "total": 42,
  "total_amount": 15750000,
  "by_status": { "...": "seperti sebelumnya" },
  "by_payment_method": {
    "WALLET": { "count": 12, "total_amount": 2400000 },
    "COD": { "count": 8, "total_amount": 1600000 },
    "BANK_TRANSFER": { "count": 15, "total_amount": 9500000 },
    "EWALLET": { "count": 7, "total_amount": 2250000 }
  }
}
```

- **`WALLET`** — dibayar pakai saldo wallet (deposit).
- **`COD`** — saldo **masuk** dari pengiriman COD yang sudah selesai diantar (ini `Payment` row juga, sudah otomatis tercatat di laporan yang sama sejak awal — bukan tambahan baru, cuma baru bisa dibedakan lewat `by_payment_method`).
- **`BANK_TRANSFER`**, **`EWALLET`**, dst — kategori transfer langsung via Xendit, nilainya persis seperti yang Xendit laporkan (`payment_method` dari webhook Xendit, mis. `BANK_TRANSFER`/`EWALLET`/`QR_CODE`). Kalau butuh detail lebih rinci (nama bank/e-wallet spesifik, mis. "BCA"/"OVO"), baca field `payment_channel` di tiap item `data` — belum ada breakdown `by_payment_channel` di `summary`, kabari kalau perlu.
- **`UNKNOWN`** — pembayaran lama (dibuat sebelum update ini) yang sudah `paid` tapi metodenya belum sempat tercatat. Wajar ada untuk data historis, tidak akan muncul lagi untuk pembayaran baru.

Field `payment_method`/`payment_channel` di tiap item `data` (array Payment mentah) juga otomatis ikut terisi untuk pembayaran Xendit baru — sebelumnya selalu `null` untuk pembayaran non-wallet/non-COD.

## Bonus: bug validasi diperbaiki

Sebelumnya, `status` yang tidak valid malah membalas `500` generik, bukan `422`. Sudah diperbaiki (juga di `GET /admin/payments/history/all` versi admin) — sekarang membalas `422` standar Laravel dengan detail error.

## Yang perlu dilakukan FE

- Ganti 4 kartu lama (Total Mutasi/Masuk/Keluar/Saldo Akhir dari `wallet/summary`) dengan kartu berbasis `summary.by_status` — mis. "Berhasil" (`paid`), "Menunggu" (`pending`), "Gagal/Kedaluwarsa" (`failed`+`expired` digabung atau ditampilkan terpisah, sesuai desain).
- Pindahkan pencarian/filter tanggal/status dari sisi FE ke query API, hapus logic tarik-100-baris-lalu-saring.
- Tambahkan pagination bernomor memakai `pagination.current_page`/`last_page`/`total`.
- Update judul/label halaman sesuai arah "riwayat pembayaran" (bukan "mutasi saldo wallet") kalau relevan untuk kejelasan copy.
