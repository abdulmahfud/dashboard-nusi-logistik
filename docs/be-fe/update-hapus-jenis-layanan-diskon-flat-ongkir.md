# Update FE — Hapus Field "Jenis Layanan" di Diskon Pengiriman & Flat Ongkir

Update ini cuma menyangkut 2 fitur yang dokumentasinya sudah pernah dikirim sebelumnya: **Diskon Pengiriman** (`diskon-pengiriman.md`) dan **Flat Ongkir Jawa & Bali** (`flat-ongkir-jawa-bali.md`). Tidak ada endpoint baru — ini update kebijakan pada field yang sudah ada.

## Apa yang berubah

**Field "jenis layanan" (`service_type` untuk diskon, `service_types` untuk flat ongkir) sudah tidak dibutuhkan backend lagi.** Backend sekarang **selalu memaksa field ini jadi `null`** setiap kali admin membuat atau mengubah aturan diskon/flat-ongkir — apa pun yang dikirim dari FE untuk field ini akan diabaikan dan disimpan sebagai `null`.

## Kenapa

`Order.service_code` (`REGULER`/`COD`) itu cuma label pencatatan, bukan produk vendor yang beda — misalnya JNE selalu pakai produk yang sama (REG23) baik order-nya COD maupun bukan. Dan pada saat harga ongkir dihitung (titik di mana diskon/flat-ongkir dicocokkan), sistem belum tahu status COD sama sekali, karena payload cek ongkir memang sengaja tidak membawa info COD. Jadi tidak ada gunanya membedakan kebijakan diskon/flat-ongkir antara REGULER dan COD — keduanya sekarang **selalu berlaku sama**.

## Yang perlu dilakukan FE

- **Hapus field pilihan "jenis layanan" (REGULER/COD/EXPRESS/INSTANT dkk)** dari form create & edit di kedua fitur: Diskon Pengiriman dan Flat Ongkir.
- Kalau field itu masih ditampilkan sementara sambil menunggu perubahan FE selesai, **tidak masalah dan tidak akan error** — backend tetap menerima requestnya, cuma nilainya akan selalu disimpan `null` di database (diabaikan).
- Response GET (list/detail) untuk kedua fitur sekarang akan selalu menampilkan `"service_type": null` / `"service_types": null` — kalau FE menampilkan kolom ini di tabel/detail, tampilkan sebagai "Semua Layanan" atau sembunyikan saja kolomnya.
- **Tidak ada perubahan** pada endpoint, permission, atau field lain — hanya field jenis layanan ini yang terpengaruh.

## Bonus: diskon SAP & Anteraja sekarang benar-benar berlaku

Di luar perubahan jenis layanan, pada deploy yang sama juga diperbaiki bug lama: diskon pengiriman untuk vendor **SAP** dan **Anteraja** sebelumnya tidak pernah muncul di harga cek ongkir sama sekali (flat ongkir tetap jalan, tapi diskon tidak). Sekarang sudah diperbaiki — kalau ada aturan diskon aktif untuk kedua vendor ini, potongannya akan otomatis muncul di response cek ongkir seperti vendor lain. Tidak ada perubahan struktur payload yang perlu disesuaikan FE untuk ini.

Detail lengkap field response per vendor ada di `flat-ongkir-jawa-bali.md` (bagian tabel "Field harga yang di-override").
