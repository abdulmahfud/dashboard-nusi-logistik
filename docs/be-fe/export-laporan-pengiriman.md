# Data Export Laporan Pengiriman (Excel, diproses lewat antrian)

**Status**: sudah tersedia di backend (2026-09-25). Ini export pertama dari daftar di `docs/export/export.md`; export lain akan memakai endpoint dan pola yang **sama persis** (cukup beda nilai `type`).

Export **tidak langsung mengunduh file**. Backend memproses di antrian (queue), jadi export besar tidak membuat request timeout. FE membuat permintaan, lalu user mengunduh file dari halaman khusus daftar export setelah statusnya `completed`.

---

## 1. Alur untuk FE

```
POST /admin/exports            → 202, status "pending"   (klik tombol "Export")
GET  /admin/exports/{id}       → poll sampai "completed" / "failed"
GET  /admin/exports/{id}/download → unduh file .xlsx
GET  /admin/exports            → daftar semua export milik user (halaman "Download Export")
```

Saran UI:

- Tombol **Export** di halaman Laporan Pengiriman (dengan pilihan tanggal) → panggil `POST`, tampilkan toast "Export sedang diproses, cek di menu Download Export".
- Menu/halaman baru **Download Export**: tabel dari `GET /admin/exports`, kolom: jenis (`type_label`), periode (`filters`), status, jumlah baris (`total_rows`), ukuran (`file_size`), waktu dibuat, berlaku sampai (`expires_at`), tombol **Unduh** (aktif hanya kalau `is_downloadable`) dan **Hapus**.
- Selama ada item `pending`/`processing`, refresh daftar tiap 3–5 detik (atau poll `GET /admin/exports/{id}` per item), berhenti begitu semuanya `completed`/`failed`.

**Unduh file harus lewat request ber-token**, bukan `<a href>` biasa, karena endpoint butuh header `Authorization: Bearer ...`. Ambil sebagai blob lalu picu download:

```js
const res = await fetch(`${API}/admin/exports/${id}/download`, { headers: { Authorization: `Bearer ${token}` } });
if (!res.ok) { const err = await res.json(); /* tampilkan err.message */ return; }
const filename = /filename="?([^";]+)"?/.exec(res.headers.get('Content-Disposition') ?? '')?.[1] ?? 'export.xlsx';
const url = URL.createObjectURL(await res.blob());
Object.assign(document.createElement('a'), { href: url, download: filename }).click();
URL.revokeObjectURL(url);
```

Header `Content-Disposition` sekarang sudah di-expose lewat CORS, jadi nama file dari backend bisa dibaca FE.

---

## 2. Endpoint

Semua di bawah prefix `/api/admin`, wajib login (`Authorization: Bearer`).

### `POST /admin/exports` — buat permintaan export

Body (JSON):

| Field | Wajib | Keterangan |
|---|---|---|
| `type` | ya | Saat ini hanya `shipping-report` (Laporan Pengiriman) |
| `start_date` | tidak | `YYYY-MM-DD`, tanggal awal (berdasarkan **tanggal order dibuat**), inklusif |
| `end_date` | tidak | `YYYY-MM-DD`, tanggal akhir, inklusif. Tidak boleh sebelum `start_date` |

Tanpa `start_date`/`end_date` → **semua data** (tanpa batas waktu). Boleh mengirim salah satunya saja.

Response sukses `202`:

```json
{
  "success": true,
  "message": "Export sedang diproses. File bisa diunduh dari daftar export setelah selesai.",
  "data": {
    "id": 12,
    "user_id": 8,
    "type": "shipping-report",
    "type_label": "Laporan Pengiriman",
    "filters": { "start_date": "2026-09-01", "end_date": "2026-09-30" },
    "status": "pending",
    "is_downloadable": false,
    "file_name": null,
    "file_size": null,
    "total_rows": null,
    "error_message": null,
    "started_at": null,
    "completed_at": null,
    "expires_at": null,
    "created_at": "2026-09-25T03:59:00.000000Z",
    "updated_at": "2026-09-25T03:59:00.000000Z"
  }
}
```

Error:

