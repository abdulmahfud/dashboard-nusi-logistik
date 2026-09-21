# Dokumentasi FE → BE — Ringkasan Jumlah Tiket per Status (`/dashboard/support/tickets`)

**Status**: permintaan dari FE, belum diimplementasikan. Terkait redesain halaman **Tiket Masuk** (admin, permission `support.tickets.manage`).

---

## 1. Latar belakang

Desain baru halaman Tiket Masuk punya dua elemen yang menampilkan **jumlah tiket per status**:

1. **Empat kartu ringkasan** di atas: *Menunggu Jawaban*, *Dalam Penanganan*, *Selesai*, *Semua Tiket* — masing-masing berisi angka dan bisa diklik untuk menyaring daftar.
2. **Tab status** di atas tabel dengan angka di labelnya, mis. "Menunggu Jawaban (3)", "Dalam Penanganan (5)", "Selesai (18)", "Semua Tiket (26)".

`GET /admin/support/tickets` hanya mengembalikan `total` **untuk filter yang sedang dipakai** (satu status/departemen). FE tidak bisa mengetahui jumlah semua status sekaligus tanpa menarik seluruh tiket satu per satu — tidak layak. **Solusi sementara di FE**: kartu ringkasan sudah ditampilkan dengan menghitung jumlahnya lewat **5 request kecil** ke `GET /admin/support/tickets` (satu per status + satu tanpa status, masing-masing `per_page=1`, hanya membaca `total`). Ini jalan tanpa perubahan BE, tapi boros (5 request tiap halaman dibuka/di-refresh) — endpoint ringkasan di bawah akan menggantikannya jadi 1 request. Tab status berangka **belum** dibuat.

---

## 2. Permintaan

### 2.1 Endpoint ringkasan

**Usulan**: `GET /admin/support/tickets/summary` — permission `support.tickets.manage`.

**Query opsional**: `department` (nilai yang sama dengan filter daftar), supaya angka bisa mengikuti filter departemen.

**Response yang diusulkan** (jumlah dihitung dari **seluruh** tiket sesuai `department`, tidak terpengaruh `status`):

```json
{
  "success": true,
  "data": {
    "total": 26,
    "by_status": {
      "awaiting_support": 3,
      "awaiting_customer": 5,
      "resolved": 12,
      "closed": 6
    }
  }
}
```

*Alternatif*: bila BE lebih suka, sertakan objek yang sama sebagai `meta.status_counts` pada response `GET /admin/support/tickets` (dihitung tanpa filter `status`).

### 2.2 Pertanyaan: pemetaan status ke kartu/tab

Status yang FE kenal ada **4**: `awaiting_support`, `awaiting_customer`, `resolved`, `closed`. Desain punya **3 kelompok + Semua** dengan teks yang bisa dibaca dua arah. Pemetaan yang **dipakai FE sekarang** (5 kartu, agar jumlah tiap status konsisten dengan total):

| Kartu di FE | Status | Keterangan di kartu |
|---|---|---|
| Menunggu Jawaban | `awaiting_support` | Menunggu balasan tim support |
| Dalam Penanganan | `awaiting_customer` | Menunggu balasan pengguna |
| Selesai | `resolved` | Tiket telah diselesaikan |
| Ditutup | `closed` | Tiket sudah ditutup |
| Semua Tiket | — | Total seluruh tiket |

Di desain, keterangan kartu "Menunggu Jawaban" berbunyi *"menunggu respon pengguna"* dan "Dalam Penanganan" berbunyi *"sedang ditangani tim support"* — kebalikan dari pemetaan di atas. FE memilih yang di atas karena `awaiting_support` = tiket yang belum dibalas tim (paling mendesak).

Mohon konfirmasi (dengan tim produk bila perlu) pemetaan yang benar, dan apakah `closed` sebaiknya digabung ke "Selesai" (jadi 4 kartu seperti desain; FE akan menjumlahkan `resolved + closed`).

---

## 3. Rencana FE setelah BE menyediakan

- Ganti 5 request sementara dengan 1 request ke endpoint ringkasan (angka dari `by_status`/`total`); klik kartu tetap menerapkan filter status yang sesuai pada daftar.
- Tampilkan tab status dengan angka di atas tabel, sinkron dengan filter status yang ada.
- Refresh angka bersamaan dengan tombol **Muat Ulang** dan setelah filter diterapkan.
