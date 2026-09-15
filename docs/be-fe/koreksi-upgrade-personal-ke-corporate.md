# Koreksi FE — Upgrade Personal ke Corporate TETAP Ada

**Ini koreksi atas dokumen sebelumnya** (`update-kerja-sama-corporate-only.md`) yang sempat salah menginstruksikan untuk **menghapus** tombol/alur upgrade personal → corporate. Itu salah — kalau FE sudah sempat menghapusnya, tolong dikembalikan. Dokumen `update-kerja-sama-corporate-only.md` sudah diperbaiki juga di sumbernya, tapi dibuat catatan terpisah ini supaya jelas apa yang berubah dari instruksi sebelumnya.

## Apa yang SALAH di instruksi sebelumnya

Sempat ditulis: *"tombol upgrade ke corporate tidak berfungsi lagi, bisa dihapus."* — **Ini keliru.**

## Yang BENAR

- **`PUT /admin/kerja-sama/accounts/{user}` tetap berfungsi persis seperti sebelumnya** untuk meng-upgrade user `personal` jadi `corporate` — kirim `account_type: "corporate"` beserta field perusahaan (`company_name`, `pic_name`, dst). **Tombol/alur ini jangan dihapus.**
- **Yang benar-benar berubah cuma satu hal**: kalau sebelumnya FE menampilkan dropdown `account_type` dengan **2 pilihan** ("Corporate" **atau** "Personal") di form upgrade/edit akun kerja sama — pilihan **"Personal" dihapus** dari dropdown itu. Sisakan cuma "Corporate" sebagai tujuan upgrade (atau ganti jadi tombol aksi langsung "Upgrade ke Corporate" tanpa dropdown, karena memang cuma ada 1 tujuan yang valid sekarang).
- Kalau FE tetap mengirim `account_type: "personal"` ke endpoint ini (misal dropdown lama belum sempat diubah), backend akan menolaknya dengan `422`:
  ```json
  { "status": "error", "message": "Validation failed", "errors": { "account_type": ["..."] } }
  ```

## Ringkasan

| | Sebelum | Sekarang |
|---|---|---|
| Bisa upgrade personal → corporate? | Bisa | **Tetap bisa, tidak berubah** |
| Pilihan `account_type` di form upgrade | `"corporate"` atau `"personal"` | **Cuma `"corporate"`** |
| Bikin akun kerja sama baru dengan `account_type = personal`? | Bisa | **Tidak bisa lagi** (selalu jadi `corporate`) |

Detail lengkap dan alasan kenapa personal-postpaid dihapus (sekarang diarahkan ke [akun Agen](akun-agen.md) kalau butuh bayar-di-muka non-corporate) ada di [update-kerja-sama-corporate-only.md](update-kerja-sama-corporate-only.md) dan [kerja-sama-akun-invoice.md](kerja-sama-akun-invoice.md) §1-2 — keduanya sudah diperbaiki, sudah konsisten dengan koreksi di atas.
