## Skenario 1: Reguler (Tanpa COD, Tanpa Asuransi)

### Request Payload

```json
{
  "shipping_data": {
    "vendor": "anteraja",
    "sender": {
      "name": "Toko ABC",
      "phone": "081234567890",
      "email": "toko@example.com",
      "address": "Jl. Sudirman No. 123",
      "province": "DKI Jakarta",
      "regency": "Jakarta Selatan",
      "district": "Kebayoran Baru",
      "postal_code": "12120",
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "receiver": {
      "name": "Budi Santoso",
      "phone": "081234567891",
      "email": "budi@example.com",
      "address": "Jl. Gatot Subroto No. 456",
      "province": "Jawa Barat",
      "regency": "Bandung",
      "district": "Coblong",
      "postal_code": "40131",
      "latitude": -6.9175,
      "longitude": 107.6191
    },
    "pickup": false,
    "serviceType": "REGULER",
    "detail": {
      "weight": 2.5,
      "qty": 1,
      "item_value": 5000000,
      "cod": 0,
      "goods_desc": "Laptop Gaming",
      "category": "ELEKTRONIK",
      "insurance": 0,
      "instruction": "Hati-hati, barang mudah pecah",
      "panjang": 40,
      "lebar": 30,
      "tinggi": 10
    }
  },
  "amount": 25000
}
```

### Penjelasan Field

- `cod: 0` → Bukan COD order
- `insurance: 0` → Tidak pakai asuransi
- `amount: 25000` → Jumlah yang harus dibayar (ongkir)
- `service_code` di database akan menjadi: `"REGULER"`

---

## Skenario 2: COD (Dengan COD, Tanpa Asuransi)

### Request Payload

```json
{
  "shipping_data": {
    "vendor": "anteraja",
    "sender": {
      "name": "Toko ABC",
      "phone": "081234567890",
      "email": "toko@example.com",
      "address": "Jl. Sudirman No. 123",
      "province": "DKI Jakarta",
      "regency": "Jakarta Selatan",
      "district": "Kebayoran Baru",
      "postal_code": "12120",
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "receiver": {
      "name": "Budi Santoso",
      "phone": "081234567891",
      "email": "budi@example.com",
      "address": "Jl. Gatot Subroto No. 456",
      "province": "Jawa Barat",
      "regency": "Bandung",
      "district": "Coblong",
      "postal_code": "40131",
      "latitude": -6.9175,
      "longitude": 107.6191
    },
    "pickup": false,
    "serviceType": "REGULER",
    "detail": {
      "weight": 2.5,
      "qty": 1,
      "item_value": 5000000,
      "cod": 5000000,
      "goods_desc": "Laptop Gaming",
      "category": "ELEKTRONIK",
      "insurance": 0,
      "instruction": "Hati-hati, barang mudah pecah",
      "panjang": 40,
      "lebar": 30,
      "tinggi": 10
    }
  },
  "amount": 0
}
```

### Penjelasan Field

- `cod: 5000000` → COD order dengan nilai Rp 5.000.000
- `insurance: 0` → Tidak pakai asuransi
- `amount: 0` → Tidak perlu bayar di muka (COD)
- `service_code` di database akan menjadi: `"COD"` (otomatis diubah dari "REGULER")
- Order akan langsung diproses ke vendor setelah dibuat (tidak perlu payment)

---

## Skenario 3: Reguler + Asuransi (Tanpa COD, Dengan Asuransi)

### Request Payload

```json
{
  "shipping_data": {
    "vendor": "anteraja",
    "sender": {
      "name": "Toko ABC",
      "phone": "081234567890",
      "email": "toko@example.com",
      "address": "Jl. Sudirman No. 123",
      "province": "DKI Jakarta",
      "regency": "Jakarta Selatan",
      "district": "Kebayoran Baru",
      "postal_code": "12120",
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "receiver": {
      "name": "Budi Santoso",
      "phone": "081234567891",
      "email": "budi@example.com",
      "address": "Jl. Gatot Subroto No. 456",
      "province": "Jawa Barat",
      "regency": "Bandung",
      "district": "Coblong",
      "postal_code": "40131",
      "latitude": -6.9175,
      "longitude": 107.6191
    },
    "pickup": false,
    "serviceType": "REGULER",
    "detail": {
      "weight": 2.5,
      "qty": 1,
      "item_value": 5000000,
      "cod": 0,
      "goods_desc": "Laptop Gaming",
      "category": "ELEKTRONIK",
      "insurance": 1,
      "instruction": "Hati-hati, barang mudah pecah",
      "panjang": 40,
      "lebar": 30,
      "tinggi": 10
    }
  },
  "amount": 25000
}
```

### Penjelasan Field

- `cod: 0` → Bukan COD order
- `insurance: 1` → Pakai asuransi (nilai asuransi dihitung dari `item_value`)
- `item_value: 5000000` → Nilai barang untuk asuransi
- `amount: 25000` → Jumlah yang harus dibayar (ongkir + asuransi)
- `service_code` di database akan menjadi: `"REGULER"`

---

## Skenario 4: COD + Asuransi (Dengan COD, Dengan Asuransi)

### Request Payload

