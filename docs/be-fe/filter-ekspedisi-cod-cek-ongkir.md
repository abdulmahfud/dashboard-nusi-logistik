# Filter Ekspedisi Berdasarkan Setting COD, Sejak Cek Ongkir

**Status**: mekanisme intinya **sudah ada sejak lama** (saat fitur `expedition_vendor_settings` dibuat) — dokumen ini menjelaskan cara memakainya untuk kasus yang belum pernah dijelaskan sebelumnya: menyembunyikan/menolak ekspedisi yang COD-nya dinonaktifkan **sejak tahap cek ongkir**, bukan baru ditolak saat submit order.

## Masalah yang dijawab

Sebelum ini: kalau admin menonaktifkan COD untuk satu ekspedisi (`PATCH /admin/expedition-vendor-settings/{vendor}` dengan `is_cod_active: false`), ekspedisi itu **masih tampil dengan harga** saat user cek ongkir untuk kiriman COD. User baru tahu ekspedisi itu tidak bisa dipakai setelah pilih ekspedisi itu dan coba submit order COD — baru di situ backend menolak (`422`).

Sekarang ada 2 lapis supaya ekspedisi itu **tidak perlu sampai tampil** di hasil cek ongkir:

## 1. Cara yang disarankan: filter di FE sebelum panggil cek ongkir

`GET /admin/expedition-vendor-settings` (permission `expedition.settings.view` — sudah dipakai FE untuk halaman Cek Ongkir & Paket Reguler) sudah mengembalikan `is_active` dan `is_cod_active` per vendor, lihat contoh di `docs/be-fe/update-vendor-list-diskon-flat-ongkir.md`. **Pakai field ini sebelum memanggil cek ongkir per vendor**:

- Ambil daftar vendor sekali (atau dari cache yang sudah ada).
- Kalau user memilih metode **COD**: jangan panggil/tampilkan vendor dengan `is_cod_active: false` sama sekali.
- Kalau `is_active: false` (ekspedisi dinonaktifkan total): jangan panggil/tampilkan vendor itu, apapun metode pembayarannya — ini sudah berlaku sejak fitur vendor settings dibuat, bukan hal baru.

Ini yang paling efisien — tidak ada request cek-ongkir yang terbuang untuk ekspedisi yang sudah pasti tidak bisa dipakai.

## 2. Lapis kedua (baru): cek ongkir sendiri bisa menolak kalau diberi tahu ini COD

`POST /admin/expedition/{vendor}/shipment_cost` sekarang menerima field opsional **`is_cod`** (boolean) di body — lihat `docs/payload-fe.md` §1. Kalau dikirim `true` dan vendor itu `is_cod_active: false`, response-nya:

```json
{
  "success": false,
  "message": "Fitur COD untuk ekspedisi ini sedang dinonaktifkan."
}
```
HTTP `422` — pesan yang sama persis dengan yang sudah ada saat submit order COD ke vendor yang dinonaktifkan.

**Field ini opsional.** Kalau tidak dikirim (seperti payload cek ongkir yang sudah ada selama ini), perilakunya **tidak berubah** — vendor tetap tampil dengan harga meskipun COD-nya nonaktif. Jadi ini aman dirilis tanpa FE langsung berubah apa pun; baru bermanfaat kalau FE mulai mengirim `is_cod`.

**Kenapa perlu lapis ini juga**, bukan cukup §1 saja: supaya tetap aman kalau data vendor settings di FE sempat basi (cache lama) atau ada jalur lain yang memanggil cek ongkir tanpa lewat filter di atas — konsisten dengan prinsip "FE menyaring untuk UX, BE menolak untuk keamanan data" yang sudah dipakai di fitur lain.

### Yang perlu diperhatikan

- **Jangan** pakai `service_code: "COD"` di endpoint cek ongkir untuk maksud ini. Di endpoint ini `service_code` berarti **jenis produk kurir** (REG/OKE/YES/dst — dibaca langsung oleh beberapa vendor seperti ID Express, Ninja Express, Pos Indonesia untuk memilih produk yang dicek harganya), bukan metode pembayaran. Mengirim `"COD"` di situ bisa membuat vendor tersebut gagal mencocokkan produk dan hasil cek ongkir jadi salah/error. **Pakai `is_cod` saja.**
- Field ini **tidak mempengaruhi harga atau diskon** — diskon pengiriman tetap tidak dibedakan per jenis layanan (REGULER/COD), sesuai keputusan di `docs/be-fe/update-hapus-jenis-layanan-diskon-flat-ongkir.md`. `is_cod` cuma dipakai untuk gate ketersediaan vendor, sama sekali tidak disentuh oleh logic diskon/flat ongkir.
- Perilaku **submit order** tidak berubah oleh update ini — order COD ke vendor yang `is_cod_active: false` sudah ditolak `422` sejak sebelumnya (`docs/payload-fe.md` §4, `ExpeditionAvailabilityService`).
- `lionShipmentCost` (endpoint GET khusus Lion) menerima sinyal yang sama lewat query string: `?is_cod=1`.

## Ringkasan untuk FE

| Langkah | Kapan | Wajib? |
|---|---|---|
| Filter vendor pakai `is_active`/`is_cod_active` dari `GET /admin/expedition-vendor-settings`, sebelum tampilkan tombol ekspedisi | Selalu, terutama saat metode COD dipilih | **Sangat disarankan** — mencegah user melihat harga untuk ekspedisi yang tidak bisa dipakai |
| Kirim `is_cod: true` di body cek ongkir saat metode COD | Setiap kali cek ongkir untuk kiriman COD | Opsional, tapi jadi lapis pengaman kalau langkah di atas terlewat |
