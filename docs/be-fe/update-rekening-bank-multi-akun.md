# Update: Rekening Bank Multi-Akun + Update/Hapus Butuh Persetujuan Admin

**Status**: sudah deploy ke production (2026-09-22). Berlaku untuk endpoint `/admin/bank-accounts/*`.

**Latar belakang**: menjawab `docs/fe-be/rekening-bank-multi-akun-dan-jadikan-utama.md`. Rencana produk: user boleh punya lebih dari satu rekening bank, tapi **setiap perubahan** — bikin baru, edit, atau hapus — tetap harus lewat persetujuan admin.

---

## 1. Yang berubah

- **Limit 1 rekening per user dihapus.** `POST /admin/bank-accounts` tidak lagi membalas `409` untuk user yang sudah punya rekening. Boleh punya banyak rekening sekaligus, masing-masing dengan status `pending`/`approved`/`rejected` sendiri-sendiri.
- **`PUT /admin/bank-accounts/{id}`** dan **`DELETE /admin/bank-accounts/{id}`** sekarang benar-benar berfungsi (sebelumnya route ini tidak ada sama sekali di BE walau sudah ada di kode FE).
- **3 endpoint baru**: `PATCH .../set-default`, `PATCH .../approve-deletion`, `PATCH .../reject-deletion`.
- **Terkait, perlu diperhatikan FE**: pembuatan permintaan withdraw (`POST /admin/withdraws` dan endpoint withdraw di `WalletController`) sekarang menolak (`422`) kalau `bank_account_id` yang dikirim belum berstatus `approved`, atau sedang menunggu persetujuan penghapusan. Sebelumnya tidak ada pengecekan ini sama sekali.

Tidak ada perubahan pada `GET /admin/bank-accounts`, `GET /admin/bank-accounts/all`, `GET /admin/bank-accounts/{id}`, `POST /admin/bank-accounts/{id}/approve`, `POST /admin/bank-accounts/{id}/reject` — perilaku dan response shape tetap sama seperti sebelumnya (ditambah field baru `deletion_requested_at`, lihat §5).

---

## 2. `PUT /admin/bank-accounts/{id}` — Edit rekening

**Permission**: pemilik rekening butuh `bank-accounts.store` (sama seperti untuk `POST` create); non-pemilik butuh `bank-accounts.approve`.

**Body** (semua field wajib, foto opsional):
```
bank_name: string, required
account_name: string, required
account_number: string, required
photo_rekening: file image, optional (re-upload, replace foto lama)
photo_ktp: file image, optional (re-upload, replace foto lama)
```

**Perilaku penting**:
- Setiap edit **selalu** mengembalikan `status` ke `pending`, `verified_at` ke `null`, dan mengosongkan `rejected_reason` — **tidak peduli status sebelumnya apa** (termasuk kalau sebelumnya `approved`). Rekening jadi butuh diverifikasi ulang admin.
- Kalau rekening yang diedit kebetulan sedang jadi rekening utama (`is_default: true`), field itu ikut di-set `false`, dan otomatis dipindahkan ke rekening `approved` lain milik user yang sama (yang paling baru diverifikasi), kalau ada. Ini karena rekening `pending` tidak boleh menyandang status default (konsisten dengan validasi `set-default`, §3).
- Ditolak dengan `422` kalau rekening sedang menunggu persetujuan penghapusan (`deletion_requested_at` terisi):
  ```json
  { "success": false, "message": "Rekening ini sedang menunggu persetujuan penghapusan, tidak bisa diubah." }
  ```

**Response sukses** (`200`):
```json
{
  "success": true,
  "message": "Rekening bank berhasil diubah, menunggu verifikasi ulang admin.",
  "data": { "id": 10, "user_id": 82, "bank_name": "...", "status": "pending", "is_default": false, "...": "..." }
}
```

---

## 3. `DELETE /admin/bank-accounts/{id}` — Ajukan hapus rekening

**Permission**: sama seperti `PUT` di atas.

**Ini BUKAN hapus langsung** — memanggil endpoint ini hanya **mengajukan permintaan hapus** (mengisi `deletion_requested_at`). Rekening tetap ada di database dan tetap muncul di listing sampai admin memproses permintaan lewat `approve-deletion` (§4).

**Perilaku**:
- Ditolak `422` kalau rekening masih dipakai di permintaan withdraw berstatus `pending`:
  ```json
  { "success": false, "message": "Rekening ini masih dipakai di permintaan penarikan yang belum diproses, tidak bisa dihapus." }
  ```
- Memanggil `DELETE` lagi saat sudah ada permintaan hapus pending sebelumnya bersifat **idempoten** — tetap membalas `200` sukses, bukan error:
  ```json
  { "success": true, "message": "Permintaan penghapusan sudah diajukan sebelumnya, menunggu persetujuan admin.", "data": { "...": "..." } }
  ```