| Status | Kapan | Bentuk |
|---|---|---|
| `422` | `type` tidak dikenal / tanggal tidak valid / `end_date` < `start_date` | format validasi Laravel: `{ "message": "...", "errors": { "end_date": ["..."] } }` |
| `403` | user tidak punya izin export ini (untuk Laporan Pengiriman: butuh `orders.index`) | `{ "success": false, "message": "..." }` |
| `429` | sudah ada 3 export yang masih `pending`/`processing` (`{ "success": false, "message": "..." }`), atau lebih dari 10 request/menit (respons standar Laravel `{ "message": "Too Many Attempts." }`) | lihat kolom kiri |

### `GET /admin/exports` — daftar export milik saya

Query opsional: `type`, `status` (`pending`, `processing`, `completed`, `failed`, `expired`), `per_page` (1–50, default 15). Urutan terbaru dulu.

```json
{ "success": true, "message": "Daftar export", "data": { "current_page": 1, "data": [ /* item seperti di atas */ ], "last_page": 1, "per_page": 15, "total": 3 } }
```

Hanya export **milik user yang login** yang tampil, termasuk untuk admin (admin tidak melihat export orang lain).

### `GET /admin/exports/{id}` — status satu export

Response `{ "success": true, "message": "Detail export", "data": { ...item... } }`. Export milik orang lain / tidak ada → `404`.

### `GET /admin/exports/{id}/download` — unduh file

Sukses: `200` file `.xlsx` (`Content-Disposition: attachment; filename=laporan-pengiriman_...xlsx`).

| Status | Arti |
|---|---|
| `409` | Belum selesai (`pending`/`processing`) |
| `422` | Gagal dibuat (`failed`) — `message` berisi penjelasan singkat |
| `410` | Sudah kedaluwarsa / file sudah dihapus — user perlu membuat export baru |
| `404` | Bukan milik user ini / tidak ada |

Selain `200`, body-nya JSON `{ "success": false, "message": "..." }`.

### `DELETE /admin/exports/{id}` — hapus export (beserta filenya)

`200` sukses. `409` kalau sedang `processing`. Export `pending` boleh dihapus.

---

## 3. Status

| `status` | Arti | `is_downloadable` |
|---|---|---|
| `pending` | Antre, belum diproses | `false` |
| `processing` | Sedang dibuat | `false` |
| `completed` | Selesai, file siap diunduh | `true` |
| `failed` | Gagal (lihat `error_message`); user bisa membuat export baru | `false` |
| `expired` | Dulu `completed`, tapi file sudah lewat masa berlaku dan tidak bisa diunduh lagi | `false` |

- File disimpan **7 hari** sejak selesai (`expires_at`), lalu otomatis dihapus. Tampilkan `expires_at` supaya user tahu batas waktunya.
- `expired` dihitung otomatis dari `expires_at`; tidak ada proses terpisah yang mengubah status.
- Maksimal **3 export aktif** (`pending`/`processing`) per user dalam satu waktu.

---

## 4. Cakupan data (siapa melihat apa)

Cakupan ditentukan saat file **dibuat**, mengikuti izin user pada saat itu — sama dengan aturan halaman Laporan Pengiriman (`GET /admin/list-orders`):

| Siapa | Isi file |
|---|---|
| Customer (personal / corporate / agen) | Hanya order **miliknya sendiri** |
| `superadmin`, dan staff dengan izin `orders.view_all` (`admin`, `operations`, `customer-service`) | Order **semua akun** (global) |

Yang bisa membuat export ini: semua yang punya izin `orders.index` (izin yang sama dengan halaman Laporan Pengiriman). Untuk export global, kolom **Nama Akun** dan **Email Akun** menunjukkan pemilik order.

Semua status order ikut diexport (termasuk `menunggu_pembayaran` dan `dibatalkan`), seperti yang tampil di daftar Laporan Pengiriman. Urutan baris: order paling lama dulu.

---

## 5. Isi file Excel

Satu sheet bernama **Laporan Pengiriman**: baris pertama header (tebal, ada filter dan baris header dibekukan). **33 kolom pertama sama persis dengan template** `Tamplate Data Export Laporan Pengiriman.xlsx` (urutan dan nama), lalu 8 kolom tambahan di paling kanan.

