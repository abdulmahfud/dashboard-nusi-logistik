# Update: Akun Personal Butuh Rekening Bank Terverifikasi untuk Pakai COD

**Status**: sudah tersedia di backend (2026-10-08). Berlaku untuk pembuatan order COD lewat `POST /admin/expedition/{vendor}/create-order` (semua vendor, endpoint sama untuk semuanya) dan field baru di `GET /admin/me`.

**Latar belakang**: sebelum update ini, akun Personal bisa langsung memilih COD saat checkout tanpa syarat apa pun. Sekarang, **akun Personal wajib punya minimal satu rekening bank yang sudah disetujui admin** sebelum bisa membuat order COD — karena proses persetujuan rekening bank itu juga mencakup verifikasi foto KTP (lihat `menu-admin-pengajuan-rekening-bank.md`), dan dana COD pada akhirnya perlu rekening yang sudah terverifikasi untuk dikreditkan. **Akun Corporate tidak terkena aturan ini sama sekali.**

---

## 1. Apa yang berubah

### a. `POST /admin/expedition/{vendor}/create-order` — gate baru

Kalau user yang login **`account_type: "personal"`** dan order yang dibuat mengandung COD (`shipping_data.detail.cod > 0`), backend sekarang mengecek: apakah user punya **minimal satu** `BankAccount` dengan `status: "approved"` **dan** tidak sedang menunggu persetujuan penghapusan (`deletion_requested_at` kosong).

Kalau tidak punya, order **ditolak** sebelum dibuat sama sekali:

```json
{
  "success": false,
  "message": "Fitur COD membutuhkan rekening bank yang sudah diverifikasi admin (termasuk foto KTP). Tambahkan rekening bank dan tunggu persetujuan admin sebelum membuat order COD."
}
```
HTTP `422`.

Kalau rekening bank-nya masih `pending` atau `rejected`, atau satu-satunya rekening `approved` sedang menunggu penghapusan — tetap ditolak dengan pesan yang sama; harus ada **minimal satu** rekening yang benar-benar `approved` dan aktif (bukan sedang dihapus).

**Tidak berpengaruh ke**:
- Order Non-COD akun Personal — tetap seperti biasa, tidak ada syarat tambahan.
- Order apa pun milik akun Corporate (COD maupun bukan) — gate ini sama sekali tidak dicek untuk Corporate.
- Cek ongkir (`shipmentCost`) — gate ini cuma berlaku saat **membuat order**, sama seperti gate limit kredit Corporate yang sudah ada sebelumnya.

### b. `GET /admin/me` — field baru `cod_eligible`

```json
{
  "success": true,
  "data": {
    "account_type": "personal",
    "cod_eligible": false,
    "...": "field lain tidak berubah"
  }
}
```

- **`cod_eligible`** (boolean) — `true` kalau user ini (di manapun tipe akunnya) boleh membuat order COD sekarang.
  - Untuk akun **Personal**: `true` hanya kalau sudah punya rekening bank `approved` dan tidak sedang menunggu penghapusan — persis kondisi yang dicek gate di atas.
  - Untuk akun **Corporate** (dan tipe akun lain selain personal, kalau ada ke depannya): **selalu `true`** — gate ini tidak berlaku untuknya.

---

## 2. Yang perlu dilakukan FE

- **Checkout — opsi pembayaran COD untuk akun Personal**: panggil `GET /admin/me`, baca `cod_eligible`.
  - Kalau `false`, pilihan COD **jangan cuma disembunyikan/di-disable begitu saja tanpa penjelasan** — tampilkan keterangan yang jelas di dekat opsi COD (tooltip, badge "Terkunci", atau teks di bawah pilihan metode bayar), misalnya:
    > *"COD belum bisa dipakai — tambahkan rekening bank dan tunggu persetujuan admin terlebih dahulu."*
  - Keterangan itu idealnya jadi tautan/tombol langsung ke halaman Tambah Rekening Bank (`POST /admin/bank-accounts`, butuh `photo_rekening` dan `photo_ktp` — lihat `update-rekening-bank-multi-akun.md` untuk status `pending`/`approved`/`rejected` dan alur edit/hapusnya), supaya user tidak perlu mencari sendiri menunya.
  - Kalau user **sudah** punya rekening tapi masih `pending`/`rejected` (belum `approved`), bedakan pesannya kalau bisa — mis. *"Rekening bank Anda sedang menunggu persetujuan admin"* vs *"Belum ada rekening bank terdaftar"* — `cod_eligible` saja tidak membedakan dua kondisi ini (keduanya sama-sama `false`), jadi FE perlu cek status rekening dari `GET /admin/bank-accounts` sendiri kalau mau menampilkan pesan yang lebih spesifik.
- Kalau FE tetap mengirim order COD untuk user yang belum eligible (misal `cod_eligible` sempat basi di cache, atau FE memilih tidak menyembunyikan opsinya di awal), backend menolak dengan pesan 422 yang sama persis seperti di atas — tampilkan pesan itu ke user (jangan asumsikan semua `422` di endpoint ini datang dari validasi lokasi/payload, cek isi `message`-nya).
- **Tidak perlu** pengecekan tambahan untuk akun Corporate — `cod_eligible` mereka selalu `true`, tidak ada UI baru yang perlu disembunyikan untuk tipe akun ini akibat update ini.
- Kalau halaman Rekening Bank FE sudah menampilkan status `pending`/`approved`/`rejected` per rekening (sudah ada sejak `update-rekening-bank-multi-akun.md`), tidak ada perubahan tambahan di sana — status yang sama ini yang sekarang juga menentukan `cod_eligible`.

---

## 3. Data lama

Tidak ada migrasi data — ini murni pengecekan baru terhadap data `bank_accounts` yang sudah ada. Akun Personal yang sebelumnya sudah pernah membuat order COD **tetap bisa** membuat order COD baru asalkan sudah (atau akan) punya rekening bank `approved` — kalau belum, order COD baru mereka akan ditolak sampai rekeningnya disetujui admin. Order COD lama yang sudah terbuat tidak terpengaruh/tidak dibatalkan oleh aturan ini.
