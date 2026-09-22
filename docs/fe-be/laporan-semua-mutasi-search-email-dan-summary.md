# Dokumentasi FE → BE — Cari Email & Kartu Ringkasan di Laporan Semua Mutasi (`/dashboard/laporan/laporan-semua-mutasi`)

**Status**: permintaan dari FE, belum diimplementasikan. Endpoint terkait: `GET /admin/payments/all`.

---

## 1. Kondisi sekarang

Halaman ini membaca `GET /admin/payments/all` dengan filter `user_id`, `status`, `payment_method`, `date_from`, `date_to`, `amount_min`, `amount_max`, `reference_no`, `page`, `per_page`. Response hanya berisi `data` (baris pembayaran, termasuk `user.name`/`user.email`) dan `pagination` (`current_page`, `last_page`, `per_page`, `total`).

Desain baru (`docs/redesain/dashboard/28.png`) menambah **5 kartu ringkasan** di atas tabel: Total Transaksi, Transaksi Berhasil, Menunggu, Gagal, Total Amount — masing-masing dengan persentase/nominal, dan **tidak boleh terbatas ke halaman yang sedang tampil**. Kartu harus menampilkan **all-time** saat belum ada filter diterapkan, dan mengikuti hasil filter begitu admin menerapkan filter (tanggal, pencarian, dsb).

Admin juga ingin bisa mencari transaksi berdasarkan **email atau nama pengguna** (kolom User pada tabel menampilkan nama + email), tapi endpoint ini belum punya parameter pencarian sama sekali.

---

## 2. Permintaan

### 2.1 Parameter pencarian `search`

Mohon tambahkan **`search`** (string, opsional) pada `GET /admin/payments/all`, mencocokkan minimal **`users.email`** dan **`users.name`** (boleh sekalian `reference_no` jika mudah, tapi email/nama yang utama — `reference_no` sudah ada filter exact-nya sendiri). Partial match (`LIKE %value%`), case-insensitive.

### 2.2 Objek `summary` pada response

Mohon tambahkan **`summary`** pada response `GET /admin/payments/all`, dengan bentuk yang sama seperti yang sudah ada di `GET /admin/payments/history`:

```jsonc
{
  "summary": {
    "total": 161,
    "total_amount": 1245678900,
    "by_status": {
      "pending": { "count": 2, "total_amount": 20000 },
      "paid": { "count": 158, "total_amount": 1245638900 },
      "failed": { "count": 1, "total_amount": 20000 },
      "expired": { "count": 0, "total_amount": 0 }
    }
  }
}
```

**Penting**: `summary` dihitung dari filter yang sedang aktif (`user_id`, `payment_method`, `date_from`, `date_to`, `amount_min`, `amount_max`, `reference_no`, `search`) **TAPI mengabaikan filter `status`** — supaya breakdown per status di kartu selalu lengkap walau admin sedang menyaring salah satu status di tabel (pola ini sama persis dengan `by_status` pada `/admin/payments/history`, lihat `PaymentHistorySummary` di `src/types/payment.ts`). Saat tidak ada filter aktif sama sekali, `summary` otomatis jadi ringkasan **all-time** — ini yang dipakai kartu sebagai nilai default.

---

## 3. Rencana FE setelah dikonfirmasi

- FE sudah menyiapkan field `search` di form filter dan sudah membaca `res.summary` untuk 5 kartu (`Total Transaksi`, `Transaksi Berhasil`, `Menunggu`, `Gagal`, `Total Amount`), dengan fallback "–" selama BE belum mengirim `summary`/`search` belum berefek. Begitu dua item di atas tersedia di response, tidak ada perubahan FE lain yang diperlukan.
