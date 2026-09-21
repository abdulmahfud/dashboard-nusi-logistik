# Dokumentasi FE → BE — Filter & Pencarian di Riwayat Wallet Pribadi

**Status**: permintaan dari FE, belum diimplementasikan. Terkait redesain halaman **Riwayat Dompet** (`/dashboard/wallet/riwayat`).

---

## 1. Latar belakang

Desain baru halaman Riwayat Dompet punya bar filter di atas tabel:

- kotak cari **"Cari referensi / keterangan…"**
- pemilih **tanggal**
- pilihan **jenis transaksi** ("Semua Jenis Transaksi")
- tombol **Filter** dan **Muat ulang**

Saat ini `GET /admin/wallet/transactions` (riwayat pribadi, permission `wallet.view`) **hanya menerima `page` dan `per_page`**. Kalau FE memfilter di sisi klien, hasilnya hanya berlaku untuk baris di halaman yang sedang dimuat (mis. 20 dari ratusan) — menyesatkan, jadi **FE belum menampilkan bar filter itu** sampai endpoint mendukungnya.

Endpoint admin `GET /admin/wallet/transactions/all` sudah punya filter `date_from`, `date_to`, `type`, `status`, dan lainnya. FE meminta yang sejenis untuk riwayat pribadi.

---

## 2. Permintaan

Tambahkan query opsional pada `GET /admin/wallet/transactions`, nama disamakan dengan endpoint `/all`:

| Query | Keterangan |
|---|---|
| `search` | Cari di `description` **dan** nomor referensi (`source.reference_no` / `reference_no`), partial match, tidak peka huruf besar/kecil |
| `date_from` | Tanggal awal rentang, `YYYY-MM-DD`, inklusif (mulai 00:00:00), zona Asia/Jakarta |
| `date_to` | Tanggal akhir rentang, `YYYY-MM-DD`, inklusif (sampai 23:59:59) |
| `type` | `topup` \| `payment` \| `withdraw` \| `cod_income` |
| `status` | `pending` \| `success` \| `failed` (opsional; belum ada di desain, tapi sama dengan `/all`) |

**Filter tanggal berupa rentang** — pengguna memilih "dari tanggal A sampai tanggal B" (keputusan produk). Perilaku yang FE harapkan:
- Kirim keduanya → transaksi dari A 00:00:00 s.d. B 23:59:59.
- Hanya `date_from` → dari A sampai sekarang; hanya `date_to` → dari awal sampai B.
- Satu hari saja dipilih dengan `date_from = date_to`.
- Jika `date_from` > `date_to`, mohon balas 422 dengan pesan validasi yang jelas (FE juga mencegahnya di form).

Semua filter boleh digabung dan bekerja bersama `page` / `per_page`. Bentuk response **tidak berubah**: `meta.total` / `last_page` mengikuti hasil setelah filter, supaya "Total {n} entri" dan pagination ikut benar.

### Pertanyaan

1. Apakah `search` bisa mencari juga pada `source.reference_no` (nomor referensi yang muncul di kolom Referensi), bukan hanya `description`?

---

## 3. Rencana FE setelah BE menyediakan

- Tampilkan bar filter di atas tabel (cari, **rentang tanggal** dari–sampai, jenis transaksi, tombol Filter, Muat ulang) — seperti desain. Pemilih tanggal berupa satu kontrol rentang (klik tanggal awal lalu tanggal akhir).
- Mengirim query di atas ke `getMyWalletTransactions`; ganti halaman ke 1 tiap filter berubah.
- Saat ini halaman hanya menampilkan tombol **Muat ulang** di kartu tabel.
