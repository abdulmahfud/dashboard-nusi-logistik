# Dokumentasi FE — Katalog Produk

Fitur baru: setiap user (reseller/customer) punya **katalog produk sendiri-sendiri** (bukan katalog global yang dikelola admin). Tujuannya mempercepat pembuatan order — FE bisa menampilkan daftar produk tersimpan milik user yang login, lalu saat dipilih, isi otomatis field `detail.*` di form create-order (nama, kategori, berat, dimensi) tanpa perlu diketik ulang.

**Isolasi per user**: user A tidak bisa melihat/mengubah/menghapus produk milik user B (dapat `403`). Superadmin bisa melihat semua produk semua user (untuk keperluan support).

Field katalog memakai **nama dan satuan yang sama persis** dengan `detail.*` di payload create-order (`weight` dalam kg, `panjang`/`lebar`/`tinggi` dalam cm) — jadi FE bisa langsung salin nilai dari produk terpilih ke payload order tanpa perlu mapping/konversi nama field.

---

## 1. Endpoint

Semua di bawah prefix `admin` (`/api/admin/...`), butuh `Authorization: Bearer <token>`.

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| GET | `/admin/products` | `products.index` | List katalog (milik sendiri, atau semua kalau superadmin) |
| POST | `/admin/products` | `products.store` | Tambah produk |
| GET | `/admin/products/{id}` | — (dicek di controller) | Detail produk |
| PUT | `/admin/products/{id}` | `products.update` | Update produk (nama/harga/kategori/berat/dimensi/status) |
| PATCH | `/admin/products/{id}/toggle-active` | `products.update` | Toggle Active/Inactive (satu klik) |
| DELETE | `/admin/products/{id}` | `products.destroy` | Hapus produk |

Permission ini sudah otomatis ada di role `user` (reseller biasa) — tidak perlu setting tambahan untuk role customer biasa.

### GET `/admin/products`

Query params opsional: `search` (cari nama), `category`, `is_active` (`0`/`1`), `per_page`. Khusus superadmin: `user_id` untuk filter ke user tertentu (kalau tidak diisi, superadmin melihat semua user).

Response `200`:
```json
{
  "success": true,
  "message": "List Data Produk",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 5,
        "user_id": 36,
        "name": "Kaos Polos L",
        "price": "75000.00",
        "category": "FASHION & AKSESORIS",
        "weight": "0.30",
        "panjang": 20,
        "lebar": 15,
        "tinggi": 3,
        "is_active": true,
        "created_at": "...",
        "updated_at": "..."
      }
    ],
    "total": 1,
    "per_page": 15
  }
}
```

### POST `/admin/products`

Body:
```json
{
  "name": "Kaos Polos L",
  "price": 75000,
  "category": "FASHION & AKSESORIS",
  "weight": 0.3,
  "panjang": 20,
  "lebar": 15,
  "tinggi": 3
}
```

Validasi:
- `name` **wajib**.
- `weight` **wajib** (> 0) — dibutuhkan untuk perhitungan ongkir.
- `price`, `category`, `panjang`, `lebar`, `tinggi` opsional.
- `is_active` opsional, default `true`.

**`user_id` tidak perlu dikirim** — otomatis diisi dari user yang login. (Khusus superadmin, boleh mengirim `user_id` untuk membuat produk atas nama user lain.)

Response `201` — object produk lengkap. Response `422` kalau validasi gagal.

### GET `/admin/products/{id}`

`404` kalau tidak ditemukan. `403` kalau produk itu bukan milik user yang login (dan bukan superadmin).

### PUT `/admin/products/{id}`

Body: semua field opsional (kirim yang mau diubah saja) — `name`, `price`, `category`, `weight`, `panjang`, `lebar`, `tinggi`, `is_active`. Field ini yang mengcover semua item "Pengelolaan Produk" di dokumen (Edit, Update Harga, Update Berat & Dimensi, Change Category) — semuanya lewat endpoint `PUT` yang sama, tinggal kirim field yang relevan saja.

`403` kalau bukan pemilik produk.

### PATCH `/admin/products/{id}/toggle-active`

Tidak butuh body — otomatis membalik status `is_active` saat ini. Untuk tombol Active/Inactive satu klik di UI (tanpa perlu form).

Response:
```json
{ "success": true, "message": "Status produk berhasil diubah", "data": { "id": 5, "is_active": false, "...": "..." } }
```

### DELETE `/admin/products/{id}`

`403` kalau bukan pemilik. Hapus permanen (bukan soft-delete).

---

## 2. Kaitan dengan Create Order

**Tidak ada perubahan di endpoint create-order** (`POST /admin/expedition/{vendor}/order`). Katalog produk murni untuk **membantu FE mengisi form lebih cepat** — setelah user pilih produk dari katalog, FE tinggal salin nilainya ke `shipping_data.detail`:

```json
// Produk dari katalog:
{ "name": "Kaos Polos L", "category": "FASHION & AKSESORIS", "weight": 0.3, "panjang": 20, "lebar": 15, "tinggi": 3 }

// Langsung dipetakan ke detail order:
"detail": {
  "goods_desc": "Kaos Polos L",
  "category": "FASHION & AKSESORIS",
  "weight": 0.3,
  "panjang": 20,
  "lebar": 15,
  "tinggi": 3,
  "item_value": 75000,   // dari price produk, kalau mau dipakai sebagai nilai barang
  "qty": 1,
  "cod": 0,
  "insurance": 0
}
```

Field lain di `detail` (`qty`, `cod`, `insurance`, `instruction`) tetap diisi user seperti biasa saat itu juga — tidak disimpan di katalog produk karena sifatnya per-transaksi, bukan sifat tetap dari produk itu sendiri.

---

## 3. Catatan scope

Fitur ini hanya mencakup CRUD katalog produk milik user (sesuai `docs/flow-prd/katalog/Flow Katalog Produk.pdf`). Tidak ada fitur tambahan di luar itu (misalnya kategori produk sebagai master data terpisah, gambar produk, atau stok) — kalau dibutuhkan nanti, perlu pengembangan lanjutan.
