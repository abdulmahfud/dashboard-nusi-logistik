# Jawaban FE — Review Sebelum Proses ke Ekspedisi untuk Corporate

Menjawab `docs/fe-be/pembayaran-paket-review-sebelum-proses.md`. Status: **sudah tersedia di backend (2026-10-10)**, sudah diuji lewat sandbox JNE sungguhan (buat order → commit batch → dapat AWB) di lokal dan production.

---

## 0. Koreksi penting dulu — asumsi di §2 poin 3 dokumen FE **salah**

FE berasumsi setelah `POST /admin/payments/create` (bulk) sukses, status order Personal berubah dari `menunggu_pembayaran` jadi **`belum_proses`**. **Itu tidak terjadi** di kode yang sesungguhnya berjalan — kode yang membuat asumsi itu kelihatan benar (`PaymentController::processOrdersAfterPayment()`) ternyata **kode mati, tidak pernah dipanggil**.

Jalur nyata (`XenditService::handlePaidPayment()`, dipicu webhook Xendit atau langsung saat bayar wallet): order langsung di-set ke **`proses_pengiriman`** (`Order::markAsPaidAndReadyToProcess()`), lalu job `ProcessOrderToExpeditionJob` di-dispatch async untuk benar-benar memanggil vendor. Order Personal **tidak pernah** berhenti sejenak di `belum_proses` — statusnya `menunggu_pembayaran` → `proses_pengiriman` (AWB biasanya belum ada sesaat, lalu ada setelah job jalan).

**Dampak ke tab "Sudah Dibayar" FE**: kalau difilter `status=belum_proses` seperti rencana di §4/§5 dokumen FE, tab itu **akan selalu kosong untuk Personal**. Filter yang benar untuk "sudah lolos tahap ini" adalah status **selain** `menunggu_pembayaran` dan `dibatalkan` — praktisnya `proses_pengiriman` (dan status lanjutannya: `belum_di_expedisi`, `kendala_pengiriman`, `sampai_tujuan`, `retur`, kalau mau ikut ditampilkan di tab yang sama).

Untuk **Corporate**, status `belum_proses` sekarang justru benar-benar dipakai (lihat di bawah) — jadi kedua tab tetap bisa pakai status yang sama (`menunggu review` vs `proses_pengiriman`+), cuma Personal tidak pernah transit di `belum_proses` sedangkan Corporate memang berhenti di sana.

---

## 1. Jawaban 5 pertanyaan

**1. Bisa order Corporate dibuat tanpa langsung diproses ke vendor?**
Ya, sekarang **selalu begitu** untuk order non-COD akun Corporate — tidak ada lagi opsi "langsung proses seperti COD". Statusnya **`belum_proses`** (status yang sudah ada, dipakai ulang — bukan status baru). `awb_no` kosong, dan **limit kredit belum tersentuh sama sekali** (tidak ada baris di riwayat kredit) sampai FE memanggil endpoint commit di bawah.

**2. Endpoint bulk commit** — baru: `POST /admin/orders/bulk-process`, body `{"order_ids": [1, 2, 3]}`. Bukan loop per-order di FE.

**3. Partial success?** Ya. Diproses berurutan per `order_id`, masing-masing dapat hasil sendiri — order yang limitnya cukup tetap diproses meski ada order lain dalam batch yang sama yang gagal.

**4. Order yang gagal, tetap "belum diproses" atau dibatalkan otomatis?**
- Gagal karena **limit tidak cukup** (dicek sebelum kredit disentuh): order **tidak disentuh sama sekali**, tetap `belum_proses`, bisa dicoba commit lagi nanti (mis. setelah top up/pelunasan).
- Gagal di **vendor** (API error) setelah kredit sudah direservasi dan beberapa kali dicoba ulang (job retry otomatis): **baru di titik itu** dibatalkan otomatis (`dibatalkan`) dan reservasi kreditnya ikut dibatalkan otomatis juga — ini bukan hal baru, sudah jadi perilaku existing job.

**5. Status akhir setelah berhasil** — **`proses_pengiriman`**, sama seperti vendor lain setelah AWB didapat. Bukan status baru.

---

## 2. Endpoint baru

### `POST /admin/orders/bulk-process`

Permission `orders.create` (sama yang sudah dipakai customer untuk membuat order — tidak ada permission baru).

Body:
```json
{ "order_ids": [101, 102, 103] }
```

