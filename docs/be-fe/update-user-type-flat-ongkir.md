# Update FE — Flat Ongkir Bisa Dibedakan per Tipe Akun (Personal/Corporate)

Update ini menyangkut fitur yang dokumentasinya sudah pernah dikirim: [flat-ongkir-jawa-bali.md](flat-ongkir-jawa-bali.md). Tidak ada endpoint baru — ini field baru di endpoint yang sudah ada (`/admin/flat-shipping-rates`), plus satu syarat tambahan saat sistem mencocokkan program flat ke sebuah cek ongkir.

## Apa yang berubah

**Program flat ongkir sekarang punya field `user_type`**, sama persis konsepnya dengan `user_type` di Diskon Pengiriman ([diskon-pengiriman.md](diskon-pengiriman.md)):

| Nilai | Arti |
|---|---|
| `"personal"` | Program ini **hanya** berlaku untuk akun Personal |
| `"corporate"` | Program ini **hanya** berlaku untuk akun Corporate |
| `null` / kosong | Program berlaku untuk **semua tipe akun** (default — sama seperti perilaku sebelum update ini) |

**Sebelumnya tidak ada field ini sama sekali** — semua program flat otomatis berlaku untuk semua tipe akun. Setelah update ini, admin bisa membuat 2 program berbeda untuk rute yang sama persis — satu harga untuk Personal, satu harga lain untuk Corporate.

## Yang TIDAK berubah

- **Flat rate tetap menang mutlak atas diskon.** Kalau sebuah shipment match ke program flat (termasuk yang sekarang di-scope per tipe akun), diskon pengiriman tetap diabaikan total seperti sebelumnya — ini tidak berubah oleh update ini.
- Program lama (`user_type` kosong, dibuat sebelum update ini) **tetap berlaku untuk semua tipe akun** persis seperti sebelumnya — tidak ada migrasi data yang mengubah perilaku program yang sudah ada.
- Resolusi konflik antar program flat yang sama-sama match tetap lewat `priority` (1 tertinggi – 5 terendah) — field `user_type` cuma jadi **syarat tambahan** di eligibility, bukan pengganti `priority`. Lihat §"Contoh" di bawah untuk bagaimana keduanya berinteraksi.

## Field baru di endpoint admin

`POST /admin/flat-shipping-rates` dan `PUT /admin/flat-shipping-rates/{id}`, body:

```json
{
  "name": "Flat Ongkir Jawa & Bali (Corporate)",
  "vendor": null,
  "user_type": "corporate",
  "flat_price": 20000,
  "covered_provinces": ["DKI Jakarta", "Jawa Barat"],
  "max_weight": 5,
  "priority": 1
}
```

Validasi: `user_type` **opsional**, harus salah satu dari `"personal"` / `"corporate"` kalau diisi (nilai lain → `422`). Dikosongkan = berlaku semua tipe akun.

`GET /admin/flat-shipping-rates` sekarang juga menerima query **`user_type`** untuk memfilter daftar program flat di halaman admin (`?user_type=corporate`), digabung bebas dengan `vendor`/`is_active`/`search` yang sudah ada.

Response (list/detail/create/update) menyertakan field `user_type` apa adanya (`"personal"`, `"corporate"`, atau `null`) — tidak ada field label terpisah (`user_type_label`), beda dengan beberapa fitur lain yang punya field label; FE yang perlu label bisa pakai pemetaan sederhana: `personal` → "Personal", `corporate` → "Corporate", `null` → "Semua Tipe Akun".

## Bagaimana sistem memilih program yang tepat saat cek ongkir

Sama seperti sebelumnya (berdasarkan `priority`, angka terkecil menang), ditambah satu saringan: **program yang di-scope ke tipe akun tertentu hanya ikut dipertimbangkan untuk akun dengan tipe itu.** Program `user_type: null` tetap ikut dipertimbangkan untuk siapa saja.

### Contoh

Dua program untuk rute & vendor yang sama:
- Program A: `user_type: "corporate"`, harga Rp20.000, `priority: 1`
- Program B: `user_type: null` (semua tipe akun), harga Rp15.000, `priority: 3`

| Yang cek ongkir | Program yang kepakai | Alasan |
|---|---|---|
| Akun Corporate | Program A (Rp20.000) | Keduanya eligible untuk Corporate, tapi A menang lewat `priority` (1 < 3) |
| Akun Personal | Program B (Rp15.000) | A tidak eligible sama sekali untuk Personal (beda `user_type`) — B satu-satunya pilihan |

Ini **sama persis** dengan cara `priority` sudah bekerja untuk kombinasi vendor-spesifik vs vendor-umum (lihat `docs/be-fe/update-skala-prioritas-diskon-flat-ongkir.md`) — `user_type` cuma menambah satu sumbu saringan yang sama jenisnya dengan `vendor`.

## Yang perlu dilakukan FE

- **Form create/edit Flat Ongkir**: tambahkan field pilihan tipe akun (dropdown/radio: "Semua Tipe Akun" / "Personal" / "Corporate") yang mengirim `user_type` (`null`/omit, `"personal"`, atau `"corporate"`).
- **Halaman daftar Flat Ongkir**: tampilkan kolom/badge tipe akun per program (pakai pemetaan label di atas), dan opsional tambahkan filter `user_type` di query list kalau diinginkan.
- **Tidak ada perubahan di alur cek ongkir/buat order dari sisi FE** — response cek ongkir tetap memakai field yang sama (`flat_rate_applied`, `flat_rate_name`, field harga yang di-override per vendor) seperti didokumentasikan di `flat-ongkir-jawa-bali.md` §2. Sistem otomatis memilih program yang sesuai `account_type` user yang login, FE tidak perlu kirim parameter tambahan apa pun saat cek ongkir.

## Data lama

Ada 1 program flat tersimpan di production saat ini (`Flat Ongkir Pulau Jawa`, vendor IdExpress) — statusnya **nonaktif**, dan field `user_type` barunya otomatis `null` (berlaku semua tipe akun), jadi tidak ada perubahan perilaku untuk program ini sama sekali.