| Kolom | Sumber / catatan |
|---|---|
| No. Waybill | Nomor resi (AWB). Kosong kalau belum dapat resi dari ekspedisi |
| Tanggal Pengiriman | Tanggal order dibuat (`YYYY-MM-DD`) |
| Nama / Telepon / Kota / Kecamatan Pengirim | Data pengirim **saat order dibuat**; kalau tidak tersimpan, diambil dari buku alamat |
| Alamat Pengirim | Alamat + provinsi pengirim (template tidak punya kolom provinsi pengirim, jadi digabung di sini) |
| Penerima, Telepon Penerima, Provinsi / Kota / Kecamatan / Alamat Penerima | Sama seperti pengirim |
| Jumlah Barang | Qty paket |
| Tipe Barang | Kategori barang yang dipilih di form (mis. `DOKUMEN`) |
| Berat | Kg |
| Nilai Barang | Rupiah |
| Layanan | Produk layanan ekspedisi (mis. `REGULER`, `FASTTRACK`); label pembayaran `COD` tidak dianggap layanan |
| Metode Pembayaran | `COD`, `Saldo Wallet`, `Kerja Sama`, atau nama metode/channel pembayaran online. Kosong bila belum ada pembayaran atau order termasuk pembayaran massal |
| Nama Barang | Deskripsi barang |
| Kategori Barang | **Selalu kosong** — data order hanya menyimpan satu jenis barang, sudah masuk ke *Tipe Barang* |
| Biaya Kirim | Ongkir yang **benar-benar dibayar** = Total − Biaya Asuransi (sudah termasuk potongan diskon bila ada) |
| Biaya Asuransi | Diturunkan: `0,5% × Nilai Barang` bila asuransi dicentang, selain itu kosong (nominal premi tidak disimpan di order) |
| Biaya Diskon | **Selalu kosong** — nominal diskon tidak disimpan per order (Total sudah berupa harga setelah diskon) |
| Total Biaya Setelah Diskon | Nominal yang ditagihkan untuk order. Kosong bila tidak tersimpan (sebagian order lama) |
| Waktu Terima | Waktu status `sampai_tujuan` tercatat |
| Tanda TTD | Status pengiriman (mis. `Sampai Tujuan`, `Proses Pengiriman`), mengikuti contoh di template. Data tanda tangan/nama penerima belum tersimpan di sistem |
| COD | `COD` atau `NONCOD` |
| Status Cancel | `Dibatalkan` bila order dibatalkan |
| Alasan Cancel | Keterangan pembatalan yang tercatat di riwayat order (mis. `Order cancelled via JNTEXPRESS`); alasan terstruktur belum disimpan |
| PIC Cancel | **Selalu kosong** — siapa yang membatalkan belum tercatat |
| Tanggal Cancel | Waktu pembatalan tercatat |
| Keterangan | Instruksi/catatan untuk kurir |
| **Tambahan:** Ekspedisi | Nama vendor (huruf besar) |
| **Tambahan:** No. Referensi | Nomor referensi order |
| **Tambahan:** Nama Akun, Email Akun | Pemilik order |
| **Tambahan:** Nilai COD | Nominal COD (0 bila non-COD) |
| **Tambahan:** Panjang / Lebar / Tinggi (cm) | Dimensi paket |

Catatan format:

- Nomor telepon ditampilkan **lengkap** (contoh di template yang tersamarkan hanya data contoh).
- Kolom uang dan berat adalah **angka** (bisa dijumlahkan di Excel); resi, telepon, dan tanggal adalah teks.
- Waktu memakai zona **WIB**.
- Isian teks dari user (nama barang, alamat, dll.) selalu ditulis sebagai teks biasa, sehingga isian berawalan `=` tidak dieksekusi Excel sebagai rumus.

Beberapa kolom kosong karena datanya memang belum tersimpan di sistem (Biaya Diskon, PIC Cancel, Kategori Barang, alasan cancel terstruktur). Kalau nanti dibutuhkan, FE/BE perlu mulai menyimpannya saat order dibuat/dibatalkan.

---

## 6. Ringkasan cepat perubahan BE

- Tabel baru `export_requests`, endpoint `/admin/exports*`, job antrian `GenerateExportJob`, library `openspout/openspout` (penulis Excel hemat memori).
- Header CORS `Content-Disposition` di-expose.
- Tidak ada permission baru: memakai `orders.index` / `orders.view_all` yang sudah ada.
