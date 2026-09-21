# Update FE — Filter & Pencarian di Riwayat Wallet Pribadi

Update ini menjawab permintaan yang diajukan di `docs/fe-be/wallet-riwayat-filter.md`.

## Apa yang berubah

**`GET /admin/wallet/transactions`** (riwayat pribadi, permission `wallet.view`) sekarang menerima query filter tambahan — nama & perilaku disamakan persis dengan `GET /admin/wallet/transactions/all`:

| Query | Keterangan |
|---|---|
| `search` | Cari di `description` **dan** `reference_no` (topup & pembayaran order via saldo) — partial match, tidak peka huruf besar/kecil |
| `date_from` | `YYYY-MM-DD`, inklusif dari 00:00:00 (zona Asia/Jakarta, timezone aplikasi) |
| `date_to` | `YYYY-MM-DD`, inklusif sampai 23:59:59 |
| `type` | `topup` \| `payment` \| `withdraw` \| `cod_income` |
| `status` | `pending` \| `success` \| `failed` |

Semua filter bisa digabung, bekerja bersama `page`/`per_page`. Bentuk response **tidak berubah** — tetap paginator standar, `total`/`last_page` sudah otomatis mengikuti hasil setelah filter diterapkan.

## Jawaban pertanyaan §2

**Ya**, `search` mencari di `reference_no` juga — tapi field ini ada di dalam `source.reference_no` (bukan top-level, lihat `docs/be-fe/update-wallet-summary-dan-saldo-akhir.md` soal struktur `source`), jadi pencarian dilakukan di backend lewat relasi ke data topup/pembayaran, bukan string matching langsung ke kolom `reference_no` yang FE lihat di response. Untuk transaksi tipe `withdraw`, **tidak ada nomor referensi** di data source-nya (`source.reference_no` selalu `null` untuk withdraw) — `search` untuk baris withdraw cuma bisa match lewat `description`.

## Perilaku rentang tanggal

Sesuai permintaan:
- Kirim `date_from` + `date_to` → transaksi dari A 00:00:00 s.d. B 23:59:59.
- Hanya `date_from` → dari A sampai sekarang. Hanya `date_to` → dari awal sampai B.
- `date_from = date_to` → transaksi 1 hari itu saja.
- `date_from` > `date_to` → **`422`**:
  ```json
  { "success": false, "message": "date_to harus sama atau setelah date_from" }
  ```

## Yang perlu dilakukan FE

- Tampilkan bar filter (cari, rentang tanggal, jenis transaksi, tombol Filter, Muat ulang) sesuai rencana — endpoint sudah mendukung semuanya.
- Kirim query ke `getMyWalletTransactions`, reset ke halaman 1 tiap filter berubah.
- Tangani `422` untuk kasus `date_from` > `date_to` (FE sudah berencana mencegah ini di form juga — validasi BE ini jadi lapisan cadangan).

## Catatan

`GET /admin/wallet/transactions/all` (versi admin/semua user) **belum** punya `search` — cuma endpoint riwayat pribadi ini yang baru dapat filter pencarian, sesuai permintaan FE. Kalau nanti butuh `search` di tampilan admin juga, itu perlu ditambahkan terpisah (pola/implementasinya sama, tinggal diterapkan ke situ).
