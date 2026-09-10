Success Response:

{
    "status": 200,
    "info": "OK",
    "content": {
        "waybill_no": "10001079472341",
        "history": [
            {
                "hub_name": "Hub Halim",
                "message": {
                    "id": "Delivery sukses oleh SATRIA dan paket telah diterima oleh ibu pola(Keluarga). Terima kasih sudah menggunakan jasa AnterAja #PastiBawaHepi."
                },
                "params": null,
                "tracking_code": 250,
                "timestamp": "2021-04-06T10:45:03.949+0000"
            },
            {
                "hub_name": "Hub Halim",
                "message": {
                    "id": "SATRIA sudah ditugaskan dan parcel akan segera diantar ke penerima."
                },
                "params": null,
                "tracking_code": 240,
                "timestamp": "2021-04-06T10:10:12.936+0000"
            },
            {
                "hub_name": "Hub Halim",
                "message": {
                    "id": "Parcel sudah tiba di SS Kota Jkt Tmr - Kebon Pala untuk proses delivery."
                },
                "params": null,
                "tracking_code": 230,
                "timestamp": "2021-04-06T09:51:07.000+0000"
            },
            {
                "hub_name": "LH8 Kota Jkt Tmr - Kebon Pala",
                "message": {
                    "id": "Parcel sedang menuju ke staging."
                },
                "params": null,
                "tracking_code": 330,
                "timestamp": "2021-04-06T09:50:08.000+0000"
            },
            {
                "hub_name": "LH8 Kota Jkt Tmr - Kebon Pala",
                "message": {
                    "id": "Parcel sedang diproses di Hub Jakarta Timur-Makasar"
                },
                "params": null,
                "tracking_code": 300,
                "timestamp": "2021-04-06T09:47:58.516+0000"
            },
            {
                "hub_name": "LH8 Kota Jkt Tmr - Kebon Pala",
                "message": {
                    "id": "Parcel sudah tiba di Hub Jakarta Timur-Makasar."
                },
                "params": null,
                "tracking_code": 220,
                "timestamp": "2021-04-06T09:47:45.000+0000"
            },
            {
                "hub_name": "LH8 Kota Jkt Tmr - Kebon Pala",
                "message": {
                    "id": "Parcel sedang diproses di Hub Jakarta Timur-Makasar"
                },
                "params": null,
                "tracking_code": 300,
                "timestamp": "2021-04-06T09:47:38.006+0000"
            },
            {
                "hub_name": "Hub Halim",
                "message": {
                    "id": "Parcel sudah tiba di SS Kota Bekasi - Jatimelati untuk menuju ke hub."
                },
                "params": null,
                "tracking_code": 210,
                "timestamp": "2021-04-06T08:28:41.461+0000"
            },
            {
                "hub_name": "Hub Halim",
                "message": {
                    "id": "Parcel sudah di-pickup oleh SATRIA."
                },
                "params": null,
                "tracking_code": 200,
                "timestamp": "2021-04-06T07:17:51.756+0000"
            },
            {
                "hub_name": "Hub Halim",
                "message": {
                    "id": "Tugas pickup sudah diambil alih oleh SATRIA dan parcel akan segera pickup."
                },
                "params": null,
                "tracking_code": 160,
                "timestamp": "2021-04-06T06:37:07.696+0000"
            },
            {
                "hub_name": "Hub Bekasi",
                "message": {
                    "id": "SATRIA sudah ditugaskan dan parcel akan segera di-pickup."
                },
                "params": null,
                "tracking_code": 150,
                "timestamp": "2021-04-06T06:21:04.587+0000"
            },
            {
                "hub_name": null,
                "message": {
                    "id": "Pickup sudah di-request oleh shipper, dan SATRIA akan pickup parcel Selasa 6 April 2021 sekitar jam 13:20 - 15:20."
                },
                "params": null,
                "tracking_code": 100,
                "timestamp": "2021-04-06T06:20:22.837+0000"
            }
        ],
        "order": {
            "booking_id": "TQ04215IYBZC-01",
            "shipper": {
                "address": "Jl. Wibawa Mukti II No.5, RT.004/RW.8, Jatiasih, Kec. Jatiasih, Kota Bekasi, Jawa Barat 17423",
                "phone": "6281290529552",
                "name": "Apotek Wibawa Mukti",
                "postcode": "17423"
            },
            "waybill": "10001079472341",
            "receiver": {
                "address": "Jl. Komodor Halim Perdana Kusuma Blok Mawar No.26, RT.7/RW.8, Halim Perdana Kusumah, Kec. Makasar, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13610, Indonesia",
                "phone": "6281311436911",
                "name": "Inda Supriyanti",
                "postcode": "13610"
            },
            "service_fee": 15000,
            "weight": 1000,
            "service_code": "SD",
            "invoice": "INV-TQ04215IYBZC-01",
            "actual_shipper": {
                "proof_images": [],
                "name": null,
                "proof_images_url": [],
                "relationship": null
            },
            "actual_receiver": {
                "proof_images": [],
                "name": "ibu pola",
                "proof_images_url": [],
                "relationship": "Keluarga"
            }
        }
    }
}
Failed Response:

{
    "status": 200,
    "info": "OK",
    "content": {
        "waybill_no": "10001079472341",
        "history": null,
        "order": null
    }
}