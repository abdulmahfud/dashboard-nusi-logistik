## Bentuk BE `/admin/tracking` (real capture — dipakai UI)

Backend membungkus & MENORMALISASI response vendor: `operationTime` jadi epoch **DETIK**
(bukan ms seperti dokumentasi vendor asli di bawah), dan field sender jadi **camelCase**
konsisten (`senderCellphone`, dst — bukan `SenderCellphone` PascalCase seperti di vendor asli).

**PENTING**: wrapper-nya `tracking_data` (bukan `data`) — sama seperti pola JNTCARGO
(lihat `docs/jnt-cargo/tracking.md`). Ada juga `order_info` di top-level yang membawa
`status` sebagai slug status kanonik aplikasi (mis. `"sampai_tujuan"`), berbeda dari
`operationType` mentah di `historys[]` (mis. `"POD Entry"`).

```json
{
    "success": true,
    "vendor": "IDEXPRESS",
    "tracking_data": {
        "status": "success",
        "message": "",
        "data": {
            "basicInfo": {
                "orderNo": "REF260821094509012",
                "orderTime": "",
                "waybillNo": "IDE7001686887959"
            },
            "historys": [
                {
                    "completeProofOfStatus": [
                        "https://storage.googleapis.com/gcs-asia-southeast2-gcs-courier-proof-oms-stg/files/62992ae69b5243ce93342418431533cd34.jpg"
                    ],
                    "courierName": "TH CENGKARENG",
                    "currentBranch": "TH CENGKARENG",
                    "description": "POD entry has been issued by penerima1(https://storage.googleapis.com/gcs-asia-southeast2-gcs-courier-proof-oms-stg/files/62992ae69b5243ce93342418431533cd34.jpg)",
                    "nextBranchName": "",
                    "operationTime": 1787285160,
                    "operationType": "POD Entry",
                    "problemCode": "",
                    "proofOfStatus": "https://storage.googleapis.com/gcs-asia-southeast2-gcs-courier-proof-oms-stg/files/62992ae69b5243ce93342418431533cd34.jpg",
                    "relation": "",
                    "signer": "penerima1",
                    "waybillNo": "IDE7001686887959"
                },
                {
                    "courierName": "TH CENGKARENG",
                    "currentBranch": "TH CENGKARENG",
                    "description": "Being delivered by TH CENGKARENG",
                    "nextBranchName": "",
                    "operationTime": 1787285108,
                    "operationType": "Delivery scan",
                    "problemCode": "",
                    "proofOfStatus": "",
                    "relation": "",
                    "signer": "",
                    "waybillNo": "IDE7001686887959"
                },
                {
                    "courierName": "",
                    "currentBranch": "TH CENGKARENG",
                    "description": "Unloaded at TH CENGKARENG",
                    "nextBranchName": "",
                    "operationTime": 1787285065,
                    "operationType": "Unloading scan",
                    "problemCode": "",
                    "proofOfStatus": "",
                    "relation": "",
                    "signer": "",
                    "waybillNo": "IDE7001686887959"
                },
                {
                    "courierName": "",
                    "currentBranch": "TH CENGKARENG",
                    "description": "Arrived at TH CENGKARENG",
                    "nextBranchName": "",
                    "operationTime": 1787285056,
                    "operationType": "Arrival Scan",
                    "problemCode": "",
                    "proofOfStatus": "",
                    "relation": "",
                    "signer": "",
                    "waybillNo": "IDE7001686887959"
                },
                {
                    "courierName": "TH ADMIN KALIDERES",
                    "currentBranch": "TH KALIDERES",
                    "description": "Sent to TH CENGKARENG",
                    "nextBranchName": "TH CENGKARENG",
                    "operationTime": 1787284933,
                    "operationType": "Sending scan",
                    "problemCode": "",
                    "proofOfStatus": "",
                    "relation": "",
                    "signer": "",
                    "waybillNo": "IDE7001686887959"
                },
                {
                    "courierName": "",
                    "currentBranch": "TH KALIDERES",
                    "description": "Loaded by TH KALIDERES",
                    "nextBranchName": "",
                    "operationTime": 1787284912,
                    "operationType": "Loading scan",
                    "problemCode": "",
                    "proofOfStatus": "",
                    "relation": "",
                    "signer": "",
                    "waybillNo": "IDE7001686887959"
                },
                {
                    "courierName": "TH ADMIN KALIDERES",
                    "currentBranch": "TH KALIDERES",
                    "description": "Picked up by TH KALIDERES",
                    "nextBranchName": "",
                    "operationTime": 1787284878,
                    "operationType": "Pick up scan",
                    "problemCode": "",
                    "proofOfStatus": "",
                    "relation": "",
                    "signer": "",
                    "waybillNo": "IDE7001686887959"
                }
            ],
            "itemInfo": {
                "actualShippingFee": 18000,
                "actualWeight": 1.5,
                "height": 0,
                "insuranceAmount": 0,
                "insured": 0,
                "itemCategory": "00",
                "itemName": "laptop - Tolong hati-hati",
                "itemQuantity": 1,
                "itemRemarks": "",
                "itemValue": 0,
                "length": 0,
                "weight": 1.5,
                "width": 0
            },
            "recipientInfo": {
                "recipientAddress": "Andir, Bandung",
                "recipientCellphone": "085854431548",
                "recipientCity": "JAKARTA BARAT",
                "recipientDistrict": "CENGKARENG",
                "recipientEmail": "",
                "recipientName": "penerima1",
                "recipientPhoneNumber": "",
                "recipientProvince": "DKI JAKARTA",
                "recipientZipCode": ""
            },
            "senderInfo": {
                "senderAddress": "Kebon Jeruk, Jakarta Barat",
                "senderCellphone": "085854464587",
                "senderCity": "JAKARTA BARAT",
                "senderDistrict": "KALIDERES",
                "senderEmail": "",
                "senderName": "pengirim2",
                "senderPhoneNumber": "",
                "senderProvince": "DKI JAKARTA",
                "senderZipCode": ""
            }
        },
        "raw_response": { "...": "payload vendor mentah (code/msg/data[].basicInfo), diabaikan FE, lihat bagian bawah" },
        "reference_no": "REF260821094509012"
    },
    "order_info": {
        "reference_no": "REF260821094509012",
        "vendor": "IDEXPRESS",
        "awb_no": "IDE7001686887959",
        "status": "sampai_tujuan",
        "created_at": "2026-08-21T03:50:25.000000Z",
        "user_id": 1
    }
}
```

