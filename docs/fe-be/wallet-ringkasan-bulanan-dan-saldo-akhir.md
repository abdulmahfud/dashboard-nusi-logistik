# Dokumentasi FE → BE — Ringkasan Wallet Bulanan & `balance_after` di Riwayat Transaksi

**Status**: permintaan dari FE, belum diimplementasikan. Terkait redesain halaman **Dompet & Saldo** (`/dashboard/wallet`) yang menampilkan kartu **Ringkasan Dompet** dan tabel **Transaksi Terakhir** (5 baris).

---

## 1. Latar belakang

Halaman Dompet sekarang punya dua bagian yang datanya belum bisa dipenuhi dari API yang ada:

1. **Kartu "Ringkasan Dompet"** — rencana isinya:
   - **Total Saldo** = saldo saat ini (sudah ada: `GET /admin/wallet/balance`)
   - **Total Top-up bulan ini**
   - **Total Penggunaan bulan ini**
   - **Transaksi Terakhir** (tanggal-jam)
2. **Tabel "Transaksi Terakhir"** dengan kolom **Saldo Akhir** per baris.

Total bulanan **tidak bisa dihitung di FE** dengan benar: `GET /admin/wallet/transactions` hanya menerima `page` & `per_page` (paginator, tanpa filter tanggal/tipe/status). Untuk menjumlah satu bulan FE harus menarik semua halaman satu per satu — lambat, boros request, dan hasilnya bisa salah kalau ada transaksi baru masuk di tengah penarikan halaman.

---

## 2. Permintaan A — field `balance_after` pada item transaksi

**Endpoint**: `GET /admin/wallet/transactions` (dan `GET /admin/wallet/transactions/all`).

FE membaca `balance_after` (dan `balance_before`) dari tiap item, tetapi **kolom "Saldo Akhir" di tabel tampil kosong** — kami tidak menemukan dokumentasi field item transaksi di `docs/be-fe/`, jadi nama field yang FE pakai adalah tebakan.

**Mohon BE:**

1. Sertakan di **setiap item** response:
   ```json
   {
     "id": 123,
     "type": "topup",
     "amount": 100000,
     "balance_before": 154019,
     "balance_after": 254019,
     "status": "success",
     "description": "Top-up saldo via Xendit",
     "reference_no": "TOPUP-...",
     "created_at": "2026-07-16T14:30:22+07:00"
   }
   ```
2. Jika nama field di BE berbeda, mohon lampirkan **contoh 1 item response asli** supaya FE menyesuaikan nama.
3. **Pertanyaan**: untuk transaksi berstatus `pending`/`failed`/`expired` (saldo belum/tidak berubah), `balance_after` diisi apa — `null`, atau saldo saat transaksi dibuat? FE akan menampilkan "—" untuk `null`.

---

## 3. Permintaan B — endpoint ringkasan bulanan

**Usulan**: `GET /admin/wallet/summary` — permission `wallet.view` (sama seperti riwayat pribadi).

**Query (opsional)**: `month=YYYY-MM` (default: bulan berjalan). Dengan parameter ini FE nanti bisa menambah pemilih bulan tanpa perubahan BE.

**Response yang diusulkan**:

```json
{
  "success": true,
  "data": {
    "period": { "month": "2026-07", "from": "2026-07-01", "to": "2026-07-31" },
    "balance": 254019,
    "total_topup": 1250000,
    "total_usage": 995981,
    "total_withdraw": 0,
    "transactions_count": 18,
    "last_transaction_at": "2026-07-16T14:30:22+07:00"
  }
}
```

`balance` dan `last_transaction_at` ikut dikirim supaya kartu ringkasan cukup **1 request** (tidak perlu memanggil `/wallet/balance` dan riwayat terpisah).

### Hal yang perlu BE tentukan/konfirmasi

1. **Arti "1 bulan"** — FE mengusulkan **bulan kalender** (tanggal 1 s.d. akhir bulan, zona **Asia/Jakarta**), bukan "30 hari terakhir", supaya angkanya cocok dengan laporan mutasi bulanan. Setuju?
2. **Status yang dihitung** — FE mengusulkan hanya transaksi **berhasil** (`success`). `pending`/`failed`/`expired` tidak dihitung. Setuju? Mohon sebutkan nilai status "berhasil" yang dipakai BE.
3. **Tipe yang dihitung**:
   - `total_topup` = tipe `topup` (apakah `cod_income` ikut? FE condong **tidak**, karena itu pemasukan COD, bukan top-up oleh user).
   - `total_usage` = tipe `payment` (pembayaran order via saldo).
   - `total_withdraw` = tipe `withdraw`, **dipisah** dari `total_usage` supaya FE bisa memutuskan cara menampilkannya.
   - Bagaimana dengan refund/pengembalian saldo bila ada tipe lain — dihitung ke mana?
4. **Nilai `total_usage`/`total_withdraw`** — dikirim sebagai angka **positif** (FE yang menambahkan tanda −)? FE usul: ya, positif.
5. **`last_transaction_at`** — dari transaksi berstatus apa saja, atau hanya yang berhasil? FE usul: semua status (sama seperti baris teratas di riwayat).

### Alternatif (jika BE tidak ingin membuat endpoint baru)

Tambahkan filter pada `GET /admin/wallet/transactions`: `date_from`, `date_to`, `type`, `status`, **ditambah** objek `summary` (jumlah `amount` per tipe untuk rentang & filter yang sama) pada response. FE lebih suka endpoint terpisah di atas karena lebih ringan, tapi alternatif ini juga cukup.

---

## 4. Rencana FE setelah BE menyediakan

- Kartu **Ringkasan Dompet**: Total Saldo (`balance`), Total Top-up & Total Penggunaan bulan ini, Transaksi Terakhir (`last_transaction_at`). Label periode (mis. "Juli 2026") ditampilkan di header kartu.
- Tabel **Transaksi Terakhir**: kolom **Saldo Akhir** membaca `balance_after` (yang sudah disiapkan di FE — tidak perlu perubahan lagi bila nama field sama).
- Sebelum endpoint siap, kartu hanya menampilkan Total Saldo dan Transaksi Terakhir; Total Top-up/Penggunaan **tidak** ditampilkan (bukan angka perkiraan).
