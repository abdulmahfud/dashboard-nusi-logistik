# Data Export Tiket Bantuan (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-7 dari `docs/export/export.md`. Mengikuti template `template_data_tiket_bantuan.xlsx`.

**Khusus admin, cakupan semua akun.** Hanya user dengan izin **`exports.support-tickets`** yang bisa membuatnya. Izin ini **baru**, dimiliki `superadmin` dan `admin`. Role `customer-service` **tidak** bisa, walaupun punya `support.tickets.manage` untuk menangani tiket. Tampilkan tombolnya hanya kalau `hasPermission("exports.support-tickets")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `support-tickets` |
| `status` | tidak | Kode status tiket: `awaiting_support`, `awaiting_customer`, `resolved`, `closed` (sama dengan filter `status` di API tiket). Nilai lain → `422` |
| `department` | tidak | Kode departemen: `billing`, `expedition`, `technical`, `account`, `other`. Nilai lain → `422` |
| `user_id` | tidak | Batasi ke tiket satu pelapor. Harus id user yang ada (`422` kalau tidak) |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **Tanggal Masuk** tiket, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Tanpa filter → semua tiket semua akun. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Tiket Bantuan`. Nama file: `tiket-bantuan[_status][_departemen][_akun{id}]_{start}_{end}_{waktu}.xlsx`.

---

## 2. Isi file: 2 sheet

### Sheet 1 — "Data Tiket"

Sama seperti template: **baris 1 = judul** (`DATA TIKET BANTUAN`, digabung selebar tabel), **baris 2 = header**, data mulai baris 3. Header dibekukan dan ada filter (mulai dari baris header). **17 kolom pertama sama persis dengan template**, lalu 6 kolom tambahan di kanan. Urutan baris: tiket paling lama dulu.

| Kolom | Isi |
|---|---|
| No. Tiket | Dibentuk dari tahun tiket masuk dan id, mis. `TKT-2026-0012`. **Sistem tidak menyimpan nomor tiket sendiri**; nomor ini konsisten (id tiket yang sama selalu menghasilkan nomor yang sama) |
| Tanggal Masuk, Jam Masuk | `DD/MM/YYYY` dan `HH:MM` (WIB), kapan tiket dibuat |
| Nama Pelapor | Nama user pembuat tiket |
| Perusahaan/Unit | Nama perusahaan pelapor (akun Corporate/Agen); kosong untuk yang lain |
| Departemen | Label departemen di sistem: `Billing & pembayaran`, `Ekspedisi & pengiriman`, `Teknis & aplikasi`, `Akun & keamanan`, `Lainnya`. (Daftar dropdown di template hanya contoh; yang dipakai adalah daftar departemen sistem) |
| Subjek/Judul | Judul tiket |
| Deskripsi Masalah | **Pesan pertama pelapor.** Dipotong dengan tanda `... (dipotong)` bila lebih dari 32.000 karakter (batas sel Excel) |
| Prioritas | **Kosong** — sistem tidak punya prioritas tiket |
| Status | Lihat tabel di bawah |
| PIC/Penanggung Jawab | Petugas yang ditugaskan (`assigned_to`); kosong bila belum ditugaskan |
| Tanggal Ditangani | Tanggal **balasan pertama dari petugas** (balasan dari selain pelapor). Kosong bila belum ada balasan |
| Tanggal Selesai | Tanggal tiket ditandai `Resolved` atau `Closed`. Kosong bila belum selesai atau tiket dibuka kembali |
| Durasi Penyelesaian (Hari) | Dari tanggal masuk sampai selesai, dalam hari (satu desimal). Kosong bila belum selesai |
| Solusi/Tindakan | **Balasan terakhir dari petugas** (bukan pesan terakhir pelapor). Kosong bila belum ada balasan petugas. Dipotong seperti Deskripsi Masalah |
| Catatan | **Kosong** (isian bebas di template) |
| Rating Layanan | **Kosong** — sistem tidak punya rating tiket |
| *Tambahan:* ID Tiket | Id tiket (angka, sama dengan `id` di API tiket) |
| *Tambahan:* Email Pelapor | Email pembuat tiket |
| *Tambahan:* Jumlah Pesan, Jumlah Lampiran | Total pesan pada tiket (termasuk pesan pertama) dan total lampiran; **isi lampiran tidak ikut diexport** |
| *Tambahan:* Respons Pertama (Jam) | Jam dari tiket masuk sampai balasan pertama petugas (satu desimal). Berguna untuk memantau kecepatan respons |
| *Tambahan:* Pesan Terakhir | `YYYY-MM-DD HH:MM`, waktu pesan terakhir di tiket |

**Status** memakai istilah di template:

| Nilai di file | Status di sistem | Arti |
|---|---|---|
| `Open` | `awaiting_support` | Menunggu tim support |
| `Pending` | `awaiting_customer` | Menunggu balasan pelapor |
| `Resolved` | `resolved` | Selesai |
| `Closed` | `closed` | Ditutup |

Status `In Progress` dari template **tidak dipakai** karena sistem tidak membedakannya.

### Sheet 2 — "Info Export"

Filter yang dipakai, siapa yang mengekspor, waktu dibuat, total tiket, penjelasan pemetaan status dan kolom, serta peringatan **file berisi isi laporan dari pengguna (bisa memuat data pribadi), jangan dibagikan tanpa pengamanan**. Sheet "Petunjuk" milik template (petunjuk mengisi manual) tidak dibawa.

Teks dari user (judul, isi pesan) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus.

---

## 3. Hal yang perlu diketahui

- Kolom **Prioritas** dan **Rating Layanan** kosong karena datanya tidak ada di sistem. Kalau keduanya dibutuhkan, FE dan BE perlu menambahkan fiturnya (mis. prioritas diisi admin, rating diisi pelapor setelah tiket selesai) — export otomatis bisa mengisinya setelah itu.
- **Tanggal Ditangani** dan **Solusi/Tindakan** diturunkan dari isi percakapan (balasan pertama dan terakhir petugas), bukan dari kolom khusus, karena sistem tidak mencatat kapan tiket "mulai dikerjakan".
- Filter `status` memakai kode sistem (`awaiting_support` dst.), sedangkan kolom Status di file memakai istilah template (`Open` dst.). Sheet Info Export menampilkan istilah yang dipakai.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `support-tickets` di `config/exports.php`.
- **Permission baru `exports.support-tickets`** (di `PermissionsTableSeeder`); otomatis ikut ke `admin` dan `superadmin` setelah seeder role dijalankan ulang (sudah dilakukan di produksi).
- Tidak ada perubahan pada endpoint atau response API tiket bantuan.
