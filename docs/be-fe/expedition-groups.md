# Dokumentasi FE — Grup Ekspedisi (Reguler & COD / Cargo)

Fitur baru: admin bisa mengelompokkan vendor ekspedisi ke dalam **grup** (mis. "Reguler & COD" vs "Cargo"), supaya FE bisa menampilkan vendor dalam tab/section terpisah. Setiap grup punya **estimasi pengiriman generik** (bukan per-vendor, bukan per-rute) berdasarkan jarak: dalam kota, dalam pulau (contoh Jawa), dan luar pulau — ini teks statis untuk ditampilkan sebagai info umum, **bukan pengganti** ETD/`estimated_days` yang sudah dikembalikan tiap vendor di hasil cek ongkir (yang itu tetap real per-rute dari API vendor, tidak berubah oleh fitur ini).

CRUD penuh — admin bisa membuat grup baru, bukan cuma 2 default ini.

---

## 1. Default data

Sudah di-seed di backend, 2 grup berikut selalu ada sejak awal:

| Grup | `slug` | Dalam Kota | Dalam Pulau | Luar Pulau |
|---|---|---|---|---|
| Reguler & COD | `reguler_cod` | 1-3 hari | 3-5 hari | 4-7 hari |
| Cargo | `cargo` | 1-3 hari | 3-7 hari | 10-14 hari |

**Default penugasan vendor**: `jntcargo` otomatis masuk grup **Cargo**; 10 vendor lain (`jne`, `sap`, `lion`, `jntexpress`, `paxel`, `idexpress`, `posindonesia`, `ninja`, `anteraja`, `gosend`) masuk grup **Reguler & COD**. Admin bisa memindahkan vendor ke grup lain kapan saja (lihat §3).

---

## 2. Endpoint CRUD grup — `/admin/expedition-groups`

| Method | Path | Permission | Keterangan |
|---|---|---|---|
| GET | `/admin/expedition-groups` | `expedition-groups.view` | List semua grup |
| POST | `/admin/expedition-groups` | `expedition-groups.create` | Buat grup baru |
| GET | `/admin/expedition-groups/{id}` | `expedition-groups.view` | Detail satu grup |
| PUT | `/admin/expedition-groups/{id}` | `expedition-groups.update` | Update grup |
| DELETE | `/admin/expedition-groups/{id}` | `expedition-groups.delete` | Hapus grup |

Permission ini otomatis ada untuk `superadmin` (semua) dan `admin` (semua **kecuali** `.delete`) — sama seperti pola permission resource lain di sistem ini (flat-shipping-rates, bank-accounts, dst). Response wrapper: `{success, message, data}`.

