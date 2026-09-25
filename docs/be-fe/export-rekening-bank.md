# Data Export Semua Rekening Bank (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-5 dari `docs/export/export.md`. Mengikuti template `template_data_rekening_bank_bhisakirim.xlsx`.

**Khusus admin, cakupan semua akun.** Hanya user dengan izin **`exports.bank-accounts`** yang bisa membuatnya. Izin ini **baru**, dimiliki `superadmin` dan `admin`. Role `finance` **tidak** bisa, walaupun punya izin `bank-accounts.view_all` untuk memverifikasi rekening. Tampilkan tombolnya hanya kalau `hasPermission("exports.bank-accounts")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `bank-accounts` |
| `status` | tidak | `pending`, `approved`, atau `rejected` (status verifikasi rekening). Nilai lain → `422` |
| `user_id` | tidak | Batasi ke satu akun. Harus id user yang ada (`422` kalau tidak) |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **Tanggal Ditambahkan** (kapan rekening didaftarkan), inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Tanpa filter → semua rekening semua akun. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Semua Rekening Bank`. Nama file: `rekening-bank[_status][_akun{id}]_{start}_{end}_{waktu}.xlsx`.

Rekening yang sudah dihapus (permintaan hapus sudah disetujui admin) **tidak ada lagi di database**, jadi tidak ikut diexport.

---

## 2. Isi file: 3 sheet

### Sheet 1 — "Data Rekening Bank"

**21 kolom pertama sama persis dengan template** (nama dan urutan), lalu 3 kolom tambahan di kanan. Satu baris per rekening; header tebal, dibekukan, dan ada filter.

| Kolom | Isi |
|---|---|
| No. | Nomor urut |
| ID Rekening | Id rekening (angka, sama dengan `id` di API rekening bank) |
| User ID | Id pemilik akun |
| ID Wallet | **Kosong** — wallet adalah saldo akun, tidak punya id sendiri |
| Nama Pemilik/Akun | Nama akun pemilik |
| Nama Pemilik Rekening | Nama sesuai buku tabungan (`account_name`) |
| Nama Bank | Nama bank apa adanya seperti yang diisi user |
| Kode Bank | **Kosong** — tidak disimpan |
| Nomor Rekening | Ditulis sebagai teks, angka 0 di depan tetap ada |
| Jenis Rekening, Cabang/Unit Bank, Kota | **Kosong** — tidak disimpan |
| Tanggal Ditambahkan | `YYYY-MM-DD`, kapan rekening didaftarkan |
| Tanggal Verifikasi | `YYYY-MM-DD`, kapan disetujui admin. Kosong bila belum/tidak disetujui |
| Status Verifikasi | `Terverifikasi` (approved), `Belum Diverifikasi` (pending), `Ditolak` (rejected) |
| Status Rekening | Lihat tabel di bawah |
| Rekening Utama | `Ya` / `Tidak` |
| PIC/Admin | **Kosong** — siapa admin yang menyetujui belum dicatat |
| Tanggal Update Terakhir | `YYYY-MM-DD` |
| Keterangan | `Ditolak: {alasan}` untuk rekening ditolak; `Menunggu persetujuan penghapusan sejak {tanggal}` bila ada permintaan hapus; selain itu kosong |
| Catatan | **Kosong** (kolom isian bebas di template) |
| *Tambahan:* Email Akun, Tipe Akun | Pemilik rekening (`Personal` / `Corporate` / `Agen`) |
| *Tambahan:* Tanggal Pengajuan Hapus | Kapan pemilik mengajukan penghapusan (kosong bila tidak ada) |

**Status Rekening** (menunjukkan apakah rekening bisa dipakai untuk penarikan):

| Nilai | Kondisi rekening |
|---|---|
| `Aktif` | Disetujui dan tidak ada permintaan hapus |
| `Tidak Aktif` | Belum diverifikasi (pending) |
| `Perlu Klarifikasi` | Ditolak; alasannya ada di kolom Keterangan |
| `Menunggu Penghapusan` | Pemilik sudah mengajukan hapus dan menunggu admin (walau statusnya masih Terverifikasi, penarikan sudah diblokir) |

Template menyebut juga status `Ditutup/Diblokir`; sistem tidak punya status itu (rekening yang dihapus langsung hilang), jadi tidak dipakai.

### Sheet 2 — "Dashboard"

Sama tujuannya dengan sheet Dashboard di template, tapi berisi **angka jadi** (bukan rumus COUNTIF): Total Rekening, jumlah Rekening Utama, jumlah per Status Rekening, per Status Verifikasi, dan tabel per bank (jumlah total dan yang Aktif). Nama bank digabung tanpa membedakan huruf besar/kecil dan spasi di ujung (`bca` dan `BCA ` dihitung satu). Tabel bank mengikuti isian user, bukan daftar bank tetap seperti di template.

### Sheet 3 — "Info Export"

Filter yang dipakai, siapa yang mengekspor, waktu dibuat, total rekening, penjelasan status, dan peringatan **file berisi data rekening bank, jangan dibagikan tanpa pengamanan**. Sheet "Petunjuk" milik template (petunjuk mengisi manual) tidak dibawa.

Teks dari user (nama, dll.) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus. Foto rekening/KTP tidak ikut diexport.

---

## 3. Hal yang perlu diketahui

- File ini berisi nomor rekening lengkap seluruh pengguna. Karena itu izinnya sengaja dipisah (`exports.bank-accounts`) dan tidak ikut ke `finance`. Kalau nanti finance perlu, cukup beri izin ini ke role finance.
- Kolom **PIC/Admin** kosong karena sistem belum mencatat admin yang menyetujui rekening. Kalau kolom ini dibutuhkan, BE perlu mulai mencatatnya saat approve (seperti yang sudah dilakukan untuk PIC Cancel di order).

---

## 4. Ringkasan perubahan BE

- Tipe export baru `bank-accounts` di `config/exports.php`.
- **Permission baru `exports.bank-accounts`** (di `PermissionsTableSeeder`); otomatis ikut ke `admin` dan `superadmin` setelah seeder role dijalankan ulang (sudah dilakukan di produksi).
- Tidak ada perubahan pada endpoint atau response API rekening bank.
