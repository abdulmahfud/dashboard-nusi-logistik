# Data Export List User (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-6 dari `docs/export/export.md`. Mengikuti template `template_data_list_user_bhisakirim.xlsx`.

**Khusus admin, cakupan semua akun** (customer **dan** staff). Hanya user dengan izin **`exports.users`** yang bisa membuatnya. Izin ini **baru**, dimiliki `superadmin` dan `admin`. Role lain (termasuk `finance`, `sales`, `operations`, `customer-service`) mendapat `403`. Tampilkan tombolnya hanya kalau `hasPermission("exports.users")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `users` |
| `role` | tidak | Nama role, mis. `user` (customer), `admin`, `finance`. Role yang tidak ada → `422` |
| `account_type` | tidak | `personal`, `corporate`, atau `agen`. **Hanya berlaku untuk customer** (role `user`); staff tidak ikut walaupun kolomnya berisi default |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **Tanggal Daftar**, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Tanpa filter → semua user. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `List User`. Nama file: `list-user[_role][_tipe]_{start}_{end}_{waktu}.xlsx`.

---

## 2. Isi file: 3 sheet

### Sheet 1 — "Data List User"

**19 kolom pertama sama persis dengan template** (nama dan urutan), lalu 7 kolom tambahan di kanan. Satu baris per user; header tebal, dibekukan, dan ada filter.

| Kolom | Isi |
|---|---|
| No. | Nomor urut |
| User ID | Id user |
| Username | **Kosong** — akun login memakai email, tidak ada username |
| Nama Lengkap, Email | Data akun |
| No. HP | Nomor WhatsApp, ditulis sebagai teks (angka 0 di depan tetap ada) |
| Tanggal Daftar | `YYYY-MM-DD` |
| Jenis User | Dari role: `Customer` (role `user`), `Admin`, `Superadmin`, `Finance`, `Sales`, `Operations`, `Customer Service`. Bila punya beberapa role, dipisah koma |
| Nama Perusahaan/Usaha | Nama perusahaan (Corporate/Agen) |
| Kota/Kabupaten, Provinsi | **Kosong** — tidak disimpan di data user |
| Alamat | Alamat penagihan; hanya terisi untuk akun Corporate/Agen |
| Status Akun | Lihat tabel di bawah |
| Status Verifikasi | `Terverifikasi` bila email sudah diverifikasi, `Belum Diverifikasi` bila belum |
| Tanggal Verifikasi | Tanggal verifikasi email |
| Tanggal Login Terakhir | **Kosong** — login tidak dicatat |
| PIC/Admin | **Kosong** — tidak dicatat |
| Sumber Registrasi | **Kosong** — tidak dicatat |
| Catatan | `Suspended: {alasan}` untuk akun yang disuspend; selain itu kosong |
| *Tambahan:* Tipe Akun, Mode Penagihan | **Hanya customer:** `Personal`/`Corporate`/`Agen`, dan `Prepaid`/`Postpaid (Kerja Sama)`. Kosong untuk staff |
| *Tambahan:* Saldo Wallet | Saldo saat ini |
| *Tambahan:* Jumlah Order, Order Terakhir | Semua order akun (semua status) dan tanggal order terakhir |
| *Tambahan:* Limit Kredit, Outstanding Kredit | **Hanya akun Corporate**; outstanding dari ledger kredit kerja sama |

**Status Akun:**

| Nilai | Kondisi |
|---|---|
| `Aktif` | Email sudah diverifikasi dan tidak disuspend |
| `Tidak Aktif` | Email belum diverifikasi — belum bisa memakai aplikasi (API admin mensyaratkan email terverifikasi) |
| `Suspended` | Akun kerja sama disuspend admin (`suspended_at`); alasannya di kolom Catatan |

Template juga memuat kolom *Total Nilai Transaksi* di petunjuknya, tetapi tidak ada di header; angka transaksi bisa dilihat di export Aktivitas Pengiriman.

### Sheet 2 — "Dashboard"

Sama tujuannya dengan sheet Dashboard di template, tapi berisi **angka jadi** (bukan rumus): Total User, Total Saldo Wallet, Total Outstanding Kredit (Corporate), jumlah per Status Akun, per Status Verifikasi, per Jenis User, dan per Tipe Akun (customer saja).

### Sheet 3 — "Info Export"

Filter yang dipakai, siapa yang mengekspor, waktu dibuat, total user, penjelasan status, dan peringatan **file berisi data pribadi pengguna, jangan dibagikan tanpa pengamanan**. Sheet "Petunjuk" milik template (petunjuk mengisi manual) tidak dibawa.

Kata sandi tidak pernah diexport. Teks dari user (nama, dll.) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus.

---

## 3. Hal yang perlu diketahui

- Kolom **Tipe Akun** di database bernilai `personal` untuk semua user, termasuk staff, karena itu defaultnya. Di file ini kolom tersebut sengaja dikosongkan untuk staff, dan filter `account_type` hanya menyaring customer.
- **Status Akun "Suspended"** mengacu pada suspend akun kerja sama (kredit), bukan pemblokiran login — sistem belum punya konsep menonaktifkan akun.
- Beberapa kolom template kosong karena datanya belum tersimpan (Username, Kota/Kabupaten, Provinsi, Tanggal Login Terakhir, PIC/Admin, Sumber Registrasi). Kalau dibutuhkan, BE perlu mulai mencatatnya (misalnya login terakhir dan sumber registrasi).
- `docs/export/template_data_list_user_akun_Kerjasama_bhisakirim.xlsx` ternyata **file yang sama persis** dengan template List User ini (isinya identik), jadi belum ada template khusus untuk export Akun Kerjasama.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `users` di `config/exports.php`.
- **Permission baru `exports.users`** (di `PermissionsTableSeeder`); otomatis ikut ke `admin` dan `superadmin` setelah seeder role dijalankan ulang (sudah dilakukan di produksi).
- Tidak ada perubahan pada endpoint atau response API user.
