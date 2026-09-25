# Data Export Riwayat Kredit (Excel, akun sendiri / semua akun untuk admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-11 dari `docs/export/export.md`. Tidak ada template; kolom mengikuti tabel riwayat kredit (ledger Kerja Sama) di layar.

Mekanismenya sama dengan export lain (antrian, status, daftar, unduh, masa berlaku 7 hari). Alur, endpoint, dan kode error ada di **`docs/be-fe/export-laporan-pengiriman.md`**; dokumen ini hanya menjelaskan yang berbeda.

## 0. Siapa yang boleh, dan cakupan datanya

**Tidak ada permission baru.** Aksesnya sama dengan halaman riwayat kredit (`GET /admin/kerja-sama/accounts/{user}/ledger`):

| Punya permission | Contoh role | Bisa export? | Cakupan data |
|---|---|---|---|
| `kerja-sama.accounts.view` | `superadmin`, `admin`, `finance`, `sales` | ya | **Semua akun**; boleh mempersempit dengan `user_id` |
| `kerja-sama.accounts.view-own` | customer (`user`) | ya | **Riwayat kredit akunnya sendiri saja** |
| tidak punya keduanya | `operations`, `customer-service` | tidak, `403` | – |

- Customer yang mengirim `user_id` mendapat `422` (field tidak boleh dikirim). Cakupan customer tidak bisa diperluas.
- `finance` dan `sales` ikut mendapat cakupan semua akun karena mereka memang sudah bisa melihat riwayat kredit semua akun di layar.
- Tombol export: tampilkan bila user punya `kerja-sama.accounts.view` **atau** `kerja-sama.accounts.view-own`. Field `user_id` (pilih akun) hanya ditampilkan bila punya `kerja-sama.accounts.view`.
- Customer yang belum punya transaksi kredit sama sekali tetap bisa mengekspor; hasilnya file kosong (hanya header).

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `kerja-sama-ledger` |
| `transaction_type` | tidak | `charge`, `payment`, `adjustment`, atau `write_off`. Nilai lain → `422`. **Namanya bukan `type`** karena `type` sudah dipakai untuk jenis export |
| `status` | tidak | `pending`, `confirmed`, `invoiced`, atau `voided`. Nilai lain → `422` |
| `user_id` | tidak | Hanya untuk pemegang `kerja-sama.accounts.view`. Batasi ke satu akun; harus id user yang ada (`422` kalau tidak) |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **tanggal transaksi**, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |

