# Update FE — Skala Prioritas Diskon Pengiriman & Flat Ongkir Disamakan

Update ini menyangkut field `priority` di 2 fitur yang dokumentasinya sudah pernah dikirim: [diskon-pengiriman.md](diskon-pengiriman.md) dan [flat-ongkir-jawa-bali.md](flat-ongkir-jawa-bali.md). Tidak ada endpoint baru — ini perubahan skala/validasi pada field yang sudah ada, supaya perilakunya sama persis di kedua fitur dan lebih gampang dipahami di FE.

## Apa yang berubah

**Skala `priority` sekarang 1–5 di kedua fitur, dengan arti yang sama persis:**

| Nilai | Arti |
|---|---|
| `1` | Prioritas **tertinggi** |
| `2` | Tinggi |
| `3` | Sedang — **default** kalau field ini tidak dikirim |
| `4` | Rendah |
| `5` | Prioritas **terendah** |

**Sebelumnya** kedua fitur pakai skala bebas (`0`–`999`, default `0`) dengan arah yang membingungkan (angka lebih besar = prioritas lebih tinggi). Sekarang dibalik: **angka lebih kecil = prioritas lebih tinggi**, konsisten dengan pola umum yang lebih intuitif (mirip level P0–P4 di banyak tools, di sini 1 = paling penting).

## Yang perlu dilakukan FE

- **Validasi input di form**: `priority` sekarang harus angka **1 sampai 5** (integer). Kalau ada slider/dropdown/stepper di UI, sesuaikan rentangnya.
- **Kalau field dikosongkan user, server otomatis pakai `3` (Sedang)** sebagai default — FE boleh menampilkan `3` sebagai nilai awal form supaya konsisten dengan yang akan tersimpan.
- **Balik logika label "makin besar makin prioritas"** kalau FE punya teks bantuan/tooltip soal ini — sekarang **makin kecil angkanya, makin tinggi prioritasnya**.
- Kalau FE ingin menampilkan label teks alih-alih angka mentah (disarankan, lebih jelas untuk admin), berikut pemetaan yang konsisten dipakai backend:
  ```
  1 → "Tertinggi"
  2 → "Tinggi"
  3 → "Sedang"
  4 → "Rendah"
  5 → "Terendah"
  ```

## Kapan `priority` ini benar-benar dipakai

Sebagai pengingat dari dokumentasi sebelumnya — `priority` cuma relevan kalau ada **lebih dari satu aturan yang sama-sama match** untuk satu request:

- **Flat ongkir**: dipakai sebagai penentu utama — program dengan `priority` terkecil yang eligible langsung dipakai. Contoh: program umum semua-vendor (`priority: 3`) vs program khusus satu vendor untuk rute yang sama (`priority: 1`) → yang khusus vendor menang karena angkanya lebih kecil.
- **Diskon pengiriman**: pemenang utamanya tetap **potongan harga terbesar buat customer** (bukan `priority`) — `priority` di sini cuma jadi tiebreaker kalau dua aturan diskon kebetulan menghasilkan potongan yang persis sama nominalnya.

## Data lama

Belum ada data diskon/flat-ongkir tersimpan di production, jadi **tidak ada migrasi data** yang perlu dikoreksi FE di sisi tampilan — aman untuk langsung pakai skala baru ini.