Field penting yang beda dari dokumentasi vendor asli (lihat bagian bawah):
- Wrapper-nya `tracking_data` (bukan `data`) + ada `order_info` di top-level.
- `order_info.status` → slug status kanonik aplikasi (mis. `"sampai_tujuan"`), BEDA dari
  `tracking_data.data.historys[].operationType` yang teks mentah vendor (mis. `"POD Entry"`).
  FE meng-copy `order_info.status` ke `tracking_data.current_status.status` juga, supaya
  badge di `CurrentStatusCard` mewarnai dengan benar (deskripsi tetap pakai teks asli).
- `operationTime` (di `historys[]`) → epoch **detik**, bukan ms.
- `basicInfo.orderTime` → string tanggal (bisa `""`), menggantikan `shipingTime` (epoch ms) di vendor asli.
- `senderInfo.*` → camelCase (`senderCellphone`, `senderProvince`, dst), bukan PascalCase.
- `itemInfo.actualShippingFee` / `itemInfo.actualWeight` → field baru, dipakai untuk `shipment.shipping_cost` / `shipment.weight`.
- `historys[].description`, `problemCode`, `completeProofOfStatus[]` → field baru (teks status lengkap & foto POD).

Ditangani oleh `src/lib/idexpressTrackingTransform.ts` → `isIdexpressBeTrackingWrapper` +
`transformIdexpressBeTrackingResponse`, didaftarkan sebagai transformer utama vendor
`idexpress` di `src/lib/trackingTransform.ts`.

---

## Dokumentasi resmi vendor (raw, lihat `NEW API Documentation IDE V.2.5.0.pdf`)

Dipertahankan sebagai fallback (`transformIdexpressTrackingResponse` +
`normalizeLegacyIdexpressData`) kalau BE suatu saat meneruskan payload vendor ini langsung
tanpa normalisasi.

Successful Response
```json
{
"code":0,
"desc":null,
"total":null,
"data":
{
"basicInfo":
{
"orderNo":"OR0111666000999",
"waybillNo":"IDD955255915888",
"shipingTime":1294890876859
},
"itemInfo":
{
"itemName":"ITEMNAME",
"insured":"0",
"itemRemarks": "itemRemarks",
"itemQuantity":122,
"itemCategory":"01",
"weight":"12.34",
"length":222,"width":222,"height":222,
"insuranceAmount":"123",
"itemValue":"124"
},
"senderInfo":
{
"senderName":"senderName",
"senderEmail":"sender@gmail.com",
"SenderPhoneNumber":"1599090889",
"SenderCellphone":"5678999",
"SenderProvince":"DKI JAKARTA",
"SenderCity":"JAKARTA TIMUR",
"SenderDistrict":"KUNINGAN",
"SenderAddress":"SenderAddress House 521",
"SenderZipCode":"5035"
},
"recipientInfo":
{
"recipientName":"recipientName",
"recipientEmail":"recipient@gmail.com",
"recipientPhoneNumber":"15990908888",
"recipientCellphone":"5678888",
"recipientProvince":"JAWA TENGAH",
"recipientCity":"CILACAP",
"recipientDistrict":"CILACAP",
"recipientAddress":"recipientAddress House 677"
},
"historys":
[
{
"waybillNo":"IDD955255915888",
"operationType":"pick up scan",
"operationTime":1294890876859,
"courierName":"CourierAdmin",
"currentBranch": "HEADQUARTER",
"nextBranchName":"BranchName",
"proofOfStatus": "https://google.com/image.jpg",
"relation":"Parent",
"signer":"signer1"
}
]
}
}
```

Failed Response (Business Exception)
```json
{
"code": 100002,
"desc": "Unable to find waybill",
"total": null,
"data": null
}
```

Failed Response (System Exception)
```json
{
"code": -100000,
"desc": "System exception, please contact us",
"total": null,
"data": null
}
```
