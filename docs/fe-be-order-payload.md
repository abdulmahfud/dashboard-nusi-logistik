# Dokumentasi Payload FE → BE (Paket Reguler)

Dokumen ini menjelaskan bagaimana **dashboard frontend** menyiapkan dan mengirim payload ke backend untuk pembuatan order paket reguler, dengan fokus pada variasi:

- **Non-COD** vs **COD**
- **Pickup** vs **Drop Off**
- **Asuransi** aktif vs tidak

Implementasi utama ada di:

- `src/components/PaketReguler/CalculationResults.tsx` — `buildShippingData()`, `handleSubmitOrder()`
- `src/lib/apiClient.ts` — `createPayment()`, `createOrderWithPendingPayment()`
- `src/lib/utils.ts` — `deliveryTypeToPickup()`
- `src/types/order.ts` — tipe terkait order

---

## Ringkasan alur

```mermaid
flowchart TD
  A[Form Paket Reguler] --> B[Cek ongkir multi-vendor]
  B --> C[Pilih ekspedisi + opsi asuransi]
  C --> D{paymentMethod?}
  D -->|cod| E[POST /admin/orders/create-pending]
  D -->|non-cod| F[POST /admin/payments/create]
  E --> G[amount: 0]
  F --> H[amount: ongkir + asuransi]
  F --> I[payment_method: wallet | xendit]
```

| Tahap | Endpoint BE | Kapan dipakai |
|--------|-------------|----------------|
| Cek ongkir | `POST /admin/expedition/{vendor}/shipment_cost` | Sebelum order (form submit / cek tarif) |
| Order COD | `POST /admin/orders/create-pending` | `paymentMethod === "cod"` |
| Order Non-COD | `POST /admin/payments/create` | `paymentMethod === "non-cod"` |

---

## 1. Payload cek ongkir (belum order)

Digunakan saat user menghitung tarif. **Tidak** memuat COD, asuransi, atau pickup — hanya rute dan berat.

**Sumber:** `RegularPackageForm.tsx`, `ShippingForm.tsx` → `get*ShipmentCost()` di `apiClient.ts`.

