# Update FE — Prioritas Tiket Bantuan

**Status**: sudah tersedia di backend (2026-10-07). Tiket Bantuan sekarang punya field `priority` (prioritas), diisi/diubah oleh staf, bukan oleh pelapor.

## Skala

Sama persis dengan skala yang sudah dipakai di Diskon Pengiriman & Flat Ongkir (`docs/be-fe/update-skala-prioritas-diskon-flat-ongkir.md`), supaya konsisten di seluruh sistem:

| Nilai | Label |
|---|---|
| `1` | Tertinggi |
| `2` | Tinggi |
| `3` | **Sedang — default tiket baru** |
| `4` | Rendah |
| `5` | Terendah |

Angka lebih kecil = prioritas lebih tinggi.

## Response — field baru

Muncul di `GET /admin/support/tickets` (tiap item), `GET /admin/support/tickets/{id}`, `POST /admin/support/tickets` (hasil buat tiket), dan `PATCH /admin/support/tickets/{id}`:

```json
{
  "id": 42,
  "title": "Resi tidak update",
  "priority": 2,
  "priority_label": "Tinggi",
  "...": "field lain tidak berubah"
}
```

## Siapa yang bisa mengubahnya

**Hanya staf dengan permission `support.tickets.manage`** (sama dengan yang sudah bisa ubah status/penugasan — `customer-service`, `admin`, `superadmin`). **Pelapor (role `user`) tidak bisa mengisi atau mengubah prioritas** — field `priority` yang dikirim di `POST /admin/support/tickets` (saat membuat tiket) **diabaikan**; tiket baru selalu mulai di prioritas `3` (Sedang). Ini sengaja: supaya prioritas benar-benar mencerminkan triase staf, bukan klaim sepihak pelapor.

### Mengubah prioritas

`PATCH /admin/support/tickets/{id}` (endpoint yang sudah ada untuk ubah status/penugasan), field baru:

```json
{ "priority": 1 }
```

- Boleh dikirim sendirian atau bersamaan dengan `status`/`assigned_to` di request yang sama.
- Nilai harus **integer 1–5**, selain itu `422`.
- Bukan staf (termasuk pelapor sendiri) yang memanggil endpoint ini tetap mendapat `403` seperti sebelumnya — tidak ada perubahan di gate ini, cuma field yang valid untuk diubah bertambah satu.

## Filter — `GET /admin/support/tickets`

Query baru **`priority`** (integer 1–5), bisa digabung dengan `status`/`department`/`user_id`/`search` yang sudah ada:

```
GET /admin/support/tickets?priority=1
```

## Export "Tiket Bantuan"

Kolom **Prioritas** di export (`docs/be-fe/export-tiket-bantuan.md`) yang sebelumnya selalu kosong, **sekarang terisi label skala di atas**. Export juga menerima filter `priority` (1–5) yang sama seperti di atas.

## Yang perlu dilakukan FE

- Tampilkan `priority_label` di daftar dan detail tiket (badge warna sesuai level kalau mau — 1-2 merah/oranye, 3 kuning/netral, 4-5 hijau/abu, sesuai desain FE).
- Form/aksi ubah prioritas **hanya untuk staf** (cek `hasPermission("support.tickets.manage")`, sama gate yang sudah dipakai untuk tombol ubah status). Kirim lewat `PATCH /admin/support/tickets/{id}` seperti mengubah status.
- **Jangan** tampilkan pilihan prioritas di form buat tiket milik customer — field itu akan diabaikan backend kalau dikirim.
- Tambahkan filter prioritas di halaman daftar tiket staf kalau diinginkan (dropdown 1–5 dengan label di atas).

## Data lama

Semua tiket yang sudah ada (dibuat sebelum update ini) otomatis mendapat prioritas `3` (Sedang) — tidak ada tiket yang jadi tidak punya nilai prioritas.
