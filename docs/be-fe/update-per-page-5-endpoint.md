# Update FE — `per_page` Sekarang Berfungsi di 5 Endpoint List

Update ini menjawab pertanyaan yang diajukan di `docs/fe-be/per-page-untuk-semua-list-endpoint.md` — dokumen ini isinya ringkasan actionable dari jawaban di sana.

## Apa yang berubah

5 endpoint list yang sebelumnya **mengabaikan** `per_page` sekarang benar-benar memakainya:

| Endpoint | Sebelumnya | Sekarang |
|---|---|---|
| `GET /admin/roles` | Selalu 5 baris/halaman (hardcode) | Ikut `per_page` yang dikirim |
| `GET /admin/shipper` | Selalu 5 baris/halaman (hardcode) | Ikut `per_page` yang dikirim |
| `GET /admin/receiver` | Selalu 5 baris/halaman (hardcode) | Ikut `per_page` yang dikirim |
| `GET /admin/wallet/transactions` | Selalu 10 baris/halaman (hardcode) | Ikut `per_page` yang dikirim |
| `GET /admin/withdraws` | **Semua baris sekaligus** (array polos, tanpa paginasi) | Paginator standar, ikut `per_page` |

**Bentuk response tidak berubah** untuk 4 endpoint pertama (tetap `{success, message, data}` seperti sebelumnya, `data` tetap paginator Laravel standar). **`GET /admin/withdraws` berubah bentuk** — dari array polos jadi paginator standar:

```json
// Sebelumnya
{ "success": true, "data": [ { "id": 1, "...": "..." }, { "id": 2, "...": "..." } ] }

// Sekarang
{
  "success": true,
  "data": {
    "current_page": 1,
    "data": [ { "id": 1, "...": "..." } ],
    "last_page": 5,
    "per_page": 15,
    "total": 68
  }
}
```

## Yang perlu dilakukan FE

- Kirim `per_page` seperti yang sudah mulai dilakukan (10/20/30/40/50 dari selector) — sekarang benar-benar berpengaruh ke jumlah baris yang kembali untuk kelima endpoint ini.
- **Default `per_page` di BE kalau tidak dikirim adalah `15`, bukan `20`.** Kalau ada kode FE yang mengandalkan default implisit BE (tidak mengirim `per_page` sama sekali di request pertama), sebaiknya tetap kirim eksplisit `per_page: 20` supaya konsisten dengan default UI.
- **Khusus `GET /admin/withdraws`**: `normalizeWithdrawRecords` di `apiClient.ts` sekarang bisa disederhanakan untuk selalu mengharapkan bentuk paginator standar (`{ current_page, data: [...], last_page, per_page, total }`) — tidak perlu lagi menangani kemungkinan array polos untuk endpoint ini. Baris "Halaman X dari Y" sekarang akan menampilkan angka yang benar, bukan selalu 1 dari 1.
- **Tidak ada batas maksimum `per_page`** diberlakukan untuk kelima endpoint ini — aman kirim nilai berapa pun dari selector (10-50).