- Sukses mengajukan (`200`):
  ```json
  { "success": true, "message": "Permintaan penghapusan rekening berhasil diajukan, menunggu persetujuan admin.", "data": { "deletion_requested_at": "2026-09-22T04:10:55.000000Z", "...": "..." } }
  ```

Selama `deletion_requested_at` terisi, `PUT` (edit) ke rekening yang sama akan ditolak `422` (lihat §2).

---

## 4. Endpoint baru untuk admin

### `PATCH /admin/bank-accounts/{id}/set-default`

**Permission**: pemilik butuh `bank-accounts.store`; non-pemilik butuh `bank-accounts.approve`.

Menjadikan satu rekening sebagai rekening utama (`is_default: true`), otomatis melepas status utama dari rekening lain milik user yang sama.

- `422` kalau rekening belum `approved`: `"Rekening harus berstatus disetujui sebelum bisa dijadikan utama."`
- `422` kalau rekening sedang menunggu persetujuan penghapusan: `"Rekening ini sedang menunggu persetujuan penghapusan."`
- Sukses (`200`): `{ "success": true, "message": "Rekening berhasil dijadikan utama.", "data": { "...": "..." } }`

### `PATCH /admin/bank-accounts/{id}/approve-deletion`

**Permission**: `bank-accounts.approve` (admin only).

Menyetujui permintaan hapus — baru di titik ini rekening **benar-benar dihapus** dari database. Kalau rekening yang dihapus adalah rekening utama, sistem otomatis memindahkan status utama ke rekening `approved` lain milik user yang sama (yang paling baru diverifikasi), kalau ada.

- `422` kalau rekening tidak sedang mengajukan penghapusan: `"Rekening ini tidak sedang mengajukan penghapusan."`
- Sukses (`200`): `{ "success": true, "message": "Rekening bank berhasil dihapus." }`

### `PATCH /admin/bank-accounts/{id}/reject-deletion`

**Permission**: `bank-accounts.reject` (admin only).

Menolak permintaan hapus — `deletion_requested_at` dikosongkan, rekening kembali normal (status/`is_default` tidak berubah).

- `422` kalau rekening tidak sedang mengajukan penghapusan.
- Sukses (`200`): `{ "success": true, "message": "Permintaan penghapusan rekening ditolak.", "data": { "...": "..." } }`

Tidak ada permission baru yang dibuat — ketiga endpoint di atas memakai ulang `bank-accounts.store`/`.approve`/`.reject` yang sudah ada.

---

## 5a. Filter baru di `GET /admin/bank-accounts/all`

Query param `pending_deletion` (boolean, opsional): `1` untuk hanya menampilkan rekening yang sedang mengajukan hapus (`deletion_requested_at` terisi), `0` untuk sebaliknya. Ditambahkan supaya admin bisa memisahkan daftar "menunggu verifikasi" (`status=pending`) dari daftar "menunggu persetujuan hapus" — dua hal yang independen satu sama lain. Detail kebutuhan menu admin yang memakai filter ini ada di `docs/be-fe/menu-admin-pengajuan-rekening-bank.md`.

## 5. Field baru di response `BankAccount`

- **`deletion_requested_at`** (`string|null`, ISO datetime): terisi kalau ada permintaan hapus yang sedang menunggu persetujuan admin. FE bisa pakai ini untuk menampilkan badge "Menunggu Persetujuan Hapus" dan menyembunyikan tombol Edit/Hapus/Jadikan Utama selama field ini terisi (backend menolak ketiganya juga, tapi lebih baik disable di UI daripada user dapat error).
- `is_default` sudah ada sebelumnya di response, sekarang benar-benar terpakai (lihat §4 dan `docs/fe-be/rekening-bank-multi-akun-dan-jadikan-utama.md` §4 poin 5 untuk kapan nilainya otomatis jadi `true`).

---

## 6. Dampak ke alur withdraw (perlu diperhatikan FE)

`POST /admin/withdraws` (dan endpoint withdraw yang sama di `WalletController`) sekarang memvalidasi rekening tujuan sebelum membuat permintaan penarikan:

- `404` kalau `bank_account_id` bukan milik user yang sedang login (atau tidak ditemukan).
- `422` kalau rekening ditemukan tapi **belum `approved`**, atau **sedang menunggu persetujuan penghapusan**:
  ```json
  { "success": false, "message": "Rekening bank ini belum disetujui atau sedang menunggu penghapusan, tidak bisa dipakai untuk penarikan." }
  ```

Ini relevan sekarang karena mengedit rekening (§2) bisa membuat rekening yang tadinya `approved` diam-diam balik ke `pending` — kalau user sempat mengajukan withdraw ke rekening itu sebelum edit selesai diverifikasi ulang, permintaan withdraw baru ke rekening yang sama akan ditolak sampai admin approve ulang. FE sebaiknya hanya menampilkan rekening berstatus `approved` (dan tanpa `deletion_requested_at`) sebagai pilihan tujuan withdraw.
