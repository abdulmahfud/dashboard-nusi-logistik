# Dokumentasi FE → BE — Multi Rekening & "Jadikan Utama" di Halaman Rekening Bank (`/dashboard/akun/rekening`)

**Status**: pertanyaan/permintaan dari FE, belum diimplementasikan. Terkait redesain halaman **Rekening Bank** milik user sendiri (bukan halaman admin "Semua Rekening Bank").

---

## 1. Latar belakang

Desain baru (`docs/redesain/dashboard/f68feeb2-….png`) menampilkan halaman dengan:

- Kartu ringkasan **Total Rekening**, **Rekening Aktif**, **Rekening Utama**.
- **Daftar** rekening (lebih dari satu boleh terdaftar), masing-masing dengan tombol **Edit**, **Hapus**, dan **Jadikan Utama** (kecuali yang sudah berlabel "Rekening Utama").

Kondisi FE/BE saat ini **tidak mendukung ini**:

- `POST /admin/bank-accounts` membalas **`409`** kalau user sudah punya satu rekening — jadi menurut BE, **satu user hanya boleh punya satu rekening bank**, bukan banyak dengan satu "utama".
- Field `is_default` **ada** di response `BankAccount`, tapi **tidak ada endpoint** untuk mengubahnya (tidak ada `PATCH .../set-default` atau semacamnya) — FE tidak tahu cara memicunya, dan karena hanya boleh 1 rekening, field ini juga tidak jelas gunanya.
- `PUT /admin/bank-accounts/{id}` dan `DELETE /admin/bank-accounts/{id}` **sudah ada di FE** (`updateBankAccount`, `deleteBankAccount`) tapi **belum pernah dipakai di halaman manapun** — FE tidak tahu apakah keduanya boleh dipanggil oleh user pemilik rekening sendiri (bukan admin), dan apa yang terjadi kalau rekening berstatus `approved` diedit/dihapus (apakah otomatis balik ke `pending`, atau ditolak).

Karena ketidakjelasan ini, **redesain sekarang hanya mengikuti kemampuan yang sudah pasti**: satu rekening per user, tanpa tombol Edit/Hapus/Jadikan Utama, dan tanpa konsep "aktif" (yang ada hanya status `pending`/`approved`/`rejected`). Kartu ringkasan diganti jadi Total Rekening, Disetujui, dan Menunggu Verifikasi — semuanya dihitung dari data yang sudah ada.

---

## 2. Pertanyaan untuk BE

1. **Apakah rencana produk memang tetap 1 rekening per user**, atau ke depan akan diizinkan lebih dari satu (sesuai desain)? Kalau tetap 1, FE lebih suka desain di-`disable`/disederhanakan (info admin mungkin belum tahu batas ini saat bikin desain) daripada dipaksakan.
2. Jika **multi-rekening diizinkan**: mohon endpoint untuk **menjadikan satu rekening sebagai utama**, mis. `PATCH /admin/bank-accounts/{id}/set-default`, yang otomatis mengembalikan `is_default: false` pada rekening lain milik user yang sama. Apakah ada validasi khusus (mis. rekening harus `approved` dulu sebelum bisa dijadikan utama)?
3. **`PUT /admin/bank-accounts/{id}`** (edit): boleh dipanggil oleh user pemilik sendiri (bukan cuma admin)? Kalau rekening sedang `approved`, apakah edit membuat status balik ke `pending` (perlu diverifikasi ulang), atau field yang boleh diubah dibatasi (mis. cuma `account_name`, tidak termasuk `bank_name`/`account_number` yang sudah diverifikasi)?
4. **`DELETE /admin/bank-accounts/{id}`** (hapus): boleh dipanggil oleh user pemilik sendiri? Ada batasan (mis. tidak bisa hapus kalau sedang ada permintaan withdraw yang memakai rekening itu)?
5. Field **`is_default`**: kalau tetap dipertahankan sebagai fitur, apa nilainya untuk rekening pertama yang dibuat — otomatis `true`, atau perlu di-set manual?

---

## 3. Rencana FE setelah dikonfirmasi

- Kalau multi-rekening + endpoint set-default tersedia: tampilkan kartu **Rekening Utama**, daftar multi-baris, dan tombol Edit/Hapus/Jadikan Utama sesuai desain, memanfaatkan `updateBankAccount`/`deleteBankAccount` yang sudah ada di FE plus fungsi baru untuk set-default.
- Kalau tetap 1 rekening per user: FE akan menambahkan tombol **Edit** (kalau BE mengizinkan) pada tampilan rekening yang sudah ada, dan mempertimbangkan tombol **Hapus** hanya untuk status `rejected` (supaya user bisa mencoba lagi tanpa menghubungi CS).
