Response BE `/admin/tracking` untuk vendor JNTCARGO (update: BE sekarang menyertakan
shipping_cost/total_cost/insurance_cost/weight & sender/receiver lengkap di `tracking_data.data`)

{
    "success": true,
    "vendor": "JNTCARGO",
    "tracking_data": {
        "status": "success",
        "message": "Tracking information retrieved successfully",
        "data": {
            "bill_code": "200004721911",
            "vendor": "JNTCARGO",
            "current_status": "sampai_tujuan",
            "current_status_description": "Paket telah diterima",
            "delivery_status": "delivered",
            "shipping_cost": 7.04,
            "total_cost": 7.04,
            "insurance_cost": 0,
            "weight": 1,
            "sender_city": "Kab Bandung",
            "receiver_city": "Kota Bandung",
            "tracking_history": [
                {
                    "datetime": "2026-08-13 09:09:56",
                    "scan_code": 10,
                    "scan_type": "tanda terima",
                    "description": "【Kab Bandung】paket sudah diterima!penerima adalah【diterima sendiri】，jika ada pertanyaan silakan hubungi 85272714110，jika ada masalah atau pengaduan silakan hubungi nomor telepon outlet 66548745121|cs",
                    "location": "TestWD1J, Banjaran-Sog, Kab Bandung, Jawa Barat",
                    "next_stop_name": "Pieter Sprinter",
                    "staff_name": "Pieter Sprinter",
                    "staff_contact": "85272714110",
                    "problem_type": null,
                    "pic_url": [
                        "https:\/\/demoopenapi.jtcargo.co.id\/webopenplatformapi\/open\/getDownloadSignedUrl?path=lite-ylappbc\/SIGNING_SCAN_LIST\/3397774a869e46b8a2e0326704a2ff75.jpg",
                        "https:\/\/demoopenapi.jtcargo.co.id\/webopenplatformapi\/open\/getDownloadSignedUrl?path=lite-ylappbc\/SIGNING_SCAN_LIST\/71af7b0faef14c889e2f695f5b95a0de.jpg"
                    ],
                    "weight": 1,
                    "shipping_cost": 7.04,
                    "total_cost": 7.04,
                    "insurance_cost": 0,
                    "sender_city": "Kab Bandung",
                    "receiver_city": "Kota Bandung"
                },
                {
                    "datetime": "2026-08-13 09:08:25",
                    "scan_code": 5,
                    "scan_type": "scan keluar gudang",
                    "description": "【Kab Bandung】【TestWD1J】kami Pieter Sprinter(85272714110)sedang mengantarkan paket, jika ada masalah atau pengaduan silakan hubungi nomor telepon outlet 66548745121|cs ",
                    "location": "TestWD1J, Banjaran-Sog, Kab Bandung, Jawa Barat",
                    "next_stop_name": null,
                    "staff_name": "Pieter Sprinter",
                    "staff_contact": "85272714110",
                    "problem_type": null,
                    "pic_url": [],
                    "weight": 1,
                    "shipping_cost": 7.04,
                    "total_cost": 7.04,
                    "insurance_cost": 0,
                    "sender_city": "Kab Bandung",
                    "receiver_city": "Kota Bandung"
                },
                {
                    "datetime": "2026-08-13 09:07:55",
                    "scan_code": 1,
                    "scan_type": "pengambilan paket",
                    "description": "【Kab Bandung】【TestWD1J】Kuri J&amp;T Cargo Anda Pieter Sprinter(85272714110)sudah mengambil paket. Jika ada masalah atau pengaduan silakan hubungi nomor telepon outlet 66548745121|cs",
                    "location": "TestWD1J, Banjaran-Sog, Kab Bandung, Jawa Barat",
                    "next_stop_name": null,
                    "staff_name": "Pieter Sprinter",
                    "staff_contact": "85272714110",
                    "problem_type": null,
                    "pic_url": [],
                    "weight": 1,
                    "shipping_cost": 7.04,
                    "total_cost": 7.04,
                    "insurance_cost": 0,
                    "sender_city": "Kab Bandung",
                    "receiver_city": "Kota Bandung"
                }
            ],
            "sender": {
                "name": "JNT Cargo Test Sender",
                "phone": "081234567890",
                "address": "Jl. Contoh No. 1",
                "province": "DKI Jakarta",
                "regency": "Jakarta Barat",
                "district": "Cengkareng",
                "postal_code": "11730"
            },
            "receiver": {
                "name": "JNT Cargo Test Receiver",
                "phone": "081298765432",
                "address": "Jl. Contoh No. 2",
                "province": "Jawa Barat",
                "regency": "Bandung",
                "district": "Coblong",
                "postal_code": "40132"
            }
        },
        "raw_response": "(debug passthrough, lihat riwayat file ini di git log untuk contoh lengkap raw_response.raw_response berisi payload mentah vendor code/msg/data[].billCode.details[])",
        "reference_no": "JNTC-TEST-20260811164221-3-A8BC"
    },
    "order_info": {
        "reference_no": "JNTC-TEST-20260811164221-3-A8BC",
        "vendor": "JNTCARGO",
        "awb_no": "200004721911",
        "status": "sampai_tujuan",
        "created_at": "2026-08-11T09:42:21.000000Z",
        "user_id": 1
    }
}

Field penting di `tracking_data.data`:
- `current_status`: slug status kanonik aplikasi (mis. "sampai_tujuan") — dipakai apa adanya untuk pewarnaan badge, sama seperti `status_overview` di `getOrderStatistics()`. Jangan diganti teks deskripsi.
- `shipping_cost` / `total_cost` / `insurance_cost` / `weight`: angka biaya & berat shipment.
- `sender` / `receiver`: objek lengkap (name, phone, address, province, regency, district, postal_code).
- `sender_city` / `receiver_city`: fallback nama kota saja (dipakai kalau `sender`/`receiver` object tidak ada).

Ditangani oleh `src/lib/jntCargoTrackingTransform.ts` → `isJntCargoBeTrackingWrapper` + `transformJntCargoBeTrackingResponse`,
didaftarkan sebagai transformer utama vendor `jntcargo` di `src/lib/trackingTransform.ts`.
