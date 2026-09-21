# Dokumentasi FE → BE — Daftar Order Menunggu Pembayaran (`/dashboard/paket/pembayaran-paket`)

**Status**: pertanyaan/permintaan dari FE, belum diimplementasikan. Terkait halaman **Pembayaran Paket**.

---

## 1. Cara halaman bekerja sekarang

Halaman memanggil `GET /admin/list-orders` (tanpa parameter), lalu **di FE**:

1. menyaring hanya order berstatus `menunggu_pembayaran`,
2. mengambil nominal bayar dari `request_payload.payment_amount`,
3. bila kosong, **FE menghitung sendiri**: biaya kirim dasar **Rp100.000 (hardcode)** + biaya COD 4% dari nilai barang untuk order COD.

Desain baru menambahkan filter **rentang tanggal**, sehingga FE meneruskan `start_date` / `end_date` ke endpoint yang sama.

Ada tiga hal yang membuat pendekatan ini rapuh dan butuh keterangan/perubahan BE.

---

## 2. Permintaan & pertanyaan

### 2.1 Nominal bayar — jangan biarkan FE menebak

Jika `request_payload.payment_amount` tidak ada, FE menampilkan **Rp100.000 (+4% untuk COD)** — angka itu **karangan FE**, bukan nilai dari sistem, dan bisa salah tagih.

**Mohon BE**: pastikan setiap order `menunggu_pembayaran` selalu punya nominal yang harus dibayar, idealnya sebagai field **top-level** yang jelas, mis. `payment_amount`, dan konfirmasi bahwa itu **angka final** yang sama dengan yang akan ditagih saat `POST` pembayaran (`createPayment`). Setelah itu FE menghapus perhitungan fallback.

Pertanyaan: adakah order `menunggu_pembayaran` yang **legit tidak punya** `request_payload.payment_amount` (mis. order lama/dibuat lewat jalur lain)? Jika ada, nominalnya diambil dari mana?

### 2.2 Filter status di server

FE mengunduh **semua order** lalu membuang yang bukan `menunggu_pembayaran`. Untuk akun dengan ribuan order ini boros.

**Mohon BE**: dukung query `status=menunggu_pembayaran` pada `GET /admin/list-orders` (nilai status lain, mis. untuk laporan pengiriman, juga akan berguna). FE akan mengirimnya dan tetap menyaring lagi di sisi FE sebagai pengaman.

### 2.3 Rentang tanggal default & order lama yang belum dibayar

`GET /admin/list-orders` menerima `start_date` & `end_date` (format `YYYY-MM-DD`).

Pertanyaan:

1. **Bila keduanya tidak dikirim, rentang defaultnya apa** — semua data, atau bulan berjalan (seperti `laporan-aktivitas-pengiriman`)?
2. Jika defaultnya **bulan berjalan**, order yang **menunggu pembayaran dari bulan lalu akan tidak muncul** di halaman ini — padahal justru itu yang paling perlu ditagih. Untuk kasus `status=menunggu_pembayaran`, mohon BE **tidak membatasi bulan secara default** (semua order pending, kapan pun dibuat), kecuali `start_date`/`end_date` dikirim eksplisit.
3. Tanggal yang difilter adalah `created_at` order (zona Asia/Jakarta), inklusif kedua ujung?

### 2.4 (Opsional) Paginasi

Daftar order pending belum berpaginasi. Jika jumlahnya bisa besar, mohon dukung `page` / `per_page` pada endpoint ini juga; FE akan menambahkan pagination bernomor seperti halaman lain.

---

## 3. Tidak dimasukkan ke desain (FYI)

Desain menampilkan filter **"Semua Status"** dan **"Semua Metode Pembayaran"**. FE **tidak** menampilkannya karena: halaman ini hanya berisi order dengan satu status (`menunggu_pembayaran`), dan metode pembayaran baru dipilih **saat** membayar (belum ada di order yang pending). Kalau BE punya rencana menampilkan status pembayaran lain (mis. `kedaluwarsa`) di halaman ini, kabari FE.

---

## 4. Rencana FE setelah dikonfirmasi

- Ganti fallback hardcode dengan field `payment_amount` dari BE (hapus `calculatePaymentAmount`).
- Kirim `status=menunggu_pembayaran` (+ tanggal) ke API; hapus unduh-semua-lalu-saring bila BE sudah mendukung.
- Tambah pagination bernomor jika BE mendukung `page`/`per_page`.
