# Samakan label export dengan nama menu di FE

**Tanggal**: 2026-09-25
**Prioritas**: rendah (kosmetik, tidak ada yang rusak)

## Latar belakang

Nama menu di sidebar FE sudah diubah, sehingga label export yang tampil di halaman **Download Report** (`type_label`) dan nama file tidak lagi sama dengan nama menu tempat tombol Export berada.

| Tipe export (`type`) | Menu / halaman FE (baru) | `type_label` sekarang di BE | Usul |
|---|---|---|---|
| `payment-history` | **Laporan Pembayaran Paket** (`/dashboard/laporan/laporan-pembayaran-paket`) | `Laporan Mutasi Saldo` | `Laporan Pembayaran Paket` |
| `transactions` | **Laporan Semua Pembayaran** (`/dashboard/laporan/laporan-semua-pembayaran`) | `Laporan Mutasi Saldo Semua` | `Laporan Semua Pembayaran` |

## Yang diminta

1. Ubah `type_label` di `config/exports.php` untuk dua tipe di atas.
2. Awalan nama file (`laporan-mutasi-saldo…`, `laporan-mutasi-saldo-semua…`) dan judul sheet ikut disesuaikan bila mudah: `laporan-pembayaran-paket…` dan `laporan-semua-pembayaran…`.
3. `type` (`payment-history`, `transactions`) dan izin (`payments.view`, `exports.transactions`) **jangan diubah**; FE memakainya sebagai kunci.

## Catatan

- FE tidak bergantung pada `type_label` untuk logika apa pun, hanya menampilkannya di daftar Download Report. Jadi perubahan ini aman dilakukan kapan saja, dan file lama yang sudah dibuat tetap bisa diunduh.
