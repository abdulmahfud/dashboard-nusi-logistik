# Kebutuhan Menu Admin Baru: Pengajuan Rekening Bank

**Status**: seluruh endpoint yang dibutuhkan sudah tersedia di production (2026-09-22). Dokumen ini menjelaskan kebutuhan menu baru di sisi FE admin dashboard, bukan endpoint baru.

**Latar belakang**: sejak update multi-rekening (`docs/be-fe/update-rekening-bank-multi-akun.md`), ada **dua jenis pengajuan** yang butuh persetujuan admin untuk setiap rekening bank:

1. **Pengajuan rekening baru / edit** (`status = pending`) — dari `POST` (buat baru) atau `PUT` (edit rekening yang sudah ada, yang otomatis balik ke `pending`).
2. **Pengajuan hapus rekening** (`deletion_requested_at` terisi) — dari `DELETE`.

Kedua jenis ini **independen** — sebuah rekening `approved` bisa saja sedang mengajukan hapus (`status=approved` + `deletion_requested_at` terisi), dan sebuah rekening `pending` **tidak mungkin** sedang mengajukan hapus (endpoint `PUT`/`DELETE` saling memblokir satu sama lain saat salah satunya sedang berjalan — lihat `docs/be-fe/update-rekening-bank-multi-akun.md` §2–3). Karena dua sumbu status ini terpisah, admin butuh dua daftar/filter yang berbeda, bukan satu daftar status gabungan.

Saat ini **belum ada menu khusus** di admin dashboard untuk melihat & memproses kedua jenis pengajuan ini secara terpusat — perlu ditambahkan.

---

## 1. Usulan menu: "Pengajuan Rekening Bank"

Menu baru (mis. di bawah grup Keuangan/Approval, sejajar dengan menu approval Withdraw yang sudah ada), dengan dua tab/filter:

- **Tab "Menunggu Verifikasi"** — daftar rekening `status = pending` (baru dibuat ATAU sedang diedit ulang).
- **Tab "Menunggu Persetujuan Hapus"** — daftar rekening dengan `deletion_requested_at` terisi.

Kedua tab memakai endpoint yang sama, dibedakan lewat query param.

---

## 2. Endpoint untuk mengisi daftar

`GET /admin/bank-accounts/all` (permission: `bank-accounts.view_all`, sudah dimiliki role admin/superadmin — tidak ada permission baru).

**Tab "Menunggu Verifikasi"**:
```
GET /admin/bank-accounts/all?status=pending
```

**Tab "Menunggu Persetujuan Hapus"** (param baru `pending_deletion`, ditambahkan khusus untuk kebutuhan menu ini):
```
GET /admin/bank-accounts/all?pending_deletion=1
```
- `pending_deletion=1` → hanya rekening yang `deletion_requested_at` terisi.
- `pending_deletion=0` → hanya rekening yang `deletion_requested_at` kosong (berguna untuk daftar "Semua Rekening" biasa kalau FE ingin menyembunyikan yang sedang proses hapus).
- Param diabaikan (semua rekening tampil) kalau tidak dikirim.

Bisa dikombinasikan dengan filter yang sudah ada: `user_id`, `search` (cocok ke `bank_name`/`account_name`/`account_number`), `per_page`. Response tetap format paginated standar (`data.data`, `data.current_page`, dst) seperti endpoint ini sebelumnya.

**Field yang relevan ditampilkan di tabel**: `id`, `user.name`/`user.email` (rekening milik siapa), `bank_name`, `account_name`, `account_number`, `status`, `deletion_requested_at`, `is_default`, `photo_rekening_url`/`photo_ktp_url` (untuk admin verifikasi identitas), `created_at`/`updated_at` (kapan pengajuan masuk).

---

## 3. Aksi admin per tab

### Tab "Menunggu Verifikasi" (`status = pending`)

- **Setujui**: `POST /admin/bank-accounts/{id}/approve` (permission `bank-accounts.approve`) — tidak butuh body.
- **Tolak**: `POST /admin/bank-accounts/{id}/reject` (permission `bank-accounts.reject`) — body `{ "reason": "string, required, max:255" }`.

Kedua endpoint ini **sudah ada sejak sebelum fitur multi-rekening** — tidak ada perubahan perilaku, cuma perlu ditampilkan di menu baru ini juga (sebelumnya mungkin hanya diakses lewat menu "Semua Rekening Bank" biasa).

### Tab "Menunggu Persetujuan Hapus" (`deletion_requested_at` terisi)

- **Setujui hapus**: `PATCH /admin/bank-accounts/{id}/approve-deletion` (permission `bank-accounts.approve`) — tidak butuh body. Rekening **benar-benar dihapus** setelah ini, tidak bisa dibatalkan.
- **Tolak hapus**: `PATCH /admin/bank-accounts/{id}/reject-deletion` (permission `bank-accounts.reject`) — tidak butuh body. Rekening kembali normal, `deletion_requested_at` dikosongkan, status/data tidak berubah.

Detail lengkap request/response kedua endpoint ini ada di `docs/be-fe/update-rekening-bank-multi-akun.md` §4.

**Saran UX**: karena approve-deletion sifatnya permanen (hapus beneran, tidak seperti reject yang reversible), sebaiknya ada konfirmasi dialog tambahan di FE sebelum memanggil endpoint ini.

---

## 4. Permission — tidak ada yang baru

Semua endpoint di atas memakai permission yang **sudah ada dan sudah ter-assign** ke role admin/superadmin dari fitur-fitur sebelumnya: `bank-accounts.view_all`, `.approve`, `.reject`. Tidak perlu seeder/permission baru untuk menu ini — kalau admin yang login sudah bisa mengakses menu "Semua Rekening Bank" yang lama, mereka otomatis bisa mengakses menu baru ini juga.

---

## 5. Ringkasan badge notifikasi (opsional)

Kalau FE ingin menampilkan badge jumlah pengajuan pending di sidebar (mirip badge Withdraw), bisa panggil kedua query di atas dengan `per_page=1` dan pakai `data.total` dari response paginate untuk masing-masing tab, atau gabungkan keduanya untuk satu angka total "Pengajuan Rekening" di sidebar.
