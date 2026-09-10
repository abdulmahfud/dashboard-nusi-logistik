Method : GET
URL https://apicloud.posindonesia.co.id/UtilityNew/1.0.1/all/tracking/{id}Header Parameter
Field Description
Content-Type application/json
Authorization Bearer TOKEN
id Description
KodeBooking {KodeBooking}
Resi {Connote}
Format Respon Tracking Kode Booking
{ "connote_id": "0bf60d89-1856-0d0b-0c3d-19a40bd60cc1", "connote_number": 1, "connote_sender_name": "PLT ITS", "connote_sender_phone": "081229282266", "connote_sender_email": "burb@its.ac.id", "connote_sender_address": "Biro Umum dan Reformasi Birokrasi ITS Kampus ITS Sukolilo", "connote_sender_zipcode": "", "connote_receiver_name": "JASON OSBORN TATIMU", "connote_receiver_phone": "081232300595", "connote_receiver_email": "jasonotatimu@gmail.com", "connote_receiver_address": "Manyar Kartika Timur 1 9A", "connote_receiver_address_detail": "KOTA SURABAYA , SUKOLILO, MENUR PUMPUNGAN", "connote_receiver_zipcode": "60118", "connote_service": "PKH", "connote_service_price": 7000, "connote_amount": 7000,
"connote_code": "P2411250181724", "connote_booking_code": "ITS241125150004", "connote_order": 181724, "connote_state": "DELIVERED", "connote_state_id": 2, "zone_code_from": "60000", "zone_code_to": "60000", "surcharge_amount": null, "custom_field": "{\"statusRetur\":\"Kembali ke
pengirim\",\"pks_no\":null,\"expired_pks\":null,\"minimumweight\":null,\"COD\":\"NON- COD\",\"member_id\":null,\"member_email\":null,\"booking\":null,\"tariff_prefix\":null,\"konsolidator\":null,\"Jenis_Barang\":\"Dokumen\",\"account_pgm\":null,\"id_oranger\":null,\"surcharge_code_jasindo\":null,\"customer_discount\":null,\"idpel_umkm\":null,\"fee_beacod\":null,\"free_beacod_value\":0,\"tariff_before_discount\":7000,\"total_bruto\":null,\"total_potongan\":null,\"point\":0,\"diskon\":0,\"voucher\":0,\"published_subservices\":null,\"discountPelangganPKH\":null,\"id_pelanggan_korporat\":null,\"cn23\":null,\"NONPPN\":null,\"cod_value\":0,\"fee_value\":null,\"total_cod\":0,\"lumpsum_connote_amount\":null,\"rekening_no\":null,\"npwp_number\":
null,\"tariff_field\":null,\"ref_no\":null,\"instruksi_pengiriman\":null,\"metode_pembayaran\":\"invoice\",\"source\":\"webhook\",\"discount_from_formula\":0,\"history_tracking\":{\"coordinate\":\"-7.2918552, 112.7679105\",\"last_unbag\":\"2024-11-26 05:10:43\",\"last_inlocation\":\"2024-11-25
22:04:19\"},\"destination_reg\":\"7\",\"destination_kprk\":\"60000\",\"destination_nopen\":\"60000\",\"destination_reg_new\":\"5\",\"final_swp\":\"2\",\"final_swp_date_new\":\"2024-11- 27T18:42:16+0700\",\"sla_unixtime\":1732726799,\"MOT\":\"SEKUNDER, TERSIER
MALAM\",\"cod_collected\":false,\"timeArrived\":\"2024-11- 26T11:14:23+0700\",\"timePredictionArrived\":\"2024-11-27T18:42:16+0700\",\"destination_location\":\"DCSUKOLILO 6090C\",\"timeLate\":\"- 16.53\",\"is_over_sla\":0,\"sla_duration\":16,\"sla_duration_minutes\":992,\"C_is_Late\":0,\"C_Delivery\":\"DCSUKOLILO
6090C\",\"diterimaPenerima\":false,\"usernameDeliveredBy\":\"560004210\",\"deliverySuccessTime\":\"2024- 11-26T11:14:23+0700\",\"first_attempt_time\":\"2024-11- 26T11:14:23+0700\",\"taskIdDelivery\":\"13bc991eb02e167de41e\"}", "transaction_id": "t-18560e4e-18dd-0d05-19a6-193f19e61813", "actual_weight": 0.1, "volume_weight": 0, "chargeable_weight": 1, "created_by": "213047", "created_at": "2024-11-25 18:42:16", "updated_at": "2024-11-26 11:14:33",
"organization_id": 30, "location_id": "60013ed08689533b7410e1d2", "currentLocation": "{\"name\":\"DC SUKOLILO
6090C\",\"code\":\"DCSKL\",\"location_type\":\"DC\",\"type\":\"cod\",\"bag\":null,\"full_name\":\"SatriyaJayaTetuko\",\"username\":null,\"last_updated\":\"2024-11-26 05:10:44\"}", "connote_total_package": "1", "connote_surcharge_amount": "0", "connote_sla_day": "2", "location_name": "KC SURABAYASELATAN 60300", "location_type": "KPRK", "source_tariff_db": "tariffs", "id_source_tariff": "103906550", "pod": { "photo": "https://apistorage.mile.app/v2- public/prod/pos/2024/11/26/camera.photoDeliveryProcessImage.560004210.13bc991eb02e167de41e.1732594447024.jpg", "signature": "https://apistorage.mile.app/v2- public/prod/pos/2024/11/26/signature.signatureDeliveryProcessImage.560004210.13bc991eb02e167de41e.1732594459815.jpg", "timeReceive": "2024-11-26T11:14:23+0700", "receiver": "Sulis (DITERIMA ORANG SERUMAH)", "coordinate": "-7.2918552,112.7679105"
},"is_locked": 1, "tariff_formula_data": "[{\"key\":\"base_tariff\",\"value\":7000}]", "formula_name": "POS EXPRESS dan POS KILAT KHUSUS", "create_from": "New View", "zone_destination_data": [
{"zone_name": "60000", "zone_code": "60000", "zone_type_code": "tariff", "cache": true
},{"zone_name": "7", "zone_code": "Regional7",
"zone_type_code": "destination_reg"
},{"zone_name": "60000", "zone_code": "KPRK_60000", "zone_type_code": "KPRK"
},{"zone_name": "60000", "zone_code": "KPRK_DEST_60000", "zone_type_code": "destination_kprk"
},{"zone_name": "60000", "zone_code": "NOPEN_DEST_60000", "zone_type_code": "destination_nopen"
},{"zone_name": "SB-SL", "zone_code": "swaSB-SL", "zone_type_code": "singkatan_Wilayah_Antar"
},{"zone_name": "SPP SB", "zone_code": "shSPP SB", "zone_type_code": "Singkatan_Hub"
},{"zone_name": "60000", "zone_code": "60000", "zone_type_code": "LPU"
},{"zone_name": "France", "zone_code": "FR", "zone_type_code": "outgoing"
},
{"zone_name": "United State", "zone_code": "US", "zone_type_code": "outgoing"
}
],"bags": "[]", "connote_sender_custom_field": "[]", "connote_sla_date": "2024-11-27 18:42:16", "total_discount": 0, "connote_code_": "P2411250181724", "connote_customfield": { "statusRetur": "Kembali ke pengirim", "pks_no": null, "expired_pks": null, "minimumweight": null, "COD": "NON-COD", "member_id": null, "member_email": null, "booking": null, "tariff_prefix": null, "konsolidator": null, "Jenis_Barang": "Dokumen", "account_pgm": null, "id_oranger": null, "surcharge_code_jasindo": null, "customer_discount": null, "idpel_umkm": null, "fee_beacod": null, "free_beacod_value": 0, "tariff_before_discount": 7000, "total_bruto": null, "total_potongan": null, "point": 0, "diskon": 0, "voucher": 0, "published_subservices": null,
"discountPelangganPKH": null, "id_pelanggan_korporat": null, "cn23": null, "NONPPN": null, "cod_value": 0, "fee_value": null, "total_cod": 0, "lumpsum_connote_amount": null, "rekening_no": null, "npwp_number": null, "tariff_field": null, "ref_no": null, "instruksi_pengiriman": null, "metode_pembayaran": "invoice", "source": "webhook", "discount_from_formula": 0, "history_tracking": { "coordinate": "-7.2918552, 112.7679105", "last_unbag": "2024-11-26 05:10:43", "last_inlocation": "2024-11-25 22:04:19"
},"destination_reg": "7", "destination_kprk": "60000", "destination_nopen": "60000", "destination_reg_new": "5", "final_swp": "2", "final_swp_date_new": "2024-11-27T18:42:16+0700", "sla_unixtime": 1732726799, "MOT": "SEKUNDER, TERSIER MALAM", "cod_collected": false, "timeArrived": "2024-11-26T11:14:23+0700", "timePredictionArrived": "2024-11-27T18:42:16+0700", "destination_location": "DC SUKOLILO 6090C", "timeLate": "-16.53", "is_over_sla": 0, "sla_duration": 16, "sla_duration_minutes": 992,
"C_is_Late": 0, "C_Delivery": "DC SUKOLILO 6090C", "diterimaPenerima": false, "usernameDeliveredBy": "560004210", "deliverySuccessTime": "2024-11-26T11:14:23+0700", "first_attempt_time": "2024-11-26T11:14:23+0700", "taskIdDelivery": "13bc991eb02e167de41e"
},"current_location": { "name": "DC SUKOLILO 6090C", "code": "DCSKL", "location_type": "DC", "type": "cod", "bag": null, "full_name": "Satriya Jaya Tetuko", "username": null, "last_updated": "2024-11-26 05:10:44"
},"connote_history": [
{"_id": "674462997974192859043b63", "content": "Accepted at Post Office | Paket diterima di Cabang KOTA SURABAYA", "content2": "Connote telah dibuat oleh M Alwin Aprilian (550049942) di lokasi KC SURABAYASELATAN60300", "state": "PENDING", "action": "CREATE", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.9655509, 112.6703012", "date": "2024-11-25 18:42:17", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "current_95cd36e9b211606015a851ab4564122c", "photo": null, "signature": null, "ref_id": null, "city": "KOTA SURABAYA", "updated_at": "2024-11-25 18:42:17",
"created_at": "2024-11-25 18:42:17", "username": "M Alwin Aprilian", "location_name": "KC SURABAYASELATAN 60300", "connote_state": "PENDING", "connote_code": "P2411250181724"
},{"_id": "674477249466a265037af55e", "content": "On Shipping | Paket diproses di Cabang KOTA SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses bagging dengan nomor bag
PID60558244 oleh Moch Nurul Yakin (985396490) di KCU SURABAYA 60000", "state": "inBag", "action": "Bagging", "code": "P2411250181724", "connote_id": "inBag", "coordinate": null, "date": "2024-11-25 20:09:50", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "ab4e408f1ff187ae21ce15fbbf34cdc8", "photo": null, "signature": null, "ref_id": null, "city": "KOTA SURABAYA", "updated_at": "2024-11-25 20:09:56", "created_at": "2024-11-25 20:09:50", "username": "985396490", "location_name": "KCU SURABAYA 60000", "connote_state": "inBag", "connote_code": "P2411250181724"
},{"_id": "6744859e8288ff705f3c78bd", "content": "On Shipping | Paket keluar dari Cabang KOTA SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses ManifestR7 oleh Moch Nurul Yakindi
KCU SURABAYA 60000 dengan tujuan SPP SURABAYA 60400 dan nomor R7 P20241125205934104 21:11", "state": "INVEHICLE", "action": "INVEHICLE",
"code": "P2411250181724", "connote_id": null, "coordinate": "-7.3288543,112.7443872", "date": "2024-11-25 21:11:10", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "9f1cef385d4b4c640d39231d8b03ec86", "photo": null, "signature": null, "ref_id": null, "city": "KOTA SURABAYA", "updated_at": "2024-11-25 21:11:42", "created_at": "2024-11-25 21:11:10", "username": "985396490", "location_name": "KCU SURABAYA 60000", "connote_state": "INVEHICLE", "connote_code": "P2411250181724"
},{"_id": "67449229508d9e02851215f3", "content": "On Shipping | Paket tiba di Hub SURABAYA", "content2": "Bag PID60558244 telah melewati proses Receiving oleh Robby Rachmawan di SPP
SURABAYA 60400 22:05", "state": "INLOCATION", "action": "INLOCATION", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.3817674,112.7569913", "date": "2024-11-25 22:04:19", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "d20d163d15af88049111e62e19c3d8d0", "photo": null, "signature": "https://apistorage.mile.app/v2- public/prod/pos/2024/11/25/signature.signatureProofImage.604000022.fd7648682c6653262992.1732547055220.jpg", "ref_id": "fd7648682c6653262992", "city": "SURABAYA", "updated_at": "2024-11-25 22:05:13",
"created_at": "2024-11-25 22:04:19", "username": "604000022", "location_name": "SPP SURABAYA 60400", "connote_state": "INLOCATION", "connote_code": "P2411250181724"
},{"_id": "674493aa8dfcab1fda4926c1", "content": "On Shipping | Paket diproses di Hub SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses Unbagging dari bag PID60558244olehBayu Dwi Krisnandi (988461432) di SPP SURABAYA 60400", "state": "unBag", "action": "Unbagging", "code": "P2411250181724", "connote_id": null, "coordinate": null, "date": "2024-11-25 22:11:36", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "e0f19256d56afb3e7a5598a716b5d73f", "photo": null, "signature": null, "ref_id": null, "city": "SURABAYA", "updated_at": "2024-11-25 22:11:38", "created_at": "2024-11-25 22:11:36", "username": null, "location_name": "SPP SURABAYA 60400", "connote_state": "unBag", "connote_code": "P2411250181724"
},{"_id": "6744a503ac26e75ca0181fe3", "content": "On Shipping | Paket diproses di Hub SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses bagging dengan nomor bag
PID60571275 oleh Mujiono (972338214) di SPP SURABAYA 60400", "state": "inBag", "action": "Bagging",
"code": "P2411250181724", "connote_id": "inBag", "coordinate": "-7.3824472,112.7568578", "date": "2024-11-25 23:25:35", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "39476faf4acbbe72367dcfa12b6b8a9d", "photo": null, "signature": null, "ref_id": null, "city": "SURABAYA", "updated_at": "2024-11-25 23:25:39", "created_at": "2024-11-25 23:25:35", "username": "972338214", "location_name": "SPP SURABAYA 60400", "connote_state": "inBag", "connote_code": "P2411250181724"
},{"_id": "6744d8d4005c105d977f5ee5", "content": "On Shipping | Paket keluar dari Hub SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses ManifestR7 oleh Rahmad Rahadi
Wijaya , Se di SPP SURABAYA 60400 dengan tujuan DC SUKOLILO 6090C dan nomor R7 P2024112522034512103:06", "state": "INVEHICLE", "action": "INVEHICLE", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.3823638,112.7568521", "date": "2024-11-26 03:06:26", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "50384755a9ab7613dd25ecabfc8e38b5", "photo": null, "signature": null, "ref_id": null, "city": "SURABAYA", "updated_at": "2024-11-26 03:06:44", "created_at": "2024-11-26 03:06:26",
"username": "970313226", "location_name": "SPP SURABAYA 60400", "connote_state": "INVEHICLE", "connote_code": "P2411250181724"
},{"_id": "6744f5e5c8b95f01eb707375", "content": "On Shipping | Paket diproses di Pool DC SUKOLILO 6090C", "content2": "Barang anda P2411250181724 telah melewati proses Unbagging dari bag PID60571275olehRizal Putra Pratama (990462080) di DC SUKOLILO 6090C", "state": "unBag", "action": "Unbagging", "code": "P2411250181724", "connote_id": null, "coordinate": null, "date": "2024-11-26 05:10:43", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "d3ff49dca6bc12a25bcbfb94f6bf6adc", "photo": null, "signature": null, "ref_id": null, "city": null, "updated_at": "2024-11-26 05:10:45", "created_at": "2024-11-26 05:10:43", "username": null, "location_name": "DC SUKOLILO 6090C", "connote_state": "unBag", "connote_code": "P2411250181724"
},{"_id": "674538c1a48f0a28a453eb40", "content": "On Delivery | Satriya Jaya Tetuko sudah ditugaskan dan paket siap diantar", "content2": "Barang P2411250181724 anda telah melewati proses DeliveryRunsheet oleh Satriya JayaTetuko di DC SUKOLILO 6090C dan diterima oleh Satriya Jaya Tetuko (560004210)", "state": "DELIVERYRUNSHEET", "action": "DELIVERYRUNSHEET", "code": "P2411250181724",
"connote_id": null, "coordinate": "-7.2424005,112.7371661", "date": "2024-11-26 09:55:52", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "4e82f6e6f9d57f439538077c39f1bc01", "photo": null, "signature": null, "ref_id": null, "city": null, "updated_at": "2024-11-26 09:56:01", "created_at": "2024-11-26 09:55:52", "username": "560004210", "location_name": "DC SUKOLILO 6090C", "connote_state": "DELIVERYRUNSHEET", "connote_code": "P2411250181724"
},{"_id": "67454b2ad45b073bf13838ad", "content": "Delivered | Paket telah diterima oleh ( Sulis ) - ( DITERIMA ORANG SERUMAH )", "content2": "Barang anda P2411250181724 selesai dikirim oleh Satriya Jaya Tetuko (560004210) danditerima oleh Sulis (DITERIMA ORANG SERUMAH)", "state": "DELIVERED", "action": "DELIVERED", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.2918552,112.7679105", "date": "2024-11-26 11:14:23", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "32330fbd6a5cd8f9006ad5dee95e8071", "photo": "https://apistorage.mile.app/v2- public/prod/pos/2024/11/26/camera.photoDeliveryProcessImage.560004210.13bc991eb02e167de41e.1732594447024.jpg", "signature": null, "ref_id": "13bc991eb02e167de41e", "city": null, "receiver": "Sulis", "reason_delivery": "DITERIMA ORANG SERUMAH",
"reason_delivery_code": "S03", "updated_at": "2024-11-26 11:14:34", "created_at": "2024-11-26 11:14:23", "username": "560004210", "location_name": "DC SUKOLILO 6090C", "connote_state": "DELIVERED", "connote_code": "P2411250181724", "additional_photo": null
}
],"transaction_payment_type_name": "Invoice", "location_data_created": { "display_name": "KC SURABAYASELATAN 60300", "description": "KC SURABAYASELATAN 60300", "location_type": "KPRK", "location_code": "60000", "timezone": "asia/jakarta", "is_default": 0, "custom_field": "{\"nokprk\":\"60300\",\"nopen\":\"60300\",\"regional\":\"5\",\"city\":\"KOTASURABAYA\"}", "attributes": "{\"pickup_location_id\":\"60013ed08689533b7410e1d2\",\"zone_code\":\"60000\",\"KDKONSOLIDATOR\":\"80000\",\"zone_code_international\":\"ID\",\"zone_code_lpu\":\"60300\"}", "organization_id": 30, "status": 1, "amount_balance": 0, "updated_at": "2024-07-31 14:58:21", "created_at": "2021-01-15 14:05:52", "lat": -7.9655509, "created_by": "", "virtual_account": "00008439", "zip_code": "", "location_id": "60013ed08689533b7410e1d2", "location_name": "KC SURABAYASELATAN 60300", "location_address": "KPRK SURABAYASELATAN 60300", "location_phone": "+62823232323", "location_code_mile": "SBS-1",
"location_pickup_id": "60013ed08689533b7410e1d2", "lon": 112.6703012, "total_user": 170, "is_enable_wallet": 0
},"koli": [
{"koli_id": "18db0bf5-0e32-1989-17f7-185f17f90f15", "koli_weight": 0.1, "koli_height": 1, "koli_length": 1, "koli_width": 1, "koli_formula_id": null, "koli_description": "DOKUMEN", "koli_code": "P2411250181724", "connote_id": "0bf60d89-1856-0d0b-0c3d-19a40bd60cc1", "created_at": "2024-11-25 18:42:16", "updated_at": "2024-11-26 11:14:27", "koli_volume": 0.001, "koli_chargeable_weight": 1, "koli_custom_field": "{\"isBag\":\"1\",\"koli_state\":\"DELIVERED\"}", "awb_url": "https://apiexposworker.mile.app/label/P2411250181724", "koli_currentLocation": null, "koli_state": null, "transaction_id": null, "koli_customfield": { "isBag": "1", "koli_state": "DELIVERED"
},"koli_surcharge": []
}
]
}
Format Respon Tracking Connote
{ "connote_id": "0bf60d89-1856-0d0b-0c3d-19a40bd60cc1", "connote_number": 1, "connote_sender_name": "PLT ITS", "connote_sender_phone": "081229282266", "connote_sender_email": "burb@its.ac.id", "connote_sender_address": "Biro Umum dan Reformasi Birokrasi ITS Kampus ITS Sukolilo", "connote_sender_zipcode": "", "connote_receiver_name": "JASON OSBORN TATIMU", "connote_receiver_phone": "081232300595", "connote_receiver_email": "jasonotatimu@gmail.com", "connote_receiver_address": "Manyar Kartika Timur 1 9A", "connote_receiver_address_detail": "KOTA SURABAYA , SUKOLILO, MENUR PUMPUNGAN", "connote_receiver_zipcode": "60118", "connote_service": "PKH", "connote_service_price": 7000, "connote_amount": 7000, "connote_code": "P2411250181724", "connote_booking_code": "ITS241125150004", "connote_order": 181724, "connote_state": "DELIVERED", "connote_state_id": 2, "zone_code_from": "60000", "zone_code_to": "60000", "surcharge_amount": null, "custom_field": "{\"statusRetur\":\"Kembali ke
pengirim\",\"pks_no\":null,\"expired_pks\":null,\"minimumweight\":null,\"COD\":\"NON- COD\",\"member_id\":null,\"member_email\":null,\"booking\":null,\"tariff_prefix\":null,\"konsolidator\":null,\"Jenis_Barang\":\"Dokumen\",\"account_pgm\":null,\"id_oranger\":null,\"surcharge_code_jasindo\":null,\"customer_discount\":null,\"idpel_umkm\":null,\"fee_beacod\":null,\"free_beacod_value\":0,\"tariff_before_discount\":7000,\"total_bruto\":null,\"total_potongan\":null,\"point\":0,\"diskon\":0,\"voucher\":0,\"published_subservices\":null,\"discountPelangganPKH\":null,\"id_pelanggan_korporat\":null,\"cn23\":null,\"NONPPN\":null,\"cod_value\":0,\"fee_value\":null,\"total_cod\":0,\"lumpsum_connote_amount\":null,\"rekening_no\":null,\"npwp_number\":
null,\"tariff_field\":null,\"ref_no\":null,\"instruksi_pengiriman\":null,\"metode_pembayaran\":\"invoice\",\"source\":\"webhook\",\"discount_from_formula\":0,\"history_tracking\":{\"coordinate\":\"-7.2918552,
112.7679105\",\"last_unbag\":\"2024-11-26 05:10:43\",\"last_inlocation\":\"2024-11-25
22:04:19\"},\"destination_reg\":\"7\",\"destination_kprk\":\"60000\",\"destination_nopen\":\"60000\",\"destination_reg_new\":\"5\",\"final_swp\":\"2\",\"final_swp_date_new\":\"2024-11- 27T18:42:16+0700\",\"sla_unixtime\":1732726799,\"MOT\":\"SEKUNDER, TERSIER
MALAM\",\"cod_collected\":false,\"timeArrived\":\"2024-11- 26T11:14:23+0700\",\"timePredictionArrived\":\"2024-11-27T18:42:16+0700\",\"destination_location\":\"DCSUKOLILO 6090C\",\"timeLate\":\"- 16.53\",\"is_over_sla\":0,\"sla_duration\":16,\"sla_duration_minutes\":992,\"C_is_Late\":0,\"C_Delivery\":\"DCSUKOLILO
6090C\",\"diterimaPenerima\":false,\"usernameDeliveredBy\":\"560004210\",\"deliverySuccessTime\":\"2024- 11-26T11:14:23+0700\",\"first_attempt_time\":\"2024-11- 26T11:14:23+0700\",\"taskIdDelivery\":\"13bc991eb02e167de41e\"}", "transaction_id": "t-18560e4e-18dd-0d05-19a6-193f19e61813", "actual_weight": 0.1, "volume_weight": 0, "chargeable_weight": 1, "created_by": "213047", "created_at": "2024-11-25 18:42:16", "updated_at": "2024-11-26 11:14:33", "organization_id": 30, "location_id": "60013ed08689533b7410e1d2", "currentLocation": "{\"name\":\"DC SUKOLILO
6090C\",\"code\":\"DCSKL\",\"location_type\":\"DC\",\"type\":\"cod\",\"bag\":null,\"full_name\":\"SatriyaJayaTetuko\",\"username\":null,\"last_updated\":\"2024-11-26 05:10:44\"}", "connote_total_package": "1", "connote_surcharge_amount": "0", "connote_sla_day": "2", "location_name": "KC SURABAYASELATAN 60300", "location_type": "KPRK", "source_tariff_db": "tariffs", "id_source_tariff": "103906550", "pod": { "photo": "https://apistorage.mile.app/v2- public/prod/pos/2024/11/26/camera.photoDeliveryProcessImage.560004210.13bc991eb02e167de41e.1732594447024.jpg", "signature": "https://apistorage.mile.app/v2- public/prod/pos/2024/11/26/signature.signatureDeliveryProcessImage.560004210.13bc991eb02e167de41e.1732
594459815.jpg", "timeReceive": "2024-11-26T11:14:23+0700", "receiver": "Sulis (DITERIMA ORANG SERUMAH)", "coordinate": "-7.2918552,112.7679105"
},"is_locked": 1, "tariff_formula_data": "[{\"key\":\"base_tariff\",\"value\":7000}]", "formula_name": "POS EXPRESS dan POS KILAT KHUSUS", "create_from": "New View", "zone_destination_data": [
{"zone_name": "60000", "zone_code": "60000", "zone_type_code": "tariff", "cache": true
},{"zone_name": "7", "zone_code": "Regional7", "zone_type_code": "destination_reg"
},{"zone_name": "60000", "zone_code": "KPRK_60000", "zone_type_code": "KPRK"
},{"zone_name": "60000", "zone_code": "KPRK_DEST_60000", "zone_type_code": "destination_kprk"
},{"zone_name": "60000", "zone_code": "NOPEN_DEST_60000", "zone_type_code": "destination_nopen"
},{
"zone_name": "SB-SL", "zone_code": "swaSB-SL", "zone_type_code": "singkatan_Wilayah_Antar"
},{"zone_name": "SPP SB", "zone_code": "shSPP SB", "zone_type_code": "Singkatan_Hub"
},{"zone_name": "60000", "zone_code": "60000", "zone_type_code": "LPU"
},{"zone_name": "France", "zone_code": "FR", "zone_type_code": "outgoing"
},{"zone_name": "United State", "zone_code": "US", "zone_type_code": "outgoing"
}
],"bags": "[]", "connote_sender_custom_field": "[]", "connote_sla_date": "2024-11-27 18:42:16", "total_discount": 0, "connote_code_": "P2411250181724", "connote_customfield": { "statusRetur": "Kembali ke pengirim", "pks_no": null, "expired_pks": null, "minimumweight": null, "COD": "NON-COD", "member_id": null,
"member_email": null, "booking": null, "tariff_prefix": null, "konsolidator": null, "Jenis_Barang": "Dokumen", "account_pgm": null, "id_oranger": null, "surcharge_code_jasindo": null, "customer_discount": null, "idpel_umkm": null, "fee_beacod": null, "free_beacod_value": 0, "tariff_before_discount": 7000, "total_bruto": null, "total_potongan": null, "point": 0, "diskon": 0, "voucher": 0, "published_subservices": null, "discountPelangganPKH": null, "id_pelanggan_korporat": null, "cn23": null, "NONPPN": null, "cod_value": 0, "fee_value": null, "total_cod": 0, "lumpsum_connote_amount": null, "rekening_no": null, "npwp_number": null, "tariff_field": null, "ref_no": null, "instruksi_pengiriman": null, "metode_pembayaran": "invoice", "source": "webhook", "discount_from_formula": 0, "history_tracking": { "coordinate": "-7.2918552, 112.7679105",
"last_unbag": "2024-11-26 05:10:43", "last_inlocation": "2024-11-25 22:04:19"
},"destination_reg": "7", "destination_kprk": "60000", "destination_nopen": "60000", "destination_reg_new": "5", "final_swp": "2", "final_swp_date_new": "2024-11-27T18:42:16+0700", "sla_unixtime": 1732726799, "MOT": "SEKUNDER, TERSIER MALAM", "cod_collected": false, "timeArrived": "2024-11-26T11:14:23+0700", "timePredictionArrived": "2024-11-27T18:42:16+0700", "destination_location": "DC SUKOLILO 6090C", "timeLate": "-16.53", "is_over_sla": 0, "sla_duration": 16, "sla_duration_minutes": 992, "C_is_Late": 0, "C_Delivery": "DC SUKOLILO 6090C", "diterimaPenerima": false, "usernameDeliveredBy": "560004210", "deliverySuccessTime": "2024-11-26T11:14:23+0700", "first_attempt_time": "2024-11-26T11:14:23+0700", "taskIdDelivery": "13bc991eb02e167de41e"
},"current_location": { "name": "DC SUKOLILO 6090C", "code": "DCSKL", "location_type": "DC", "type": "cod", "bag": null, "full_name": "Satriya Jaya Tetuko", "username": null, "last_updated": "2024-11-26 05:10:44"
},
"connote_history": [
{"_id": "674462997974192859043b63", "content": "Accepted at Post Office | Paket diterima di Cabang KOTA SURABAYA", "content2": "Connote telah dibuat oleh M Alwin Aprilian (550049942) di lokasi KC SURABAYASELATAN60300", "state": "PENDING", "action": "CREATE", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.9655509, 112.6703012", "date": "2024-11-25 18:42:17", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "current_95cd36e9b211606015a851ab4564122c", "photo": null, "signature": null, "ref_id": null, "city": "KOTA SURABAYA", "updated_at": "2024-11-25 18:42:17", "created_at": "2024-11-25 18:42:17", "username": "M Alwin Aprilian", "location_name": "KC SURABAYASELATAN 60300", "connote_state": "PENDING", "connote_code": "P2411250181724"
},{"_id": "674477249466a265037af55e", "content": "On Shipping | Paket diproses di Cabang KOTA SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses bagging dengan nomor bag
PID60558244 oleh Moch Nurul Yakin (985396490) di KCU SURABAYA 60000", "state": "inBag", "action": "Bagging", "code": "P2411250181724", "connote_id": "inBag", "coordinate": null, "date": "2024-11-25 20:09:50", "organization_id": "5f9fae9b5fbe9d6e401ad0c5",
"unique_id": "ab4e408f1ff187ae21ce15fbbf34cdc8", "photo": null, "signature": null, "ref_id": null, "city": "KOTA SURABAYA", "updated_at": "2024-11-25 20:09:56", "created_at": "2024-11-25 20:09:50", "username": "985396490", "location_name": "KCU SURABAYA 60000", "connote_state": "inBag", "connote_code": "P2411250181724"
},{"_id": "6744859e8288ff705f3c78bd", "content": "On Shipping | Paket keluar dari Cabang KOTA SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses ManifestR7 oleh Moch Nurul Yakindi
KCU SURABAYA 60000 dengan tujuan SPP SURABAYA 60400 dan nomor R7 P20241125205934104 21:11", "state": "INVEHICLE", "action": "INVEHICLE", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.3288543,112.7443872", "date": "2024-11-25 21:11:10", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "9f1cef385d4b4c640d39231d8b03ec86", "photo": null, "signature": null, "ref_id": null, "city": "KOTA SURABAYA", "updated_at": "2024-11-25 21:11:42", "created_at": "2024-11-25 21:11:10", "username": "985396490", "location_name": "KCU SURABAYA 60000", "connote_state": "INVEHICLE", "connote_code": "P2411250181724"
},{
"_id": "67449229508d9e02851215f3", "content": "On Shipping | Paket tiba di Hub SURABAYA", "content2": "Bag PID60558244 telah melewati proses Receiving oleh Robby Rachmawan di SPP
SURABAYA 60400 22:05", "state": "INLOCATION", "action": "INLOCATION", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.3817674,112.7569913", "date": "2024-11-25 22:04:19", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "d20d163d15af88049111e62e19c3d8d0", "photo": null, "signature": "https://apistorage.mile.app/v2- public/prod/pos/2024/11/25/signature.signatureProofImage.604000022.fd7648682c6653262992.1732547055220.jpg", "ref_id": "fd7648682c6653262992", "city": "SURABAYA", "updated_at": "2024-11-25 22:05:13", "created_at": "2024-11-25 22:04:19", "username": "604000022", "location_name": "SPP SURABAYA 60400", "connote_state": "INLOCATION", "connote_code": "P2411250181724"
},{"_id": "674493aa8dfcab1fda4926c1", "content": "On Shipping | Paket diproses di Hub SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses Unbagging dari bag PID60558244olehBayu Dwi Krisnandi (988461432) di SPP SURABAYA 60400", "state": "unBag", "action": "Unbagging", "code": "P2411250181724", "connote_id": null, "coordinate": null, "date": "2024-11-25 22:11:36", "organization_id": "5f9fae9b5fbe9d6e401ad0c5",
"unique_id": "e0f19256d56afb3e7a5598a716b5d73f", "photo": null, "signature": null, "ref_id": null, "city": "SURABAYA", "updated_at": "2024-11-25 22:11:38", "created_at": "2024-11-25 22:11:36", "username": null, "location_name": "SPP SURABAYA 60400", "connote_state": "unBag", "connote_code": "P2411250181724"
},{"_id": "6744a503ac26e75ca0181fe3", "content": "On Shipping | Paket diproses di Hub SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses bagging dengan nomor bag
PID60571275 oleh Mujiono (972338214) di SPP SURABAYA 60400", "state": "inBag", "action": "Bagging", "code": "P2411250181724", "connote_id": "inBag", "coordinate": "-7.3824472,112.7568578", "date": "2024-11-25 23:25:35", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "39476faf4acbbe72367dcfa12b6b8a9d", "photo": null, "signature": null, "ref_id": null, "city": "SURABAYA", "updated_at": "2024-11-25 23:25:39", "created_at": "2024-11-25 23:25:35", "username": "972338214", "location_name": "SPP SURABAYA 60400", "connote_state": "inBag", "connote_code": "P2411250181724"
},{
"_id": "6744d8d4005c105d977f5ee5", "content": "On Shipping | Paket keluar dari Hub SURABAYA", "content2": "Barang anda P2411250181724 telah melewati proses ManifestR7 oleh Rahmad Rahadi
Wijaya , Se di SPP SURABAYA 60400 dengan tujuan DC SUKOLILO 6090C dan nomor R7 P2024112522034512103:06", "state": "INVEHICLE", "action": "INVEHICLE", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.3823638,112.7568521", "date": "2024-11-26 03:06:26", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "50384755a9ab7613dd25ecabfc8e38b5", "photo": null, "signature": null, "ref_id": null, "city": "SURABAYA", "updated_at": "2024-11-26 03:06:44", "created_at": "2024-11-26 03:06:26", "username": "970313226", "location_name": "SPP SURABAYA 60400", "connote_state": "INVEHICLE", "connote_code": "P2411250181724"
},{"_id": "6744f5e5c8b95f01eb707375", "content": "On Shipping | Paket diproses di Pool DC SUKOLILO 6090C", "content2": "Barang anda P2411250181724 telah melewati proses Unbagging dari bag PID60571275olehRizal Putra Pratama (990462080) di DC SUKOLILO 6090C", "state": "unBag", "action": "Unbagging", "code": "P2411250181724", "connote_id": null, "coordinate": null, "date": "2024-11-26 05:10:43", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "d3ff49dca6bc12a25bcbfb94f6bf6adc",
"photo": null, "signature": null, "ref_id": null, "city": null, "updated_at": "2024-11-26 05:10:45", "created_at": "2024-11-26 05:10:43", "username": null, "location_name": "DC SUKOLILO 6090C", "connote_state": "unBag", "connote_code": "P2411250181724"
},{"_id": "674538c1a48f0a28a453eb40", "content": "On Delivery | Satriya Jaya Tetuko sudah ditugaskan dan paket siap diantar", "content2": "Barang P2411250181724 anda telah melewati proses DeliveryRunsheet oleh Satriya JayaTetuko di DC SUKOLILO 6090C dan diterima oleh Satriya Jaya Tetuko (560004210)", "state": "DELIVERYRUNSHEET", "action": "DELIVERYRUNSHEET", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.2424005,112.7371661", "date": "2024-11-26 09:55:52", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "4e82f6e6f9d57f439538077c39f1bc01", "photo": null, "signature": null, "ref_id": null, "city": null, "updated_at": "2024-11-26 09:56:01", "created_at": "2024-11-26 09:55:52", "username": "560004210", "location_name": "DC SUKOLILO 6090C", "connote_state": "DELIVERYRUNSHEET", "connote_code": "P2411250181724"
},{"_id": "67454b2ad45b073bf13838ad",
"content": "Delivered | Paket telah diterima oleh ( Sulis ) - ( DITERIMA ORANG SERUMAH )", "content2": "Barang anda P2411250181724 selesai dikirim oleh Satriya Jaya Tetuko (560004210) danditerima oleh Sulis (DITERIMA ORANG SERUMAH)", "state": "DELIVERED", "action": "DELIVERED", "code": "P2411250181724", "connote_id": null, "coordinate": "-7.2918552,112.7679105", "date": "2024-11-26 11:14:23", "organization_id": "5f9fae9b5fbe9d6e401ad0c5", "unique_id": "32330fbd6a5cd8f9006ad5dee95e8071", "photo": "https://apistorage.mile.app/v2- public/prod/pos/2024/11/26/camera.photoDeliveryProcessImage.560004210.13bc991eb02e167de41e.1732594447024.jpg", "signature": null, "ref_id": "13bc991eb02e167de41e", "city": null, "receiver": "Sulis", "reason_delivery": "DITERIMA ORANG SERUMAH", "reason_delivery_code": "S03", "updated_at": "2024-11-26 11:14:34", "created_at": "2024-11-26 11:14:23", "username": "560004210", "location_name": "DC SUKOLILO 6090C", "connote_state": "DELIVERED", "connote_code": "P2411250181724", "additional_photo": null
}
],"transaction_payment_type_name": "Invoice", "location_data_created": { "display_name": "KC SURABAYASELATAN 60300", "description": "KC SURABAYASELATAN 60300", "location_type": "KPRK", "location_code": "60000", "timezone": "asia/jakarta", "is_default": 0,
"custom_field": "{\"nokprk\":\"60300\",\"nopen\":\"60300\",\"regional\":\"5\",\"city\":\"KOTASURABAYA\"}", "attributes": "{\"pickup_location_id\":\"60013ed08689533b7410e1d2\",\"zone_code\":\"60000\",\"KDKONSOLIDATOR\":\"80000\",\"zone_code_international\":\"ID\",\"zone_code_lpu\":\"60300\"}", "organization_id": 30, "status": 1, "amount_balance": 0, "updated_at": "2024-07-31 14:58:21", "created_at": "2021-01-15 14:05:52", "lat": -7.9655509, "created_by": "", "virtual_account": "00008439", "zip_code": "", "location_id": "60013ed08689533b7410e1d2", "location_name": "KC SURABAYASELATAN 60300", "location_address": "KPRK SURABAYASELATAN 60300", "location_phone": "+62823232323", "location_code_mile": "SBS-1", "location_pickup_id": "60013ed08689533b7410e1d2", "lon": 112.6703012, "total_user": 170, "is_enable_wallet": 0
},"koli": [
{"koli_id": "18db0bf5-0e32-1989-17f7-185f17f90f15", "koli_weight": 0.1, "koli_height": 1, "koli_length": 1, "koli_width": 1, "koli_formula_id": null, "koli_description": "DOKUMEN", "koli_code": "P2411250181724", "connote_id": "0bf60d89-1856-0d0b-0c3d-19a40bd60cc1", "created_at": "2024-11-25 18:42:16", "updated_at": "2024-11-26 11:14:27",
"koli_volume": 0.001, "koli_chargeable_weight": 1, "koli_custom_field": "{\"isBag\":\"1\",\"koli_state\":\"DELIVERED\"}", "awb_url": "https://apiexposworker.mile.app/label/P2411250181724", "koli_currentLocation": null, "koli_state": null, "transaction_id": null, "koli_customfield": { "isBag": "1", "koli_state": "DELIVERED"
},"koli_surcharge": []
}
]
}
PENJELASAN PARAMETER TRACKING
Ref Status Tracking
Action Status Keterangan
CREATE PAID Pembuatan resi
PICKED PICKED Proses pickup package
INLOCATION INLOCATION Proses inbound di lokasi
BAGGING inBag Proses bagging
INVEHICLE INVEHICLE Proses pengantaran dari hub ke hubUNBAGGING unBag Proses mengeluarkan package dari bagDELIVERYRUNSHEET DELIVERYRUNSHEET Proses assign kurir
ONPROCESS ONPROCESS Proses antaran yang masih belummendapatkan status akhir (sukses/gagal)
IRREGULARITY irregularity Proses irregularities (status tidak biasa)
DELIVERED DELIVERED Proses delivery selesai
FAILEDTODELIVERED FAILEDTOBEDELIVERED Proses gagal antar
CANCEL CANCELED Proses cancel resi
RETURN DELIVERED - RETURN
DELIVERY
Proses retur package
Service Code
Nama Service Connote_Service
Pos Nextday (EXPRESS NEXT DAY) PE
Pos Sameday Q9
Pos Reguler (PAKET KILAT KHUSUS) PKH
Field Keterangan
CONNOTE_DETAIL
CONNOTE_ID Kode Unik connote
CONNOTE_NUMBER No urut connote dalamtransaksi
CONNOTE_SENDER_NAME Nama Pengirim
CONNOTE_SENDER_PHONE No Telepon Pengirim
CONNOTE_SENDER_EMAIL E-mail Pengirim
CONNOTE_SENDER_ADDRESS Alamat Pengirim
CONNOTE_SENDER_ZIPCODE Kodepos Pengirim
CONNOTE_RECEIVER_NAME Nama Penerima
CONNOTE_RECEIVER_PHONE No telepon Penerima
CONNOTE_RECEIVER_EMAIL E-mail Penerima
CONNOTE_RECEIVER_ADDRESS Alamat Penerima
CONNOTE_RECEIVER_ADDRESS_DETAIL Alamat detail penerima
CONNOTE_RECEIVER_ZIPCODE Kode pos penerima
CONNOTE_SERVICE Service (ref tabel add 2 service code)
CONNOTE_SERVICE_PRICE Nilai ongkos kirim (tarif dasar kiriman) includePajak
CONNOTE_AMOUNT Total harga kiriman termasuk premi asuransi
include pajak
CONNOTE_CODE Nomor resi
CONNOTE_BOOKING_CODE Nomor booking connote
CONNOTE_ORDER
CONNOTE_STATE Status terakhir connote (add 1 ref Status
Connote)
CONNOTE_STATE_ID ID status connote
ZONE_CODE_FROM Kode zona asal
ZONE_CODE_TO Kode zona tujuan
SURCHARGE_AMOUNT Nilai asuransi
CUSTOM_FIELD
TRANSACTION_ID ID unik transaksi
ACTUAL_WEIGHT Berat aktual connote
VOLUME_WEIGHT Volume aktual connote
CHARGEABLE_WEIGHT Berat yang dikenakan tarif
CREATED_BY Userid yang membuat connote
CREATED_AT Tanggal dibuatnya connote
UPDATED_AT Tanggal perubahan connote
ORGANIZATION_ID
LOCATION_ID Kode unik lokasi/kantor pembuatanconnoteCURRENTLOCATION Data-data yang menjelaskan posisi
connote saat di inquiry (akan updateapabila terjadi perubahan proses). Datanyaterdiri dari:
1. Name, nama user yang memprosesconnote
2. Code, kode lokasi terakhir, umumnya diisi dengan location_id/ username / nama vehicle
3. Type, adalah tipe COD/NON-COD4. Full_name, nama lengkap user yangmemproses connote
5. Username, username yang
memproses connote
6. Vehicle, nama kendaraan
7. Vehicle_ID, ID Kendaraan
8. Location_Type, tipe lokasi (KPRK, KPC, AGENPOS, dll)
9. Next_Location, Kode tujuanlokasi
selanjutnya
10. Next_Location_Name, nama
tujuan lokasi selanjutnya
11. Origin_Location, kode lokasi asal
12. Origin_Location_Name, namalokasi
asal
13. Bag, nomor kantung
14. Last_Updated, Tanggal updateconnote terakhir
CONNOTE_TOTAL_PACKAGE Total connote dalam satu transaksi
CONNOTE_SURCHARGE_AMOUNT Nilai asuransi
CONNOTE_SLA_DAY SLA connote
LOCATION_NAME Nama lokasi dibuatnya connote
LOCATION_TYPE Tipe lokasi dibuatnya connote
SOURCE_TARIFF_DB Table diambilnya tarif (tarif publishatauPelanggan)
ID_SOURCE_TARIFF ID tariff
POD Link detail data connote untuk Proof of
Delivery:
1. Photo
2. Signature (tanda tangan)
3. TimeReceive (Tanggal diterimapenerima)
4. Receiver (nama penerima)
5. Coordinate (latitude dan
longitude proses delivery)
IS_LOCKED
TARIFF_FORMULA_DATA Formula perhitungan tarif
FORMULA_NAME Nama formula
CREATE_FROM Asal connote dibuat (API atau NewView(Web))
ZONE_DESTINATION_DATA Tipe zona tujuan:
1. Zone_type_code, nama tipezona2. Zone_code, kode zona
3. Zone_name, nama zona
CONNOTE_CODE Nomor resi
CONNOTE_CUSTOMFIELD Keterangan
LUMPSUM_CONNOTE_AMOUNT Total harga kiriman termasuk premi asuransi includepajak (jika layanan lumpsum)
COD Keterangan untuk COD / CCOD/ Non-CODCOD_VALUE Nilai COD
FEE_VALUE Nilai fee COD
TOTAL_COD Total nilai COD (COD + Fee)
MINIMUMEWIGHT Berat minimum (apabila dibutuhkan untuk tarif
formula)
JENIS_BARANG Jenis barang : Dokumen / Paket
REF_NO Nomor Referensi
INSTRUKSI_PENGIRIMAN Instruksi pengiriman
IDUSERSAP ID User untuk kebutuhan SAP
NOPEN Nopen kantor dibuatnya connote
REGIONAL Regional kantor dibuatnya connote
LOCATION_ID Kode Unik Lokasi kantor dibuatnya connoteLOCATION_NAME Nama lokasi kantor dibuatnya connote
VIRTUAL_ACCOUNT Virtual account untuk pembayaran CODTIMEPREDICTIONARRIVED Estimasi sampai ke tujuan (dihitung
berdasarkan SLA)
DESTINATION_LOCATION Lokasi kantor tujuan
TIMELATE Jam telat delivery (dihitung berdasarkan SLA)
IS_OVER_SLA Boolean menunjukan over SLA atau tidak
SLA_DURATION Durasi telat (dalam jam)
SLA_DURATION_MINUTES Durasi telat (dalam menit)
CONNOTE_HISTORY History connote (detailnya sudah dijelaskandi atas)
KOLI
KOLI_ID Kode unik nomor koli
KOLI_WEIGHT Berat koli
KOLI_HEIGHT Tinggi koli
KOLI_LENGTH Panjang koli
KOLI_WIDTH Lebar koli
KOLI_FORMULA_ID Formula perhitungan koli
KOLI_DESCRIPTION Deskripsi koli
KOLI_CODE Nomor koli
CONNOTE_ID Kode unik connote untuk koli tersebut
CREATED_AT Waktu dibuatnya koli
UPDATED_AT Waktu dibuatnya koli
KOLI_VOLUME Volume koli
KOLI_CHARGEABLE_WEIGHT Berat koli yang dikenakan tagihan
AWB_URL URL untuk print label resi
KOLI_STATE Status koli
TRANSACTION_ID Kode unik transaksi untuk koli atas connotetersebutKOLI_CUSTOMFIELD Custom field atas koli. 1. Harga_barang, nilai barang
KOLI_SURCHARGE_AMOUNT Nilai asuransi koli
KOLI_SURCHARGE Objek data surcharge. 1. Transaction_surcharge_id, kode uniktransaksi surcharge
2. Surcharge_id, id surcharge
3. Surcharge_name, nama surcharge (asuransi)4. Surcharge_amount, nilai surcharge5. Surcharge_code, kode surcharge (INS)
6. Koli_id, kode unik koli
7. Connotes_id, kode unik connote