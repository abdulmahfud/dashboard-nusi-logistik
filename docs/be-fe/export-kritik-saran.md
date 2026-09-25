# Data Export Kritik & Saran (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-8 dari `docs/export/export.md`. Mengikuti template `template_kritik_saran_bhisakirim.xlsx`.

**Khusus admin, cakupan semua akun.** Hanya user dengan izin **`exports.feedbacks`** yang bisa membuatnya. Izin ini **baru**, dimiliki `superadmin` dan `admin`. Role `customer-service` **tidak** bisa, walaupun punya `feedbacks.index` untuk melihat daftar kritik & saran. Tampilkan tombolnya hanya kalau `hasPermission("exports.feedbacks")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `feedbacks` |
| `rating` | tidak | `1` sampai `5`. Di luar itu → `422` |
| `user_id` | tidak | Batasi ke feedback satu pengirim. Harus id user yang ada (`422` kalau tidak) |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **Tanggal Masuk**, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Tanpa filter → semua feedback. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Kritik & Saran`. Nama file: `kritik-saran[_rating{n}][_akun{id}]_{start}_{end}_{waktu}.xlsx`.

---

## 2. Isi file: 3 sheet

### Sheet 1 — "Data Kritik Saran"

**20 kolom pertama sama persis dengan template** (nama dan urutan), lalu 2 kolom tambahan di kanan. Header di baris 1 (tebal, dibekukan, ada filter). Urutan baris: feedback paling lama dulu.

**Sistem hanya menyimpan pengirim, rating (1–5), dan komentar.** Karena itu kebanyakan kolom template kosong:

| Kolom | Isi |
|---|---|
| No. | Nomor urut |
| Tanggal Masuk, Jam | `YYYY-MM-DD` dan `HH:MM` (WIB) |
| ID Feedback | Dibentuk dari id, mis. `FB-0012` (id yang sama selalu menghasilkan nomor yang sama) |
| User ID | Id pengirim. **Kosong bila akunnya sudah dihapus** |
| Nama User | Nama pengirim; `(akun sudah dihapus)` bila akunnya sudah dihapus |
| No. HP/Email | `nomor HP / email`, atau salah satunya bila hanya ada satu |
| Kritik/Saran | Isi komentar (maks. 500 karakter, sesuai batas di aplikasi) |
| Rating Layanan | 1–5 |
| *Tambahan:* Tipe Akun, Perusahaan/Unit | `Personal`/`Corporate`/`Agen` dan nama perusahaan pengirim |
| **Kosong:** Jenis Feedback, Kategori, Subjek/Judul, Prioritas, Status Penanganan, PIC, Tanggal Ditindaklanjuti, Tindakan/Respons, Tanggal Selesai, Hasil, Catatan | Tidak ada datanya di sistem: feedback belum punya jenis/kategori/judul, dan belum ada alur penanganan (status, PIC, tindak lanjut) |

Feedback dari **akun yang sudah dihapus tetap diexport** (komentar dan rating masih ada), hanya identitas pengirimnya yang hilang.

### Sheet 2 — "Dashboard"

Sama tujuannya dengan sheet Dashboard di template, tapi berisi **angka jadi** (bukan rumus) dan hanya yang benar-benar ada: Total Feedback, jumlah dari akun yang sudah dihapus, **Rata-rata Rating** (kosong bila tidak ada feedback), sebaran jumlah per rating (5 sampai 1), dan jumlah per tipe akun pengirim. Hitungan per Jenis Feedback, Status Penanganan, dan Prioritas di template dashboard **tidak dibawa** karena datanya tidak ada.

### Sheet 3 — "Info Export"

Filter yang dipakai, siapa yang mengekspor, waktu dibuat, total feedback, penjelasan kolom yang kosong, dan peringatan **file berisi komentar beserta nama, email, dan nomor HP pengguna, jangan dibagikan tanpa pengamanan**. Sheet "Petunjuk" milik template (petunjuk mengisi manual) tidak dibawa.

Komentar dari user selalu ditulis sebagai teks biasa, sehingga komentar berawalan `=` tidak dieksekusi Excel sebagai rumus.

---

## 3. Hal yang perlu diketahui

- Kolom penanganan (Status Penanganan, PIC, Tanggal Ditindaklanjuti, Tindakan/Respons, Tanggal Selesai, Hasil) akan otomatis terisi di export ini **setelah fiturnya ada** di aplikasi. Saat ini admin hanya bisa melihat daftar feedback, belum bisa menandai/menanganinya. Begitu juga Jenis Feedback, Kategori, Subjek, dan Prioritas, bila form kritik & saran nantinya menambahkan isian tersebut.
- Rating memakai skala 1–5 dari UI ("Jelek" sampai "Keren"); di file hanya angkanya yang ditulis.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `feedbacks` di `config/exports.php`.
- **Permission baru `exports.feedbacks`** (di `PermissionsTableSeeder`); otomatis ikut ke `admin` dan `superadmin` setelah seeder role dijalankan ulang (sudah dilakukan di produksi).
- Tidak ada perubahan pada endpoint atau response API kritik & saran.
