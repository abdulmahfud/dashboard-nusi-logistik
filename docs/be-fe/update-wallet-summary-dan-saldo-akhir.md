# Update FE — Ringkasan Wallet Bulanan & `balance_after` di Riwayat Transaksi

Update ini menjawab permintaan yang diajukan di `docs/fe-be/wallet-ringkasan-bulanan-dan-saldo-akhir.md` — dokumen ini isinya ringkasan actionable dari jawaban di sana.

## 1. Field `balance_before`/`balance_after` di riwayat transaksi

**Endpoint**: `GET /admin/wallet/transactions` dan `GET /admin/wallet/transactions/all` (tidak berubah, cuma tambahan field di tiap item).

```json
{
  "id": 123,
  "type": "topup",
  "amount": "100000.00",
  "balance_before": "154019.00",
  "balance_after": "254019.00",
  "status": "success",
  "...": "field lain tidak berubah"
}
```

- **Cuma terisi untuk transaksi baru** yang benar-benar mengubah saldo (topup, pembayaran via saldo, pemasukan COD, withdraw yang sudah disetujui admin). Transaksi lama (dibuat sebelum update ini) dan transaksi yang tidak mengubah saldo (`pending`, `failed`, withdraw `rejected`) — kedua field ini **`null`**. Tampilkan "—" untuk kasus ini di kolom "Saldo Akhir".
- **Status yang tersedia cuma `pending`, `success`, `failed`** — tidak ada `expired`.
- Field detail sumber transaksi (nomor referensi dkk) ada di dalam object `source` (`source.reference_no`, dst), **bukan** di top-level item.

## 2. Endpoint baru: `GET /admin/wallet/summary`

Permission `wallet.view` (sama seperti riwayat pribadi). Query opsional `month=YYYY-MM` (default bulan berjalan, zona Asia/Jakarta).

```json
{
  "success": true,
  "message": "Ringkasan wallet bulanan berhasil diambil",
  "data": {
    "period": { "month": "2026-07", "from": "2026-07-01", "to": "2026-07-31" },
    "balance": 254019,
    "total_topup": 1250000,
    "total_usage": 995981,
    "total_withdraw": 0,
    "total_cod_income": 0,
    "transactions_count": 18,
    "last_transaction_at": "2026-07-16T14:30:22.000000+07:00"
  }
}
```

Catatan:
- Semua `total_*` sudah dihitung dari transaksi **berstatus `success` saja**, dan sudah **positif** (FE yang menambahkan tanda − untuk `total_usage`/`total_withdraw` kalau perlu).
- `total_topup` **tidak** termasuk `cod_income` — keduanya dipisah. Field `total_cod_income` **baru**, di luar usulan awal FE, supaya datanya tidak hilang dari ringkasan.
- `last_transaction_at` **tidak dibatasi bulan** — selalu transaksi paling baru secara keseluruhan (sama seperti baris teratas riwayat), bukan "transaksi terakhir dalam bulan yang dipilih".
- `balance` = saldo saat ini (real-time), bukan saldo di akhir bulan yang dipilih.

## 3. Yang perlu dilakukan FE

- Kartu **Ringkasan Dompet**: panggil `GET /admin/wallet/summary`, baca `balance`, `total_topup`, `total_usage`, `last_transaction_at` — 1 request saja, tidak perlu gabung dengan `/wallet/balance`.
- Tabel **Transaksi Terakhir**: kolom **Saldo Akhir** baca `balance_after` dari tiap item — tampilkan "—" kalau `null`.
- Sesuaikan path field sumber transaksi ke `item.source.*` kalau FE sebelumnya membaca dari top-level.
- Kalau butuh menampilkan pemasukan COD terpisah dari top-up di kartu ringkasan, field `total_cod_income` sudah tersedia.