```json
{
  "shipping_data": {
    "vendor": "anteraja",
    "sender": {
      "name": "Toko ABC",
      "phone": "081234567890",
      "email": "toko@example.com",
      "address": "Jl. Sudirman No. 123",
      "province": "DKI Jakarta",
      "regency": "Jakarta Selatan",
      "district": "Kebayoran Baru",
      "postal_code": "12120",
      "latitude": -6.2088,
      "longitude": 106.8456
    },
    "receiver": {
      "name": "Budi Santoso",
      "phone": "081234567891",
      "email": "budi@example.com",
      "address": "Jl. Gatot Subroto No. 456",
      "province": "Jawa Barat",
      "regency": "Bandung",
      "district": "Coblong",
      "postal_code": "40131",
      "latitude": -6.9175,
      "longitude": 107.6191
    },
    "pickup": false,
    "serviceType": "REGULER",
    "detail": {
      "weight": 2.5,
      "qty": 1,
      "item_value": 5000000,
      "cod": 5000000,
      "goods_desc": "Laptop Gaming",
      "category": "ELEKTRONIK",
      "insurance": 1,
      "instruction": "Hati-hati, barang mudah pecah",
      "panjang": 40,
      "lebar": 30,
      "tinggi": 10
    }
  },
  "amount": 0
}
```

### Penjelasan Field

- `cod: 5000000` → COD order dengan nilai Rp 5.000.000
- `insurance: 1` → Pakai asuransi (nilai asuransi dihitung dari `item_value`)
- `item_value: 5000000` → Nilai barang untuk asuransi
- `amount: 0` → Tidak perlu bayar di muka (COD)
- `service_code` di database akan menjadi: `"COD"` (otomatis diubah dari "REGULER")
- Order akan langsung diproses ke vendor setelah dibuat (tidak perlu payment)

---

## Field Reference

### Root Level

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `shipping_data` | object | Yes | Data pengiriman lengkap |
| `amount` | number | Yes | Jumlah pembayaran (0 untuk COD) |

### shipping_data.sender / receiver

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Nama lengkap |
| `phone` | string | Yes | Nomor telepon |
| `email` | string | No | Email |
| `address` | string | Yes | Alamat lengkap |
| `province` | string | Yes | Nama provinsi |
| `regency` | string | Yes | Nama kota/kabupaten |
| `district` | string | Yes | Nama kecamatan |
| `postal_code` | string | No | Kode pos |
| `latitude` | number | No | Latitude (opsional, untuk pickup/delivery) |
| `longitude` | number | No | Longitude (opsional, untuk pickup/delivery) |

### shipping_data.detail

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `weight` | number | Yes | Berat dalam kg | `2.5` |
| `qty` | number | Yes | Jumlah item | `1` |
| `item_value` | number | Yes | Nilai barang | `5000000` |
| `cod` | number | No | Nilai COD (0 jika bukan COD) | `5000000` atau `0` |
| `goods_desc` | string | Yes | Deskripsi barang | `"Laptop Gaming"` |
| `category` | string | No | Kategori barang | `"ELEKTRONIK"` |
| `insurance` | number | No | Asuransi: `1` = pakai, `0` = tidak | `1` atau `0` |
| `instruction` | string | No | Instruksi pengiriman | `"Hati-hati"` |
| `panjang` | number | No | Panjang dalam cm | `40` |
| `lebar` | number | No | Lebar dalam cm | `30` |
| `tinggi` | number | No | Tinggi dalam cm | `10` |

**Alternatif nama field untuk dimensi:**
- `panjang` atau `length`
- `lebar` atau `width`
- `tinggi` atau `height`

### shipping_data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `vendor` | string | Yes | Harus `"anteraja"` (lowercase) |
| `pickup` | boolean | No | `true` = pickup, `false` = dropoff |
| `serviceType` | string | No | Service code: `"REGULER"`, `"SAME_DAY"`, `"NEXT_DAY"`, `"EXPRESS"` |

---

## Response Examples

### Success Response (Non-COD)

```json
{
  "success": true,
  "message": "Order created successfully. Please proceed with payment.",
  "data": {
    "order_id": 123,
    "order": { ... },
    "reference_no": "BSKI-20260127123456789",
    "payment_amount": 25000
  },
  "payment_amount": 25000,
  "requires_payment": true
}
```

### Success Response (COD)

```json
{
  "success": true,
  "message": "COD order created and processed successfully.",
  "data": {
    "order_id": 123,
    "order": { ... },
    "reference_no": "BSKI-20260127123456789",
    "awb_no": "11000009527711",
    "status": "belum_proses",
    "is_cod": true,
    "cod_value": 5000000
  },
  "payment_amount": 0,
  "requires_payment": false
}
```

---

## Catatan Penting

1. **COD Logic**: Jika `cod > 0`, maka `service_code` di database akan otomatis menjadi `"COD"` meskipun `serviceType` adalah `"REGULER"`.

2. **Insurance Logic**: 
   - `insurance: 1` → Pakai asuransi
   - `insurance: 0` → Tidak pakai asuransi
   - Nilai asuransi dihitung dari `item_value`

3. **Multiple Addresses**: Sistem menggunakan `user_id + phone + address + district` sebagai unique identifier, sehingga setiap alamat cabang menjadi record terpisah.

4. **Kategori Barang**: Gunakan format lokal (mis. `"ELEKTRONIK"`), akan otomatis di-map ke format AnterAja.

5. **Dimensi**: Gunakan `panjang`, `lebar`, `tinggi` (atau `length`, `width`, `height`).

6. **Data Storage**: Semua data tersimpan di `request_payload` untuk audit trail.

7. **Latitude/Longitude (Optional)**: 
   - Field `latitude` dan `longitude` adalah **opsional** (tidak wajib)
   - Jika dikirim, akan digunakan untuk `geoloc` di payload AnterAja API
   - Format: `"latitude,longitude"` (contoh: `"-6.2088,106.8456"`)
   - Validasi: 
     - Latitude: -90 sampai 90
     - Longitude: -180 sampai 180
   - Jika salah satu tidak valid atau tidak ada, `geoloc` akan menjadi string kosong
   - Berguna untuk pickup service agar driver bisa menemukan lokasi dengan lebih akurat