### GET `/admin/expedition-groups`

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Reguler & COD",
      "slug": "reguler_cod",
      "estimasi_dalam_kota": "1-3 hari",
      "estimasi_dalam_pulau": "3-5 hari",
      "estimasi_luar_pulau": "4-7 hari",
      "description": null,
      "created_at": "...",
      "updated_at": "...",
      "vendor_settings_count": 10,
      "vendors": ["jne", "sap", "lion", "jntexpress", "paxel", "idexpress", "posindonesia", "ninja", "anteraja", "gosend"]
    },
    {
      "id": 2,
      "name": "Cargo",
      "slug": "cargo",
      "estimasi_dalam_kota": "1-3 hari",
      "estimasi_dalam_pulau": "3-7 hari",
      "estimasi_luar_pulau": "10-14 hari",
      "description": null,
      "vendor_settings_count": 1,
      "vendors": ["jntcargo"]
    }
  ]
}
```

`vendors` — array kunci vendor (lowercase, kunci `ExpeditionFactory`, sama dengan field `vendor` di `GET /admin/expedition-vendor-settings`) yang sedang ada di grup ini. Dipakai FE untuk langsung tahu vendor mana masuk tab mana, tanpa perlu join manual ke endpoint vendor-settings.

### POST `/admin/expedition-groups`

Body:
```json
{
  "name": "Instant",
  "slug": "instant",
  "estimasi_dalam_kota": "0-1 hari",
  "estimasi_dalam_pulau": null,
  "estimasi_luar_pulau": null,
  "description": "Kurir instan dalam kota"
}
```

Validasi:
- `name` **wajib**, string.
- `slug` **wajib**, string, **hanya huruf kecil/angka/underscore** (`^[a-z0-9_]+$`), **harus unik** antar grup. Ini kunci stabil yang dipakai FE untuk mengenali grup tertentu tanpa tergantung `id` (mis. kalau FE ingin logic khusus untuk grup Cargo, cek `slug === "cargo"`, bukan hardcode id).
- `estimasi_dalam_kota`/`estimasi_dalam_pulau`/`estimasi_luar_pulau` opsional, teks bebas (mis. `"3-5 hari"`) — **bukan angka**, jadi boleh rentang, boleh kosongkan kalau tidak relevan untuk grup itu (lihat contoh "Instant" di atas: cuma estimasi dalam kota yang relevan).
- `description` opsional.

Response `201`. `422` kalau validasi gagal (termasuk `slug` yang sudah dipakai grup lain).

### PUT `/admin/expedition-groups/{id}`

Semua field di atas opsional (kirim yang mau diubah saja). Aturan unik `slug` tidak terpicu kalau yang dikirim adalah slug milik grup itu sendiri.

### DELETE `/admin/expedition-groups/{id}`

Hapus permanen. **Vendor yang sebelumnya ada di grup ini jadi tidak punya grup** (`expedition_group_id` balik ke `null`) — tidak otomatis dipindah ke grup lain. FE perlu menangani kasus vendor tanpa grup (lihat §4).

---

## 3. Memindahkan vendor ke grup lain

**Tidak ada endpoint baru untuk ini** — reuse `PATCH /admin/expedition-vendor-settings/{vendor}` yang sudah ada (permission `expedition.settings.update`, sudah dipakai FE untuk toggle `is_active`/`is_cod_active`):

```json
{ "expedition_group_id": 2 }
```

- Kirim `id` grup tujuan (dari `GET /admin/expedition-groups`), atau `null` untuk melepas vendor dari grup apa pun.
- `422` kalau `expedition_group_id` yang dikirim bukan id grup yang ada.
- Bisa digabung dengan field lain yang sudah ada di endpoint ini (`is_active`, `is_cod_active`, `note`) dalam satu request.

**`GET /admin/expedition-vendor-settings` sekarang juga menyertakan info grup** per vendor (field baru, field lama tidak berubah):

```json
{
  "id": 7,
  "vendor": "jntcargo",
  "expedition_group_id": 2,
  "is_active": true,
  "is_cod_active": true,
  "note": null,
  "vendor_code": "JNTCARGO",
  "eligible_for_pricing_rules": true,
  "group": { "id": 2, "name": "Cargo", "slug": "cargo", "estimasi_dalam_kota": "1-3 hari", "estimasi_dalam_pulau": "3-7 hari", "estimasi_luar_pulau": "10-14 hari" }
}
```

`group` bernilai `null` kalau vendor itu belum/tidak lagi punya grup (lihat §4).

---

## 4. Yang perlu dilakukan FE

- **Halaman pilih ekspedisi (cek ongkir / buat kiriman)**: panggil `GET /admin/expedition-groups`, pakai `vendors` tiap grup untuk mengelompokkan tombol/tab vendor. Tampilkan estimasi grup (`estimasi_dalam_kota` dkk.) sebagai info umum di tab, bukan sebagai pengganti ETD per-rute yang sudah ada di hasil cek ongkir.
- **Vendor tanpa grup** (`group: null` di `expedition-vendor-settings`, atau tidak muncul di `vendors` manapun di `expedition-groups`) — bisa terjadi kalau grupnya baru dihapus admin. Siapkan tampilan fallback (mis. tab "Lainnya") supaya vendor ini tidak hilang dari UI.
- **Halaman admin kelola grup** (baru, kalau diinginkan): form CRUD sederhana — nama, slug, 3 field estimasi (teks bebas), deskripsi; plus UI untuk assign/reassign vendor ke grup (pakai endpoint vendor-settings yang sudah ada, §3).
- Field `vendor_settings_count` di `GET /admin/expedition-groups` berguna untuk badge jumlah vendor per grup tanpa perlu menghitung manual dari `vendors`.
- Tidak ada perubahan pada endpoint cek ongkir (`shipment_cost`) atau buat order — fitur ini murni data pengelompokan/metadata, tidak menyentuh kalkulasi harga/ETD sama sekali.