Hanya memproses order **milik requester sendiri**, yang statusnya `belum_proses`, belum punya `awb_no`, dan bukan order COD (COD sudah langsung terproses sejak dibuat, tidak lewat sini).

Response `200`:
```json
{
  "success": true,
  "message": "Batch diproses.",
  "data": {
    "results": [
      { "order_id": 101, "status": "queued" },
      { "order_id": 102, "status": "insufficient_credit", "message": "Limit kredit tidak cukup untuk order ini. Order tetap menunggu review." },
      { "order_id": 103, "status": "not_eligible", "message": "Order ini bukan order corporate yang sedang menunggu review." }
    ]
  }
}
```

Nilai `status` per order:
| Nilai | Arti |
|---|---|
| `queued` | Kredit direservasi, order dikirim ke antrian untuk benar-benar diproses ke vendor (async — AWB belum langsung ada di response ini, poll `GET /admin/list-orders` atau order detail untuk tahu hasilnya) |
| `insufficient_credit` | Limit tidak cukup **saat ini**. Order tidak disentuh, tetap `belum_proses`, bisa dicoba lagi |
| `not_eligible` | Order bukan milik requester, bukan status `belum_proses`, sudah punya AWB, atau order COD |
| `not_found` | `order_id` tidak ada |

**Penting — urutan batch memengaruhi hasil**: karena diproses berurutan dan tiap order mengurangi sisa limit yang tersedia untuk order berikutnya dalam batch yang sama, urutan `order_ids` yang dikirim menentukan order mana yang kebagian limit kalau totalnya pas-pasan. Kirim sesuai urutan tampil di UI (biasanya dari yang paling lama dibuat).

**Rekonsiliasi hasil ke UI**: respons ini langsung tahu `queued`/`insufficient_credit`/dst, tapi belum tahu AWB-nya (itu baru didapat setelah job selesai, beberapa detik kemudian). FE perlu poll ulang (`GET /admin/list-orders` atau refresh daftar) untuk melihat order yang `queued` berubah jadi `proses_pengiriman` dengan AWB, atau — kalau job akhirnya gagal setelah semua retry — `dibatalkan`.

### `DELETE /admin/orders/{order}/cancel-pending`

Permission `orders.create`. Membatalkan order **milik sendiri** yang masih `belum_proses` dan belum punya AWB — tanpa panggilan ke vendor sama sekali (order memang belum pernah dikirim). Ini untuk tombol "Batalkan" di tab "Belum Diproses", dipakai sebelum user menekan "Proses ke Ekspedisi".

- `403` kalau bukan order milik sendiri.
- `422` kalau order sudah bukan `belum_proses` lagi (sudah di-commit / sudah ada AWB) — artinya sudah terlambat dibatalkan lewat sini.
- `200` sukses, status order jadi `dibatalkan`.

---

## 3. Yang tidak berubah

- **COD tidak terpengaruh sama sekali** — order COD (akun apa pun) tetap langsung diproses ke vendor saat dibuat, seperti sebelumnya.
- Response `POST /admin/expedition/{vendor}/order` untuk Corporate **bentuknya sama**, cuma sekarang `status: "belum_proses"` dan `awb_no: null` — sebelumnya biasanya sudah `proses_pengiriman` dengan AWB terisi di response yang sama.

## 4. Perubahan perilaku yang perlu diketahui — gate limit kredit saat membuat order **dihapus**

Sebelumnya (fitur yang baru saja dirilis minggu lalu): order Corporate ditolak `422` saat dibuat kalau limit kredit tidak cukup untuk nominal order itu. **Itu dihapus sekarang** — order Corporate (non-COD) **selalu bisa dibuat** asal akun kerja sama-nya **sudah aktif** (`kerja_sama_is_active`), berapa pun sisa limitnya. Jumlah limit baru dicek nanti, satu per satu, saat commit (§1 poin 1/3) — sama seperti order Personal yang juga dibuat dulu tanpa cek saldo wallet, baru dicek saat bayar.

Kalau akun kerja sama **belum diaktifkan sama sekali**, order tetap ditolak `422`:
```json
{ "success": false, "message": "Akun corporate belum aktif kerja sama. Hubungi admin untuk mengaktifkan limit kredit." }
```

Gate suspend (`kerja_sama_is_active = false` untuk akun yang sudah pernah aktif lalu disuspend) **tidak berubah**, masih `403` seperti sebelumnya.