Tanpa filter → seluruh riwayat (akun sendiri untuk customer, semua akun untuk admin). Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` = `Riwayat Kredit`. Nama file: `riwayat-kredit[_jenistransaksi][_status][_akun{id}]_{start}_{end}_{waktu}.xlsx`.

---

## 2. Isi file: 4 sheet

### Sheet 1 — "Riwayat Kredit"

Satu baris per transaksi ledger, paling lama dulu. Header di baris 1 (tebal, dibekukan, ada filter). 20 kolom:

| Kolom | Isi |
|---|---|
| No. | Nomor urut |
| ID Transaksi | Id transaksi ledger |
| Tanggal, Jam | `YYYY-MM-DD` dan `HH:MM` (WIB) |
| Nama Akun, Email Akun, Perusahaan | Pemilik kredit |
| Jenis Transaksi | Lihat tabel di bawah |
| Status | Lihat tabel di bawah |
| Debit (Tagihan) | Nominal yang **menambah** tagihan. Kosong untuk baris kredit |
| Kredit (Pembayaran) | Nominal yang **mengurangi** tagihan (selalu positif di file). Kosong untuk baris debit |
| Dihitung ke Outstanding | `Ya` / `Tidak` (`Tidak` hanya untuk yang Dibatalkan) |
| Saldo Outstanding Setelah Transaksi | Saldo outstanding akun setelah baris ini; lihat penjelasan di bawah |
| No. Referensi Order, No. Waybill, Ekspedisi | Order terkait (kosong untuk pembayaran/penyesuaian tanpa order). Ekspedisi ditulis huruf besar (mis. `JNTEXPRESS`). Waybill diambil dari order, atau dari metadata transaksi bila order belum punya |
| No. Invoice | Invoice yang menagih/melunasi baris ini, bila ada |
| Deskripsi | Keterangan transaksi |
| Dicatat Oleh | Nama admin yang mencatat (pembayaran, penyesuaian, penghapusan piutang). Untuk tagihan otomatis dari order tertulis `Sistem`; kosong bila pencatatnya tidak diketahui |
| Tanggal Update | Terakhir diubah |

**Jenis Transaksi**

| Nilai di file | `transaction_type` | Arah |
|---|---|---|
| Ongkir Order (Tagihan) | `charge` | Debit |
| Pembayaran | `payment` | Kredit |
| Penyesuaian | `adjustment` | Debit bila menambah tagihan, Kredit bila mengurangi |
| Penghapusan Piutang | `write_off` | Kredit |

**Status**

| Nilai di file | `status` | Arti | Dihitung ke outstanding |
|---|---|---|---|
| Menunggu Konfirmasi | `pending` | Ongkir sudah dipesan saat order dibuat, belum dikonfirmasi | ya |
| Terkonfirmasi | `confirmed` | Sudah pasti | ya |
| Sudah Diinvoice | `invoiced` | Sudah masuk invoice | ya |
| Dibatalkan | `voided` | Order dibatalkan; kredit dikembalikan | **tidak** (tetap tampil di file) |

**Saldo Outstanding Setelah Transaksi** dihitung **per akun dari seluruh riwayatnya**, berurutan menurut ID transaksi, dan **tidak terpengaruh filter**. Artinya: walau export dibatasi tanggal atau jenis, angka saldo tetap saldo sebenarnya pada saat transaksi itu, dan baris terakhir tiap akun sama dengan Outstanding Saat Ini. Transaksi Dibatalkan tidak menambah/mengurangi saldo, jadi saldo di barisnya sama dengan baris sebelumnya.

### Sheet 2 — "Dashboard"

Angka jadi (bukan rumus): Total Transaksi, Jumlah Akun; Total Debit dan Total Kredit **tanpa transaksi Dibatalkan**; tabel per Jenis Transaksi dan per Status (jumlah, debit, kredit). Pada tabel per jenis/status, transaksi Dibatalkan tetap ikut dihitung di barisnya masing-masing.

### Sheet 3 — "Ringkasan Per Akun"

Satu baris per akun yang ada di export, urut dari outstanding terbesar: Nama, Email, Perusahaan, **Status Kerja Sama** (`Aktif` / `Tidak Aktif` / `Suspended`), **Limit Kredit**, Maks. Outstanding, **Outstanding Saat Ini**, Sisa Limit, Jumlah Transaksi, Total Tagihan, Total Pembayaran, Penyesuaian, Penghapusan Piutang.

Limit, Outstanding Saat Ini, dan Sisa Limit adalah nilai **terkini** akun (saat file dibuat); total tagihan/pembayaran hanya mencakup transaksi yang ikut di export (sesuai filter). Transaksi Dibatalkan tidak dihitung di total.

### Sheet 4 — "Info Export"

Filter yang dipakai, cakupan (`Akun sendiri (email)` / `Akun: nama (email)` / `Semua akun`), siapa yang mengekspor, waktu dibuat, total transaksi, penjelasan debit/kredit dan saldo, serta peringatan **file berisi data kredit dan penagihan, jangan dibagikan tanpa pengamanan**.

Teks dari user/admin (nama, deskripsi) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus.

---

## 3. Hal yang perlu diketahui

- Cakupan data ditentukan **saat file dibuat** (saat worker menjalankan job), berdasarkan permission user saat itu, bukan saat tombol ditekan.
- Customer yang bukan akun Kerja Sama (mis. Personal tanpa transaksi kredit) tidak punya riwayat: filenya kosong, bukan error.
- Field pemilihan akun (`user_id`) sengaja tidak tersedia untuk customer; kalau FE mengirimnya juga, hasilnya `422`.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `kerja-sama-ledger` di `config/exports.php`.
- Kontrak export sekarang boleh menyebut lebih dari satu permission (salah satu cukup). Export lain tidak berubah perilakunya.
- **Tidak ada permission atau seeder baru**, tidak ada perubahan endpoint atau response API kerja sama.
