# Cancel Order API Documentation

## Overview
API untuk membatalkan order dari berbagai vendor expedisi. Format standar menggunakan `awb_no` untuk semua vendor, memudahkan implementasi di frontend.

## Endpoint

```
POST /api/admin/expedition/{vendor}/cancel
```

### URL Parameters
- `vendor` (required): Nama vendor expedisi (case-insensitive)
  - Supported vendors: `anteraja`, `jntexpress`, `paxel`, `posindonesia`, `jne`, `ninjaexpress`, `idexpress`, `jntcargo`, `gosend`, `lion`, `sap`

## Authentication

**Required**: Bearer Token (JWT)

Header:
```
Authorization: Bearer {your_jwt_token}
```

**Permission Required**: User harus memiliki role `superadmin`

## Request Body

### Standard Format (Recommended)

```json
{
  "awb_no": "11000009327773",
  "remark": "Customer requested cancellation" // Optional
}
```

### Minimal Format (Without Remark)

```json
{
  "awb_no": "11000009327773"
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `awb_no` | string | **Yes** | Airway Bill Number (AWB) dari order yang akan dibatalkan |
| `remark` | string | No | Alasan pembatalan (max 255 characters). Jika tidak disediakan, akan menggunakan default sesuai vendor |

### Backward Compatibility Fields

Untuk kompatibilitas dengan implementasi lama, field berikut juga didukung (akan di-mapping ke `awb_no`):

- `awb` (string) - akan di-mapping ke `awb_no`
- `orderid` (string) - akan di-mapping ke `awb_no`
- `order_id` (integer) - akan mencari order dan menggunakan `awb_no` dari order tersebut

**Note**: Disarankan menggunakan `awb_no` sebagai field utama untuk konsistensi.

## Response

### Success Response (200 OK)

```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": {
    "status": "success",
    "message": "Order cancelled successfully",
    "order_id": 123,
    "awb_no": "11000009327773",
    "vendor_response": {
      // Response dari vendor API (berbeda-beda per vendor)
    }
  }
}
```

### Error Responses

#### 401 Unauthorized
```json
{
  "success": false,
  "message": "Unauthenticated. Please provide a valid authentication token."
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "message": "Anda tidak memiliki izin untuk membatalkan order"
}
```

#### 422 Validation Error
```json
{
  "success": false,
  "message": "awb_no is required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "message": "Order not found. Please provide awb_no."
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Gagal membatalkan order: {error_message}"
}
```

## Vendor-Specific Notes

### JNT Express
- Default remark: `"Customer requested cancellation"` (jika tidak disediakan)
- Menggunakan `reference_no` untuk API call ke JNT (internal conversion dari `awb_no`)

### Anteraja
- Menggunakan `waybill_no` untuk API call ke Anteraja (internal conversion dari `awb_no`)

### Paxel
- Menerima `awb_no` atau `airwaybill_code`
- Default remark: `"cancel"` (jika tidak disediakan)

### Pos Indonesia
- Default remark: `"Canceled by user"` (jika tidak disediakan)

### JNE
- Default remark: `"Order cancellation requested by user"` (jika tidak disediakan)

### Other Vendors
- Menggunakan default remark sesuai implementasi masing-masing vendor

## Supported Vendors

| Vendor | Format | Notes |
|--------|--------|-------|
| `anteraja` | `awb_no` | ✅ Supported |
| `jntexpress` | `awb_no` | ✅ Supported (default remark: "Customer requested cancellation") |
| `paxel` | `awb_no` | ✅ Supported |
| `posindonesia` | `awb_no` | ✅ Supported |
| `jne` | `awb_no` | ✅ Supported |
| `ninjaexpress` | `awb_no` | ✅ Supported |
| `idexpress` | `awb_no` | ✅ Supported |
| `jntcargo` | `awb_no` | ✅ Supported |
| `gosend` | `awb_no` | ✅ Supported |
| `lion` | `awb_no` | ✅ Supported |
| `sap` | `awb_no` | ✅ Supported |

## Important Notes

1. **Authentication**: Semua request memerlukan JWT token yang valid
2. **Permission**: Hanya user dengan role `superadmin` yang dapat membatalkan order
3. **Order Status**: Order dengan status `dibatalkan` atau `sampai_tujuan` tidak dapat dibatalkan
4. **AWB Required**: Order harus memiliki AWB number untuk dapat dibatalkan
5. **Vendor Format**: Vendor name case-insensitive (bisa `anteraja`, `Anteraja`, `ANTERAJA`)
6. **Remark**: Field `remark` optional, jika tidak disediakan akan menggunakan default sesuai vendor
7. **Consistency**: Format `awb_no` konsisten untuk semua vendor, memudahkan implementasi frontend

## Testing

### cURL Example

```bash
curl -X POST "https://api.bhisakirim.com/api/admin/expedition/anteraja/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "awb_no": "11000009327773",
    "remark": "Customer requested cancellation"
  }'
```

### Minimal Request

```bash
curl -X POST "https://api.bhisakirim.com/api/admin/expedition/jntexpress/cancel" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "awb_no": "11000009327773"
  }'
```

## Changelog

### Version 1.0.0 (2026-01-22)
- ✅ Standardized format menggunakan `awb_no` untuk semua vendor
- ✅ Backward compatibility dengan field lama (`awb`, `orderid`, `order_id`)
- ✅ Default remark untuk JNT Express: "Customer requested cancellation"
- ✅ Konsisten format untuk semua expedisi vendor
