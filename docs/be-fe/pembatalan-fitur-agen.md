# Pembatalan Fitur: Tipe Akun Agen

**Keputusan client**: tipe akun yang ada hanya **`personal`** dan **`corporate`**. Tipe akun ketiga, **Agen**, yang sebelumnya diumumkan lewat `akun-agen.md` dan beberapa dokumen lain, **dibatalkan sepenuhnya** dan sudah dihapus dari backend (2026-10-07). Dokumen ini daftar semua yang berubah — kalau FE sudah mulai mengerjakan apa pun berdasarkan dokumen Agen sebelumnya, hentikan dan ikuti dokumen ini.

---

## 1. Yang dihapus

- **`docs/be-fe/akun-agen.md` sudah dihapus.** Semua yang dijelaskan di sana — field form akun Agen, endpoint, aturan wallet-only — **tidak berlaku lagi**.
- **Endpoint `/admin/agen/accounts` (GET, POST, GET `/{user}`, PUT `/{user}`) tidak ada lagi.** Memanggilnya sekarang menghasilkan `404`.
- **Permission `agen-accounts.view`/`.create`/`.update`** sudah dihapus dari daftar permission. Kalau FE menyimpan permission list dan mengecek permission ini untuk menampilkan menu Agen, hapus pengecekan itu dan sembunyikan menunya.
- Pembayaran order **tidak lagi punya pengecekan khusus "akun agen wajib bayar lewat saldo wallet"** — aturan itu hanya berlaku untuk tipe akun yang sudah tidak ada.

## 2. Yang berubah di fitur lain (karena sebelumnya ikut menyebut Agen)

- **Diskon pengiriman** (`docs/be-fe/diskon-pengiriman.md`): field `user_type` sekarang hanya menerima `"personal"`, `"corporate"`, atau kosong. Mengirim `"agen"` sekarang ditolak `422`.
- **`/me`** (`docs/be-fe/update-deteksi-tipe-akun-me.md`): `account_type` hanya akan berisi `"personal"` atau `"corporate"`. Tidak ada lagi kasus "sembunyikan Xendit untuk agen" — hanya corporate yang disembunyikan semua opsi pembayaran manualnya (sudah ada sebelumnya, tidak berubah).
- **Laporan Aktivitas Pengiriman** (`docs/be-fe/laporan-aktivitas-pengiriman.md`) dan **Laporan Pengiriman/Ringkasan Pengiriman**: cakupan tipe akun sekarang disebut "personal/corporate" saja; perilakunya untuk kedua tipe itu tidak berubah.
- **Semua export Excel** yang sebelumnya menyebut `Personal`/`Corporate`/`Agen` di kolom Tipe Akun (List User, Aktivitas Pengiriman, Cancel Order, Rekening Bank, Tiket Bantuan, Kritik & Saran, Permintaan Withdraw, Laporan Mutasi Saldo Semua): kolom itu sekarang hanya akan terisi `Personal` atau `Corporate`. Filter `account_type=agen` (export List User) sekarang ditolak `422`.
- **Kerja Sama (postpaid/corporate)** tetap **corporate-only**, tidak berubah oleh pembatalan ini — lihat `update-kerja-sama-corporate-only.md`. Sebelumnya dokumen itu menyebut akun Agen sebagai alternatif untuk personal yang butuh "bayar duluan"; alternatif itu sekarang **tidak ada** — personal yang butuh bayar duluan cukup pakai saldo wallet (top up biasa), tidak ada tipe akun khusus untuk itu.

## 3. Yang tidak berubah

- Alur personal, corporate, kerja sama (postpaid), diskon per vendor, flat ongkir, dan semua fitur lain yang tidak menyebut Agen — **tidak terpengaruh**.
- Upgrade personal → corporate tetap berfungsi seperti sebelumnya.

## 4. Data lama

Dua akun test di database (`usertest2@bhisakirim.test` dan satu akun lain) yang sempat diset `account_type = agen` sudah dikembalikan ke `personal` saat pembatalan ini. Tidak ada akun customer nyata yang terpengaruh — fitur ini belum pernah dipakai di luar pengujian internal.
