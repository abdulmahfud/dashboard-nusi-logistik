# Data Export Aktivitas Pengiriman (Excel, khusus admin)

**Status**: sudah tersedia di backend (2026-09-25). Export ke-2 dari `docs/export/export.md`.

**Khusus admin.** Hanya user dengan izin **`reports.shipping.view`** (saat ini `superadmin` dan `admin`) yang bisa membuatnya. Customer (`user`) dan staff lain (`finance`, `sales`, `operations`, `customer-service`) mendapat `403`. Tidak ada versi "data milik sendiri". Tampilkan tombolnya hanya kalau `hasPermission("reports.shipping.view")`.

Mekanismenya **sama persis** dengan export Laporan Pengiriman: diproses di antrian, lalu diunduh dari halaman daftar export. Alur, endpoint status/daftar/unduh/hapus, kode error, masa berlaku file (7 hari), dan contoh kode unduh ada di **`docs/be-fe/export-laporan-pengiriman.md`** — dokumen ini hanya menjelaskan yang berbeda.

---

## 1. Membuat export

`POST /api/admin/exports`

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | `shipping-activity` |
| `start_date` | tidak | `YYYY-MM-DD`, berdasarkan **tanggal order dibuat**, inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, inklusif, tidak boleh sebelum `start_date` |
| `user_id` | tidak | Batasi ke satu akun. Harus id user yang ada (`422` kalau tidak) |

Tanpa filter apa pun → **semua akun, semua waktu**. Response `202` dan bentuk item export sama dengan dokumen sebelumnya; `type_label` berisi `Aktivitas Pengiriman`. Nama file: `aktivitas-pengiriman_{start}_{end}_{waktu}.xlsx`.

```json
{ "type": "shipping-activity", "start_date": "2026-09-01", "end_date": "2026-09-30" }
```

Error khusus: `403` bila user tidak punya `reports.shipping.view`.

---

## 2. Isi file: 3 sheet

### Sheet 1 — "Aktivitas Pengiriman" (satu baris per akun)

Hanya akun yang punya minimal satu order pada periode yang tampil. Urutan: pengiriman terbanyak dulu.

| Kolom | Isi |
|---|---|
| No | Nomor urut |
| Nama Akun, Email Akun | Pemilik akun |
| Tipe Akun | `Personal`, `Corporate`, atau `Agen` |
| Mode Penagihan | `Prepaid` atau `Postpaid (Kerja Sama)` |
| Total Order | Semua order pada periode, **semua status termasuk Dibatalkan** |
| Total Pengiriman | Order **selain Dibatalkan** |
| Total Ongkir | Jumlah nominal yang ditagihkan (setelah diskon, termasuk asuransi), tanpa order Dibatalkan |
| Pengiriman Tanpa Data Ongkir | Jumlah pengiriman yang nominalnya tidak tersimpan (sebagian order lama); tidak ikut dijumlahkan di Total Ongkir |
| Jumlah COD, Total Nilai COD | Jumlah order COD dan total nilai CODnya (tanpa order Dibatalkan) |
| Menunggu Pembayaran, Belum Diproses, Belum di Ekspedisi, Proses Pengiriman, Kendala Pengiriman, Sampai Tujuan, Retur, Dibatalkan | Jumlah order per status (semua status dihitung di sini) |
| Pengiriman Pertama, Pengiriman Terakhir | Tanggal order pertama dan terakhir pada periode |
| Limit Kredit, Maks. Outstanding, Outstanding Saat Ini, Kredit Terpakai (Periode) | **Hanya untuk akun Corporate**, kosong untuk tipe lain. *Outstanding Saat Ini* adalah kondisi sekarang, bukan per akhir periode. *Kredit Terpakai* mengikuti periode |

### Sheet 2 — "Per Ekspedisi" (satu baris per akun × ekspedisi)

Nama Akun, Email Akun, Tipe Akun, Ekspedisi (huruf besar; `idexpress` dan `IDEXPRESS` digabung), Total Pengiriman, Total Ongkir. Tanpa order Dibatalkan.

### Sheet 3 — "Info Export"

Ringkasan filter yang dipakai (periode, akun), waktu dibuat, jumlah akun, total pengiriman, total ongkir, dan catatan cara hitung, supaya file tetap bisa dipahami kalau dibagikan ke orang lain.

Semua sheet punya header tebal, baris header dibekukan, dan filter (kecuali Info Export). Kolom uang dan jumlah adalah angka (bisa dijumlahkan di Excel). Teks dari user (nama akun dll.) selalu ditulis sebagai teks biasa.

---

## 3. Perbedaan dengan tampilan laporan di layar

Endpoint `GET /admin/reports/users/{user}/shipping` (laporan per akun di layar) dan export ini memakai aturan yang sama untuk *apa yang dihitung* (tanpa Dibatalkan, periode berdasarkan tanggal order dibuat), tapi **angka ongkir bisa berbeda**:

- Laporan di layar hanya menjumlahkan nominal yang tersimpan langsung di order. Sekitar sepertiga order (terutama yang lama) tidak punya nominal itu, sehingga ongkirnya dianggap kosong.
- Export mencari nominal juga dari pembayaran yang terhubung ke order dan dari ledger kredit kerja sama, jadi biasanya **lebih lengkap**. Yang tetap tidak ketemu dihitung di *Pengiriman Tanpa Data Ongkir*.
- Laporan di layar memisahkan ekspedisi yang huruf besar/kecilnya beda (`IDEXPRESS` dan `idexpress` jadi dua baris); export menggabungkannya.

Jadi kalau admin membandingkan export dengan layar dan angkanya tidak persis sama, itu penyebabnya, bukan salah hitung.

---

## 4. Ringkasan perubahan BE

- Tipe export baru `shipping-activity` di `config/exports.php`; tidak ada tabel, endpoint, atau permission baru (memakai `reports.shipping.view` yang sudah ada).
- Logika "berapa yang ditagihkan untuk sebuah order" dipisah ke satu kelas bersama dan dipakai juga oleh export Laporan Pengiriman (hasilnya tidak berubah).