```json
{
  "origin_province": "JAWA BARAT",
  "origin_regencie": "KOTA BANDUNG",
  "origin_district": "COBLONG",
  "destination_province": "DKI JAKARTA",
  "destination_regencie": "KOTA JAKARTA SELATAN",
  "destination_district": "KEBAYORAN BARU",
  "weight": "1.5"
}
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `origin_*` / `destination_*` | string | **UPPERCASE** |
| `origin_regencie` / `destination_regencie` | string | Typo sengaja mengikuti API (`regencie`, bukan `regency`) |
| `weight` | string | **Kilogram** (FE konversi dari gram: `gram / 1000`) |

---

## 2. Struktur `shipping_data` (inti order)

Semua skenario order (COD & Non-COD) membungkus objek berikut di field **`shipping_data`**.

```json
{
  "vendor": "jntexpress",
  "sender": { },
  "receiver": { },
  "pickup": true,
  "serviceType": "REGULER",
  "detail": { }
}
```

### 2.1 `vendor`

Diambil dari ID opsi pengiriman yang dipilih (`selectedShippingOption.id`):

| Prefix ID opsi | Nilai `vendor` |
|----------------|----------------|
| `jnt` | `jntexpress` |
| `paxel` | `paxel` |
| `lion` | `lion` |
| `sap` | `sap` |
| `posindonesia` | `posindonesia` |
| `jne` | `jne` |
| `idexpress` | `idexpress` |
| `anteraja` | `anteraja` |
| `ninja` | `ninja` |

### 2.2 `sender` & `receiver`

FE **selalu** mengirim objek penuh (bukan `receiver_id` / `shipper_id`) saat submit order dari `CalculationResults`.

```json
{
  "name": "Nama",
  "phone": "08123456789",
  "address": "Alamat lengkap",
  "province": "Jawa Barat",
  "regency": "Kota Bandung",
  "district": "Coblong",
  "postal_code": "40111",
  "latitude": -6.914744,
  "longitude": 107.609810
}
```

| Field | Wajib | Keterangan |
|-------|-------|------------|
| `name`, `phone`, `address`, `province`, `regency`, `district` | Ya | Validasi FE sebelum kirim |
| `email` | Tidak | Opsional (tidak di-set FE saat ini) |
| `postal_code` | Tidak | Hanya jika terisi di form |
| `latitude`, `longitude` | Tidak | Hanya pada **sender** jika tersedia dari data bisnis |

### 2.3 `detail` (paket)

```json
{
  "weight": 1.5,
  "qty": 1,
  "item_value": 150000,
  "cod": 0,
  "goods_desc": "Isi paket",
  "category": "PAKAIAN",
  "insurance": 0,
  "instruction": "Tolong hati-hati",
  "panjang": 30,
  "lebar": 20,
  "tinggi": 10
}
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `weight` | number | **Kg** (`gram_form / 1000`) |
| `qty` | number | Jumlah item |
| `item_value` | number | Nilai barang (IDR, integer) |
| `cod` | number | Lihat bagian [COD](#4-cod-cash-on-delivery) |
| `goods_desc` | string | Default: `"General Goods"` jika kosong |
| `category` | string | Opsional; dari `itemType`, di-**UPPERCASE** |
| `insurance` | number | **`1` = pakai asuransi**, **`0` = tidak** (bukan nominal rupiah) |
| `instruction` | string | Catatan; default: `"Tolong hati-hati"` |
| `panjang`, `lebar`, `tinggi` | number | Opsional (cm), hanya jika > 0 |

### 2.4 `serviceType`

Saat ini FE mengirim tetap:

```json
"serviceType": "REGULER"
```

---

## 3. Pickup vs Drop Off

### Di form (UI)

| Pilihan user (`deliveryType`) | Arti |
|------------------------------|------|
| `"pickup"` | Kurir jemput di alamat pengirim |
| `"dropoff"` | Pengirim antar ke agen |

### Di payload order (`shipping_data`)

| `deliveryType` | `pickup` (boolean) |
|----------------|-------------------|
| `"pickup"` | `true` |
| `"dropoff"` | `false` |

Konversi: `deliveryTypeToPickup()` di `src/lib/utils.ts`.

```ts
deliveryType === "pickup"  // → pickup: true
```

### Catatan: `servicetype` (hanya di form internal)

Pada tahap **cek ongkir / payload form** (`RegularPackageForm`), FE juga set:

| `deliveryType` | `servicetype` |
|----------------|---------------|
| pickup | `1` |
| dropoff | `6` |

Field ini **tidak** ikut di body `shipping_data` order; yang dikirim ke BE order adalah **`pickup` boolean**.

### Contoh perbedaan pickup

**Pickup (`pickup: true`):**

```json
{
  "shipping_data": {
    "vendor": "jntexpress",
    "pickup": true,
    "serviceType": "REGULER",
    "detail": { "weight": 2, "qty": 1, "item_value": 200000, "cod": 0, "insurance": 0, "goods_desc": "Buku", "instruction": "Jemput pagi" }
  },
  "amount": 25000
}
```

**Drop Off (`pickup: false`):** sama, hanya `"pickup": false`.

---

## 4. COD (Cash on Delivery)

### Kondisi di form

```ts
formData.paymentMethod === "cod"
```

### Field `detail.cod`

| Metode | Nilai `detail.cod` |
|--------|-------------------|
| COD | **`item_value`** (sama dengan nilai barang) |
| Non-COD | **`0`** |

### Endpoint & `amount`

```http
POST /admin/orders/create-pending
```

```json
{
  "shipping_data": { },
  "amount": 0
}
```

- **`amount` selalu `0`** — tidak ada pembayaran di muka lewat gateway.
- Biaya ongkir + asuransi (jika ada) **ditagihkan ke penerima**, bukan dibayar pengirim di FE.
- FE menampilkan biaya COD admin **3%** dari `item_value` untuk informasi UI; nilai ini **tidak** dikirim sebagai field terpisah di payload (hanya perhitungan tampilan).

### Contoh payload COD + pickup + asuransi

```json
{
  "shipping_data": {
    "vendor": "lion",
    "sender": {
      "name": "Toko ABC",
      "phone": "08111111111",
      "address": "Jl. Merdeka No. 1",
      "province": "Jawa Barat",
      "regency": "Bandung",
      "district": "Cicendo"
    },
    "receiver": {
      "name": "Budi",
      "phone": "08222222222",
      "address": "Jl. Sudirman No. 2",
      "province": "DKI Jakarta",
      "regency": "Jakarta Pusat",
      "district": "Tanah Abang"
    },
    "pickup": true,
    "serviceType": "REGULER",
    "detail": {
      "weight": 1,
      "qty": 1,
      "item_value": 500000,
      "cod": 500000,
      "goods_desc": "Sepatu",
      "insurance": 1,
      "instruction": "Hati-hati"
    }
  },
  "amount": 0
}
```

### Response yang diharapkan FE (COD)

```json
{
  "success": true,
  "message": "...",
  "data": {
    "order_id": 123,
    "reference_no": "ORD-...",
    "status": "pending",
    "amount": 0
  }
}
```

FE juga mencoba membaca `awb_no` dari `data` jika backend mengembalikannya.

---

## 5. Non-COD

### Kondisi di form

```ts
formData.paymentMethod === "non-cod"
```

### Field `detail.cod`

Selalu **`0`**.

### Endpoint & `amount`

```http
POST /admin/payments/create
```

```json
{
  "shipping_data": { },
  "amount": 35000,
  "payment_method": "wallet"
}
```

| Field | Tipe | Keterangan |
|-------|------|------------|
| `shipping_data` | object | Struktur sama seperti COD |
| `amount` | number | **Ongkir (setelah diskon) + biaya asuransi** |
| `payment_method` | `"wallet"` \| `"xendit"` | Wajib dipilih user (Non-COD) |

### Rumus `amount` di FE

```
amount = shippingCost + insuranceCost
```

| Komponen | Rumus |
|----------|--------|
| `shippingCost` | Harga opsi ekspedisi terpilih, atau `discounted_price` jika ada diskon |
| `insuranceCost` | `0` jika tidak asuransi; jika asuransi: **`round(item_value * 0.005)`** (0,5%) |

**Nilai barang (`item_value`) tidak** masuk ke `amount` Non-COD (dibayar langsung ke penjual di luar platform).

### Alur setelah response

| Kondisi | Perilaku FE |
|---------|-------------|
| `requires_action === true` | Redirect ke `action_url` atau `invoice_url` (Xendit) |
| `requires_action === false` | Toast sukses → halaman sukses (wallet langsung lunas) |

### Contoh payload Non-COD + dropoff + tanpa asuransi

```json
{
  "shipping_data": {
    "vendor": "jntexpress",
    "sender": {
      "name": "Toko ABC",
      "phone": "08111111111",
      "address": "Jl. Merdeka No. 1",
      "province": "Jawa Barat",
      "regency": "Bandung",
      "district": "Cicendo"
    },
    "receiver": {
      "name": "Budi",
      "phone": "08222222222",
      "address": "Jl. Sudirman No. 2",
      "province": "DKI Jakarta",
      "regency": "Jakarta Pusat",
      "district": "Tanah Abang"
    },
    "pickup": false,
    "serviceType": "REGULER",
    "detail": {
      "weight": 0.5,
      "qty": 2,
      "item_value": 100000,
      "cod": 0,
      "goods_desc": "Aksesoris",
      "insurance": 0,
      "instruction": "Drop di counter"
    }
  },
  "amount": 18000,
  "payment_method": "xendit"
}
```

---

## 6. Asuransi (Insurance)

### Di UI

Checkbox **"Asuransikan Kiriman Saya"** (`isInsured`) di `CalculationResults`.

Tersedia untuk **COD dan Non-COD** (checkbox tidak disembunyikan untuk COD).

### Di payload BE

Hanya flag di `detail.insurance`:

| Checkbox | `detail.insurance` |
|----------|-------------------|
| Tidak dicentang | `0` |
| Dicentang | `1` |

**Bukan** mengirim nominal premi ke field `insurance`. Backend/vendor yang menafsirkan flag tersebut.

### Perhitungan premi di FE (untuk tampilan & `amount` Non-COD)

```
insuranceCost = round(item_value * 0.005)   // 0,5%
```

| Metode pembayaran | Premi asuransi dibayar oleh |
|-------------------|----------------------------|
| Non-COD | Pengirim (masuk `amount` ke `/admin/payments/create`) |
| COD | Penerima (masuk ringkasan "ditagihkan penerima", **tidak** masuk `amount` request) |

### Contoh: Non-COD + asuransi

- `item_value`: `200000`
- `insuranceCost`: `1000`
- `shippingCost`: `24000`
- **`amount`**: `25000`
- **`detail.insurance`**: `1`

---

## 7. Matriks kombinasi

| paymentMethod | Endpoint | `amount` | `detail.cod` | `detail.insurance` | `pickup` |
|---------------|----------|----------|--------------|-------------------|----------|
| `non-cod` | `/admin/payments/create` | ongkir + premi* | `0` | `0` atau `1` | `true` / `false` |
| `cod` | `/admin/orders/create-pending` | `0` | `item_value` | `0` atau `1` | `true` / `false` |

\* Premi asuransi hanya ditambahkan ke `amount` untuk **Non-COD**.

---

## 8. Autentikasi & client

Semua request melalui `apiClient` (Axios) dengan base URL dari env dan header auth session admin (cookie/token sesuai konfigurasi proyek).

Fungsi terkait:

```ts
// Non-COD
createPayment({
  shipping_data: shippingData,
  amount: totalAmount,
  payment_method: "wallet" | "xendit",
});

// COD
createOrderWithPendingPayment({
  shipping_data: shippingData,
  amount: 0,
});
```

---

## 9. Validasi FE sebelum kirim

Order gagal dibangun (`buildShippingData()` mengembalikan `null`) jika:

- Data pengirim / bisnis tidak lengkap
- Penerima: `name`, `phone`, `address` kosong
- `province`, `regency`, `district` penerima kosong atau string kosong
- Opsi ekspedisi belum dipilih

---

## 10. Perbedaan dengan tipe lama (`OrderRequest`)

File `src/types/order.ts` masih mendefinisikan format lama:

```ts
{ shipper_id, receiver_id, pickup, detail }
```

**Alur Paket Reguler saat ini** menggunakan format baru:

```ts
{ vendor, sender, receiver, pickup, serviceType, detail }
```

Pastikan backend mengikuti format yang dipakai `CalculationResults`, bukan hanya interface `OrderRequest` jika belum diselaraskan.

---

## 11. Referensi file

| File | Peran |
|------|--------|
| `src/components/PaketReguler/CalculationResults.tsx` | Rakit `shipping_data`, hitung `amount`, submit COD / Non-COD |
| `src/components/PaketReguler/RegularPackageForm.tsx` | Form, cek ongkir, `paymentMethod`, `deliveryType` |
| `src/lib/apiClient.ts` | HTTP client ke BE |
| `src/lib/utils.ts` | `deliveryTypeToPickup()` |
| `src/types/order.ts` | Tipe TypeScript (sebagian legacy) |

---

## 12. Cek ongkir Pos Indonesia (response & pemetaan FE)

### Format BE terbaru (yang dipakai UI)

Response sukses berbentuk objek di **`data`** (bukan array), contoh field:

| Field | Pemetaan UI |
|-------|-------------|
| `final_cost` | Harga kartu (`price`) |
| `service_name` | Nama layanan |
| `estimation` | Durasi/ETD (`duration`) |
| `service_code` / `product_id` | ID opsi `posindonesia-{code}` |
| `vendor_service` | Snapshot Addpostingdoc (`fee`, `feeTax`, …) |

Parser: `buildPosIndonesiaShippingOptions()` di `src/lib/posIndonesiaShipmentCost.ts`.

### Format vendor lama

Response dari BE/vendor dapat dibungkus sebagai **`data.response.data`** (array layanan), selain format lama (array langsung di `data` atau format `productname` / `totalfee`).

Contoh isi `response.data[]` (camelCase, untuk Addpostingdoc):

| Field | Keterangan |
|-------|------------|
| `serviceCode` | Mis. **910546** (PPKH / marketplace) — dipakai Addpostingdoc |
| `fee`, `feeTax` | Komponen biaya |
| `insurance`, `insuranceTax` | Komponen asuransi ongkir |
| `totalFee` | Total yang ditampilkan sebagai harga opsi |
| `estimation` | ETD teks (mis. `"2 HARI"`) |

**Pemilihan layanan di FE** (`src/lib/posIndonesiaShipmentCost.ts`):

1. `unwrapPosIndonesiaCekOngkirData()` — jika ada `response.data` berupa array, dipakai sebagai daftar layanan.
2. `selectPosIndonesiaDisplayService()` — prioritas **910546**, lalu **910548** (legacy), lalu layanan pertama dengan `totalFee > 0`.
3. Field `fee`, `feeTax`, `insurance`, `insuranceTax`, `totalFee`, `serviceCode` disalin ke **`ShippingOption.posIndonesiaPosting`** (opsional) untuk dipakai nanti saat integrasi Addpostingdoc / order.

Halaman **Paket Reguler** dan **Cek Ongkir** memakai logika yang sama.

---

*Terakhir diselaraskan dengan kode dashboard — Paket Reguler (`CalculationResults.buildShippingData`).*
