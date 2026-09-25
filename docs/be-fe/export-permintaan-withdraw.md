# Data Export Permintaan Withdraw (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-10 dari `docs/export/export.md`. Mengikuti template `template_data_permintaan_withdraw_bhisakirim.xlsx`.

**Khusus admin, cakupan semua akun.** Hanya user dengan izin **`exports.withdraws`** yang bisa membuatnya. Izin ini **baru**, dimiliki `superadmin` dan `admin`. Role `finance` **tidak** bisa, walaupun punya `withdraws.index`/`withdraws.update` untuk memproses withdraw. Tampilkan tombolnya hanya kalau `hasPermission("exports.withdraws")`.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `withdraws` |
| `status` | tidak | `pending`, `approved`, atau `rejected` (status di API withdraw). Nilai lain → `422` |
| `user_id` | tidak | Batasi ke permintaan satu akun. Harus id user yang ada (`422` kalau tidak) |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **Tanggal Permintaan**, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Tanpa filter → semua permintaan semua akun. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Permintaan Withdraw`. Nama file: `permintaan-withdraw[_status][_akun{id}]_{start}_{end}_{waktu}.xlsx`.

---

## 2. Isi file: 3 sheet

### Sheet 1 — "Data Permintaan Withdraw"

**21 kolom pertama sama persis dengan template** (nama dan urutan), lalu 7 kolom tambahan di kanan. Header di baris 1 (tebal, dibekukan, ada filter). Urutan baris: permintaan paling lama dulu.

| Kolom | Isi |
|---|---|
| No. | Nomor urut |
| Tanggal Permintaan, Jam | `YYYY-MM-DD` dan `HH:MM` (WIB) |
| ID Withdraw | Dibentuk dari id, mis. `WD-0012` |
| ID Wallet | **Kosong** — wallet adalah saldo akun, tidak punya id sendiri |
| Nama Pemilik/Akun | Nama akun pemohon |
| No. HP/Email | `nomor HP / email` |
| Bank/Metode Withdraw | Nama bank rekening tujuan (mis. `BCA`); semua withdraw adalah transfer ke rekening bank terdaftar |
| No. Rekening/ID Tujuan | Nomor rekening tujuan (teks; angka 0 di depan tetap ada) |
| Nama Pemilik Rekening | Nama sesuai buku tabungan |
| Nominal Withdraw | Jumlah yang diminta |
| Biaya Admin | **Selalu 0** — tidak ada biaya penarikan |
| Total Dibebankan | Nominal + Biaya Admin. Untuk permintaan yang **belum disetujui atau ditolak**, ini adalah nominal yang diminta, **belum tentu terpotong** dari saldo |
| No. Referensi/Transaksi | Nomor transaksi wallet terkait (mis. `WTX-0038`) |
| Alasan/Keterangan | Catatan dari pemohon (`note`), kosong bila tidak ada |
| Status Withdraw | Lihat tabel di bawah |
| PIC | **Kosong** — admin yang menyetujui/menolak belum dicatat |
| Tanggal Diproses, Tanggal Selesai | Sama: tanggal admin menyetujui/menolak. Kosong selama masih menunggu |
| Hasil Verifikasi | `Menunggu` / `Valid` / `Tidak Valid` mengikuti status |
| Catatan | `Rekening tujuan sudah dihapus` bila rekening tujuan sudah dihapus setelah permintaan dibuat; selain itu kosong |
| *Tambahan:* ID, User ID, Tipe Akun | Id permintaan, id pemohon, `Personal`/`Corporate`/`Agen` |
| *Tambahan:* Saldo Sebelum, Saldo Sesudah | Saldo akun tepat sebelum dan sesudah dipotong. **Hanya ada untuk yang Disetujui** |
| *Tambahan:* Saldo Akun Saat Ini | Saldo akun saat file dibuat |
| *Tambahan:* Saldo Cukup | **Hanya untuk yang masih menunggu**: `Ya` bila saldo akun saat ini sudah cukup untuk disetujui, `Tidak` bila belum (menyetujui permintaan dengan saldo kurang akan ditolak sistem) |

**Status:**

| Nilai di file | Status di sistem | Arti | Hasil Verifikasi |
|---|---|---|---|
| `Menunggu Verifikasi` | `pending` | Belum diputuskan admin; saldo belum dipotong | `Menunggu` |
| `Disetujui` | `approved` | Disetujui dan saldo akun sudah dipotong sebesar nominal | `Valid` |
| `Ditolak` | `rejected` | Ditolak; saldo tidak berubah | `Tidak Valid` |

Status `Diproses`, `Berhasil`, `Gagal`, dan `Dibatalkan` dari template **tidak dipakai**: sistem tidak mencatat pengiriman dana ke bank setelah disetujui, jadi `Disetujui` adalah status akhir yang tercatat.

### Sheet 2 — "Dashboard"

Angka jadi (bukan rumus): Total Permintaan; Total Nominal Withdraw (semua permintaan), Total Biaya Admin, Total Nominal Disetujui (saldo terpotong), Total Nominal Menunggu Verifikasi; dan tabel per status (jumlah dan nominal).

### Sheet 3 — "Info Export"

Filter yang dipakai, siapa yang mengekspor, waktu dibuat, total permintaan, penjelasan status dan kolom, serta peringatan **file berisi nomor rekening dan saldo pengguna, jangan dibagikan tanpa pengamanan**. Sheet "Petunjuk" milik template (petunjuk mengisi manual) tidak dibawa.

Teks dari user (nama, catatan) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus.

---

## 3. Hal yang perlu diketahui

- Kolom **PIC** kosong karena sistem belum mencatat admin yang menyetujui/menolak withdraw. Kalau dibutuhkan, BE perlu mulai mencatatnya saat approve/reject (seperti yang sudah dilakukan untuk PIC Cancel di order).
- Tidak ada **alasan penolakan** yang tersimpan: kolom Alasan/Keterangan hanya berisi catatan dari pemohon. Kalau admin perlu menuliskan alasan saat menolak, itu fitur baru di `POST /admin/withdraws/{id}/reject`.
- **Rekening tujuan** bisa hilang setelah permintaan dibuat (rekening dihapus lewat persetujuan admin). Permintaan withdraw tetap tersimpan, tetapi data banknya kosong; kolom Catatan menandainya.
- Permintaan withdraw dari dua jalur (endpoint withdraw di menu Withdraw maupun di Wallet) tersimpan di tabel yang sama, jadi keduanya ikut diexport.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `withdraws` di `config/exports.php`.
- **Permission baru `exports.withdraws`** (di `PermissionsTableSeeder`); otomatis ikut ke `admin` dan `superadmin` setelah seeder role dijalankan ulang (sudah dilakukan di produksi).
- Tidak ada perubahan pada endpoint atau response API withdraw.
