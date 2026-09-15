# Update FE — Customer Corporate Bisa Lihat Sendiri Tracking Limit Kredit

Sebelumnya, riwayat transaksi kredit (`ledger`) dan laporan aktivitas pengiriman cuma bisa diakses admin. Sekarang **customer corporate yang login bisa lihat data miliknya sendiri langsung**, tanpa harus lewat admin/CS.

Endpoint yang terpengaruh:
- `GET /admin/kerja-sama/accounts/{user}/ledger` — riwayat transaksi kredit (dokumentasi lengkap: [kerja-sama-akun-invoice.md](kerja-sama-akun-invoice.md) §2).
- `GET /admin/reports/users/{user}/shipping` — laporan aktivitas pengiriman + pemakaian limit per periode (dokumentasi lengkap: [laporan-aktivitas-pengiriman.md](laporan-aktivitas-pengiriman.md)).

## Apa yang berubah

**Tidak ada perubahan bentuk request/response** — kedua endpoint ini persis sama seperti yang sudah didokumentasikan sebelumnya. Yang berubah cuma **siapa yang boleh akses**:

- **Admin** — tidak berubah, tetap bisa akses data user mana pun.
- **Customer (role `user`)** — sekarang **bisa akses, tapi hanya untuk `{user}` = ID miliknya sendiri**. Kalau customer coba akses data user lain (ganti ID di URL), responsnya:
```json
{ "status": "error", "message": "Anda hanya bisa melihat riwayat transaksi akun Anda sendiri." }
```
atau untuk laporan pengiriman:
```json
{ "status": "error", "message": "Anda hanya bisa melihat laporan pengiriman akun Anda sendiri." }
```
HTTP `403` untuk keduanya.

## Yang perlu dilakukan FE

- Kalau ada halaman "riwayat transaksi" / "laporan pengiriman saya" untuk customer corporate, panggil endpoint di atas dengan `{user}` = **ID user yang sedang login** (ambil dari `/me`, lihat [update-deteksi-tipe-akun-me.md](update-deteksi-tipe-akun-me.md)). Jangan hardcode atau ambil dari sumber lain — harus persis ID akun yang login, atau akan kena `403`.
- Fitur ini otomatis berlaku untuk **semua tipe akun** (personal, agen, corporate) — bukan cuma corporate. Personal/agen juga bisa lihat laporan pengiriman miliknya sendiri (tanpa blok `credit`, sesuai `account_type` masing-masing). Ledger kredit (`kerja-sama/accounts/*/ledger`) secara praktis cuma relevan untuk corporate, karena cuma corporate yang punya transaksi kredit.
- **Tidak perlu** endpoint/permission tambahan di sisi FE — cukup panggil endpoint yang sama dengan token customer yang login, backend yang menentukan boleh/tidaknya berdasarkan ID.

## Catatan

Endpoint `GET /admin/kerja-sama/accounts/{user}` (ringkasan akun, bukan ledger) **belum** dibuka untuk self-service — masih admin-only. Tapi info yang sama (`credit_limit`, `outstanding_balance`, dst) sudah tersedia lewat `/me` untuk akun corporate (lihat [update-deteksi-tipe-akun-me.md](update-deteksi-tipe-akun-me.md)), jadi tidak ada kebutuhan yang belum terpenuhi.
