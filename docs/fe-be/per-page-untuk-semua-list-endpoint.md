# Dokumentasi FE → BE — Dukungan `per_page` di Semua Endpoint List

**Status**: permintaan dari FE, belum dikonfirmasi BE.

---

## 1. Latar belakang

FE baru saja menyamakan tampilan tabel di seluruh dashboard admin supaya semuanya pakai pola yang sama: selector **"Baris per halaman"** (pilihan 10/20/30/40/50, default 20) plus tombol navigasi halaman pertama/sebelumnya/berikutnya/terakhir. Pola ini sudah lama berjalan baik di beberapa halaman (mis. `GET /admin/users`, `GET /admin/expedition-discounts`, `GET /admin/products`, `GET /admin/flat-shipping-rates`, `GET /admin/kerja-sama/accounts`) yang memang sudah menerima query param `per_page` dan membalas dengan Laravel paginator standar (`current_page`, `last_page`, `per_page`, `total`, `data`).

Saat menyamakan pola ini ke halaman-halaman lain, FE menemukan **5 endpoint yang sebelumnya tidak pernah dikirimi `per_page` sama sekali** dari kode FE (cuma `page`, atau bahkan tidak ada pagination sama sekali). FE sudah mulai mengirim `per_page` ke endpoint-endpoint ini juga, tapi **belum tahu apakah BE benar-benar memprosesnya** — kalau BE mengabaikan param yang tidak dikenal, selector di UI akan tampil tapi tidak benar-benar mengubah jumlah baris yang kembali.

---

## 2. Endpoint yang perlu dikonfirmasi/didukung

| Method | Path | Dipakai di halaman FE | Status saat ini |
|---|---|---|---|
| GET | `/admin/roles` | Management Roles (`/dashboard/roles`) | FE cuma kirim `search` & `page` sebelumnya. Baru mulai kirim `per_page` juga. |
| GET | `/admin/shipper` | Data Pengirim (`/dashboard/data/data-pengirim`) | Sama — cuma `search` & `page` sebelumnya. |
| GET | `/admin/receiver` | Data Penerima (`/dashboard/data/data-penerima`) | Sama — cuma `search` & `page` sebelumnya. |
| GET | `/admin/wallet/transactions` | Riwayat Dompet Saya (`/dashboard/wallet/riwayat`) | Cuma `page` sebelumnya. |
| GET | `/admin/withdraws` | Permintaan Withdraw (`/dashboard/withdraws`) | **Belum pernah kirim `page`/`per_page` sama sekali** — selama ini FE cuma `GET` tanpa query param apa pun dan menampilkan apa adanya yang dikembalikan. |

Untuk `GET /admin/withdraws` khususnya, kode FE yang sudah ada (`normalizeWithdrawRecords` di `apiClient.ts`) menangani **dua kemungkinan bentuk response** untuk field `data`: array polos, atau objek Laravel paginator (`{ current_page, data: [...], ... }`). Ini indikasi FE sendiri sebelumnya tidak yakin bentuk response-nya konsisten seperti apa — mohon konfirmasi §3.2 di bawah.

---

## 3. Pertanyaan untuk BE

1. **Apakah ke-5 endpoint di atas sudah/bisa menerima query param `per_page` dan `page`**, lalu membalas dengan Laravel paginator standar (`current_page`, `last_page`, `per_page`, `total`, `data`) — sama seperti pola yang sudah dipakai endpoint-endpoint lain (`/admin/users`, `/admin/products`, dst)? Kalau belum, mohon ditambahkan.
2. **Khusus `/admin/withdraws`**: apakah endpoint ini sekarang mengembalikan `data` sebagai array polos (semua record sekaligus, tanpa batas), atau sudah sebagai paginator? FE ingin `data` selalu berbentuk paginator standar (seperti endpoint lain), bukan array polos, supaya jumlah pengajuan withdraw yang bisa membengkak seiring waktu tidak membuat halaman ini lambat/berat.
3. **Batas nilai `per_page`** — apakah ada batas maksimum yang diberlakukan BE (mis. dibatasi ke 100 biar tidak disalahgunakan untuk narik seluruh data sekaligus)? FE hanya akan mengirim salah satu dari `10, 20, 30, 40, 50`, tapi baik untuk tahu batas resminya.
4. **Default `per_page` kalau parameter ini tidak dikirim** — apakah semua endpoint tersebut default ke `15`, `20`, atau nilai lain? FE ingin menyelaraskan default UI (`20`) dengan default BE supaya jumlah baris yang tampil pertama kali konsisten dengan yang tertulis di selector.

---

## 4. Yang FE sudah lakukan di sisi kode (menunggu konfirmasi ini)

- `getRolesWithPagination`, `getShippersData`, `getReceiversData`, `getMyWalletTransactions`, `getWithdraws` di `apiClient.ts` sudah diubah untuk mengirim `per_page` (dan `page` untuk `getWithdraws`, yang sebelumnya tidak mengirim apa pun).
- Halaman-halaman terkait sudah punya selector "Baris per halaman" (opsi 10/20/30/40/50, default 20) yang men-trigger refetch dengan `per_page` baru.
- Kalau jawaban §3.2 menyatakan `/admin/withdraws` masih mengembalikan array polos (belum dipaginasi), FE akan tetap menampilkan selector-nya tapi baris "Halaman X dari Y" akan selalu menunjukkan 1 dari 1 sampai BE menyediakan paginator sungguhan — mohon info kalau ini butuh effort tambahan di BE supaya bisa dijadwalkan.
