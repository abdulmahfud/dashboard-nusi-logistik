# Dokumentasi FE — Laporan Aktivitas Pengiriman per Akun

Fitur baru: admin bisa melihat ringkasan aktivitas pengiriman satu user tertentu dalam satu periode (default bulan berjalan) — total pengiriman, total ongkir, breakdown per vendor. Untuk akun `corporate`, ditambah tracking pemakaian limit kredit.

---

## 1. Endpoint

| Method | Path | Permission |
|---|---|---|
| GET | `/admin/reports/users/{user}/shipping` | `reports.shipping.view` |

`{user}` = ID user (integer). Response wrapper: `{status, message, data}`.

Query params opsional: `start_date`, `end_date` (format `YYYY-MM-DD`). Kalau tidak diisi, default ke bulan berjalan (tanggal 1 sampai akhir bulan, sesuai tanggal server).

## 2. Response — akun personal / agen

```json
{
  "status": "success",
  "data": {
    "user": { "id": 12, "name": "Budi Santoso", "account_type": "personal" },
    "period": { "start_date": "2026-09-01", "end_date": "2026-09-30" },
    "by_vendor": [
      { "vendor": "JNTEXPRESS", "total_shipments": 8, "total_ongkir": 240000 },
      { "vendor": "SAP", "total_shipments": 3, "total_ongkir": 75000 }
    ],
    "totals": { "total_shipments": 11, "total_ongkir": 315000 }
  }
}
```

Akun `personal` dan `agen` mendapat **response yang sama persis** — tidak ada blok tambahan.

## 3. Response — akun corporate

Sama seperti di atas, **plus blok `credit`**:

```json
{
  "status": "success",
  "data": {
    "user": { "id": 20, "name": "PT Contoh Sejahtera", "account_type": "corporate" },
    "period": { "start_date": "2026-09-01", "end_date": "2026-09-30" },
    "by_vendor": [
      { "vendor": "IDEXPRESS", "total_shipments": 15, "total_ongkir": 1800000 }
    ],
    "totals": { "total_shipments": 15, "total_ongkir": 1800000 },
    "credit": {
      "credit_limit": 5000000,
      "max_outstanding": null,
      "outstanding_balance": 1250000,
      "credit_used_this_period": 1800000
    }
  }
}
```

Field di blok `credit`:
- `credit_limit`, `max_outstanding` — sama seperti di `docs/be-fe/kerja-sama-akun-invoice.md`, batas kredit akun ini.
- `outstanding_balance` — **piutang berjalan saat ini** (bukan cuma periode yang dipilih), sama seperti yang ditampilkan di endpoint `kerja-sama/accounts/{user}` — total keseluruhan yang belum lunas.
- `credit_used_this_period` — **khusus jumlah kredit yang terpakai dalam periode `start_date`–`end_date`** yang dipilih (beda dari `outstanding_balance` yang selalu "saat ini"). Berguna untuk lihat "bulan ini sudah pakai berapa" tanpa tercampur pemakaian bulan-bulan sebelumnya yang belum lunas.

## 4. Catatan penting soal akurasi `total_ongkir`

`total_ongkir` diambil dari nilai ongkir yang dikutip saat order dibuat (disimpan di setiap order, bukan dihitung ulang). Untuk order **corporate/postpaid** yang nilainya dikoreksi admin **setelah** barang sampai tujuan (misal ada penyesuaian berat), angka `total_ongkir` di laporan ini **tetap menampilkan angka kutipan awal**, bukan angka yang sudah dikoreksi — koreksi itu cuma tercermin di `credit_used_this_period`/`outstanding_balance` (karena dua field itu bersumber dari data ledger kredit yang memang ikut dikoreksi), bukan di `total_ongkir`. Kalau ada selisih antara `total_ongkir` per-vendor dengan `credit_used_this_period` untuk akun corporate, ini kemungkinan penyebabnya — bukan bug.

Order berstatus **dibatalkan tidak dihitung** di `by_vendor`/`totals` sama sekali (dianggap tidak pernah benar-benar terkirim).

## 5. Cakupan tipe akun

Semua tipe akun (`personal`, `corporate`, `agen`) bisa dipakai di endpoint ini — cukup ganti `{user}` dengan ID user yang sesuai, response-nya otomatis menyesuaikan (blok `credit` cuma muncul untuk `corporate`).
