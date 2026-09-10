API Tracking
Halaman ini menjelaskan API Tracking STT yang digunakan untuk memantau perjalanan pengiriman secara real-time menggunakan Shipment ID atau nomor STT.

Deskripsi
API STT / Shipment Tracking digunakan untuk memonitor seluruh proses pengiriman paket secara real-time. Dengan mengirimkan Shipment ID, nomor STT, atau external reference, sistem akan menampilkan seluruh riwayat pergerakan paket mulai dari status awal, proses transit, hingga paket diterima oleh pelanggan.

API ini memberikan visibilitas penuh terhadap status pengiriman, sehingga client dapat melakukan monitoring operasional dengan lebih akurat serta memberikan pengalaman tracking yang lebih baik kepada end-user.

Endpoint 
GET

https://api-stg-middleware.thelionparcel.com/v3/stt/track?q=q

URL

[BASE_URL]/v3/stt/track?q={stt_no/no_ref_external/shipment_id}

Header
Name
Value
Content-Type

application/json

Authorization

Basic bGlvbnBhcmNlbDpsaW9ucGFyY2VsQDEyMw==

Request Parameters
Parameter
Data Type
Description
q

String

STT or external number.

Example: 99LP1723518405831 or "ref_external" or C1ABCDEF.

Response Body
Cari
stt_no

STRING

YES

88LP1653305849148

STT number

sender_name

STRING

YES

Patrick

Sender name

recipient_name

STRING

YES

Spongebob

Recipient name

origin

STRING

YES

KEDOYA SELATAN, KEBON JERUK, JAKARTA BARAT, JAKARTA

Origin route

destination

STRING

YES

RAWAMANGUN, JAKARTA TIMUR, JAKARTA

Destination route

current_status

STRING

YES

POD

Last status

chargeable_weight

STRING

YES

1

Chargeable weight

history

ARRAY OF OBJECT

YES

 

History of STT

[history] structure

Cari
Field
Data Type
Is Required
Sample Value
Description
row

INT

YES

1

Number of history

datetime

STRING

YES

2022-05-23T18:37:28+07:00

Date and time when status updated

status_code

STRING

YES

BKD

Status code

curent_status

STRING

YES

BKD

Status code

location

STRING

YES

CGK

City code when status updated

city

STRING

YES

JAKARTA

City name of when status updated

remarks

STRING

YES

PAKET TELAH DIBOOKING OLEH POS LION EXPRESS OWN SALES KEDOYA DI SISTEM LION PARCEL.

Status remarks

attachment

STRING

NO

https://storage.googleapis.com/algo-staging/shipment/2axxxx

Attachment photo

updated_by

STRING

YES

POS.TESTING.QA

Username who did update

updated_on

STRING

YES

2022-05-23T18:37:28+07:00

Date and time when stt updated

stt_journey_type


STRING

NO


return


Jenis perjalanan STT (return, cancel, reroute, dll.)

ref_stt_number

STRING

NO

88LP1739861960665

Nomor STT referensi (biasanya STT sebelumnya / terkait)

shipment_id

STRING

YES

C1OIZPBA

ID shipment internal Lion Parcel

total_tariff

NUMBER

YES

12500

Total tarif pengiriman (setelah adjustment/return)

reason

STRING


NO


""


Alasan tambahan terkait status

problem_reason_code

STRING

NO

""

Kode alasan masalah (jika ada kendala)

chargeable_weight

NUMBER

YES


1

Berat yang digunakan untuk perhitungan tarif (kg)

total_gross_weight

NUMBER

YES


0.5

 Berat aktual barang (kg)

total_volume_weight

NUMBER

YES


0.1

Berat volumetrik barang

is_insurance

BOOLEAN

YES

false

Menandakan apakah shipment menggunakan asuransi (true/false)

insurance_rate

NUMBER

NO

0

Nilai premi asuransi

pieces

INT

YES

1

Jumlah koli / paket

proof

ARRAY OF OBJECT

NO

{}

Bukti pendukung status (POD, signature, dll.)

request_gross_weight_g

NUMBER

NO

500

Total berat kotor pengiriman dalam satuan gram (g) sesuai data yang dikirim pada saat request.

request_gross_weight_kg

NUMBER

NO

0,5

Total berat kotor pengiriman dalam satuan kilogram (kg) berdasarkan data yang dikirim pada request.

request_volume_weight

NUMBER

NO

0,1

Berat volumetrik pengiriman yang dihitung berdasarkan dimensi paket (panjang × lebar × tinggi).

[proof] structure

attachment_signed

ARRAY

NO

{}

File tanda tangan penerima

latitude


NUMBER


NO

0

Koordinat latitude (jika tersedia)

longitude


NUMBER


NO


0


Koordinat longitude (jika tersedia)

relation

STRING

NO

""

Hubungan penerima dengan pemilik paket

name

STRING

NO

""

Nama penerima / penandatangan


Response
{
    "stts": [
        {
            "stt_no": "88LP1776343215269",
            "sender_name": "Lions",
            "recipient_name": "Lio Receiver",
            "origin": "KEBON JERUK, JAKARTA BARAT",
            "destination": "KEBON JERUK, JAKARTA BARAT",
            "current_status": "POD",
            "status_code": "POD",
            "chargeable_weight": 3,
            "shipment_id": "C2PHAYJI",
            "product_type": "REGPACK",
            "pieces": 1,
            "pieces_details": [
                {
                    "piece_gross_weight": 3,
                    "piece_height": 10,
                    "piece_length": 10,
                    "piece_volume_weight": 0.333333,
                    "piece_width": 20
                }
            ],
            "volume_weight": 0.34,
            "gross_weight": 3,
            "chargeable_total_tariff": 22050,
            "chargeable_total_tariff_exc_cod_fee": 21950,
            "history": [
                {
                    "row": 1,
                    "datetime": "2026-04-16T19:37:07+07:00",
                    "status_code": "SHPCRT",
                    "current_status": "SHPCRT",
                    "location": "",
                    "city": "",
                    "remarks": "PENGIRIMANMU TELAH DIBUAT",
                    "attachment": [],
                    "updated_by": "PEGASUS",
                    "updated_on": "2026-04-16T19:37:07+07:00",
                    "stt_journey_type": "",
                    "ref_stt_number": "",
                    "shipment_id": "C2PHAYJI",
                    "total_tariff": 0,
                    "total_tariff_before_cod_fee": 0,
                    "reason": "",
                    "problem_reason_code": "",
                    "chargeable_weight": 3,
                    "pieces": 1,
                    "proof": {
                        "attachment_signed": [],
                        "latitude": 0,
                        "longitude": 0,
                        "relation": "",
                        "name": ""
                    },
                    "root_stt_number": "88LP1776343215269",
                    "request_gross_weight_g": 1000,
                    "request_gross_weight_kg": 1,
                    "request_volume_weight": 0.33
                },
                {
                    "row": 2,
                    "datetime": "2026-04-16T19:40:14+07:00",
                    "status_code": "BKD",
                    "current_status": "BKD",
                    "location": "CGK",
                    "city": "JAKARTA",
                    "remarks": "PAKETMU TELAH DIPROSES OLEH AGEN LION PARCEL JAKARTA, KEDOYA SELATAN, KEBON JERUK, JAKARTA BARAT",
                    "attachment": [],
                    "updated_by": "DEBI.POSCGK",
                    "updated_on": "2026-04-16T19:40:14+07:00",
                    "stt_journey_type": "",
                    "ref_stt_number": "",
                    "shipment_id": "C2PHAYJI",
                    "total_tariff": 8050,
                    "total_tariff_before_cod_fee": 7950,
                    "reason": "",
                    "problem_reason_code": "",
                    "chargeable_weight": 3,
                    "total_gross_weight": 3,
                    "total_volume_weight": 0.34,
                    "is_insurance": true,
                    "insurance_rate": 950,
                    "config_insurance_type": "Flat",
                    "config_insurance_value": 950,
                    "pieces": 1,
                    "proof": {
                        "attachment_signed": [],
                        "latitude": 0,
                        "longitude": 0,
                        "relation": "",
                        "name": ""
                    },
                    "root_stt_number": "88LP1776343215269",
                    "request_gross_weight_g": 1000,
                    "request_gross_weight_kg": 1,
                    "request_volume_weight": 0.33
                },
                {
                    "row": 3,
                    "datetime": "2026-04-16T20:10:52+07:00",
                    "status_code": "STT ADJUSTED",
                    "current_status": "STT ADJUSTED",
                    "location": "CGK",
                    "city": "JAKARTA",
                    "remarks": "TERJADI PENYESUAIAN HARGA TERKAIT BERAT & VOLUME PAKETMU",
                    "attachment": [
                        "https://stg-genesis.s3.ap-southeast-1.amazonaws.com/image/stt/WhatsApp%20Image%202026-01-21%20at%202017690022481776345043.jpeg",
                        "https://stg-genesis.s3.ap-southeast-1.amazonaws.com/image/stt/WhatsApp%20Image%202026-01-21%20at%202017690022481776345046.jpeg"
                    ],
                    "updated_by": "DEBI.POSCGK",
                    "updated_on": "2026-04-16T20:10:52+07:00",
                    "stt_journey_type": "",
                    "ref_stt_number": "",
                    "shipment_id": "C2PHAYJI",
                    "total_tariff": 22050,
                    "total_tariff_before_cod_fee": 21950,
                    "reason": "",
                    "problem_reason_code": "",
                    "chargeable_weight": 3,
                    "total_gross_weight": 3,
                    "total_volume_weight": 0.34,
                    "is_insurance": true,
                    "insurance_rate": 950,
                    "config_insurance_type": "Flat",
                    "config_insurance_value": 950,
                    "pieces": 1,
                    "proof": {
                        "attachment_signed": [],
                        "latitude": 0,
                        "longitude": 0,
                        "relation": "",
                        "name": ""
                    },
                    "root_stt_number": "88LP1776343215269",
                    "request_gross_weight_g": 1000,
                    "request_gross_weight_kg": 1,
                    "request_volume_weight": 0.33
                },
                {
                    "row": 4,
                    "datetime": "2026-04-16T20:13:43+07:00",
                    "status_code": "STI",
                    "current_status": "STI",
                    "location": "CGK",
                    "city": "JAKARTA",
                    "remarks": "PAKETMU SAMPAI DI GUDANG LION PARCEL JAKARTA, KEBON JERUK, JAKARTA BARAT",
                    "attachment": [],
                    "updated_by": "DEBI.CONSCGK",
                    "updated_on": "2026-04-16T20:13:43+07:00",
                    "stt_journey_type": "",
                    "ref_stt_number": "",
                    "shipment_id": "C2PHAYJI",
                    "total_tariff": 0,
                    "total_tariff_before_cod_fee": 21950,
                    "reason": "",
                    "problem_reason_code": "",
                    "chargeable_weight": 3,
                    "pieces": 1,
                    "proof": {
                        "attachment_signed": [],
                        "latitude": 0,
                        "longitude": 0,
                        "relation": "",
                        "name": ""
                    },
                    "root_stt_number": "88LP1776343215269"
                },
                {
                    "row": 5,
                    "datetime": "2026-04-16T20:13:43+07:00",
                    "status_code": "STI-DEST",
                    "current_status": "STI-DEST",
                    "location": "CGK",
                    "city": "JAKARTA",
                    "remarks": "PAKETMU SAMPAI DI GUDANG LION PARCEL JAKARTA, KEBON JERUK, JAKARTA BARAT",
                    "attachment": [],
                    "updated_by": "DEBI.CONSCGK",
                    "updated_on": "2026-04-16T20:13:43+07:00",
                    "stt_journey_type": "",
                    "ref_stt_number": "",
                    "shipment_id": "C2PHAYJI",
                    "total_tariff": 0,
                    "total_tariff_before_cod_fee": 21950,
                    "reason": "",
                    "problem_reason_code": "",
                    "chargeable_weight": 3,
                    "pieces": 1,
                    "proof": {
                        "attachment_signed": [],
                        "latitude": 0,
                        "longitude": 0,
                        "relation": "",
                        "name": ""
                    },
                    "root_stt_number": "88LP1776343215269"
                },
                {
                    "row": 6,
                    "datetime": "2026-04-16T20:13:59+07:00",
                    "status_code": "KONDISPATCH",
                    "current_status": "KONDISPATCH",
                    "location": "CGK",
                    "city": "JAKARTA",
                    "remarks": "PAKETMU TELAH DITUGASKAN KE KURIR DAN SIAP DIANTAR.",
                    "attachment": [],
                    "updated_by": "DEBI.CONSCGK",
                    "updated_on": "2026-04-16T20:13:59+07:00",
                    "stt_journey_type": "",
                    "ref_stt_number": "",
                    "shipment_id": "C2PHAYJI",
                    "total_tariff": 0,
                    "total_tariff_before_cod_fee": 21950,
                    "reason": "",
                    "problem_reason_code": "",
                    "chargeable_weight": 3,
                    "pieces": 1,
                    "proof": {
                        "attachment_signed": [],
                        "latitude": 0,
                        "longitude": 0,
                        "relation": "",
                        "name": ""
                    },
                    "root_stt_number": "88LP1776343215269"
                },
                {
                    "row": 7,
                    "datetime": "2026-04-16T20:45:32+07:00",
                    "status_code": "DEL",
                    "current_status": "DEL",
                    "location": "CGK",
                    "city": "JAKARTA",
                    "remarks": "PAKETMU DIANTAR KE ALAMAT PENERIMA OLEH KURIR JAMOST. PASTIKAN NOMOR PENERIMA DAPAT DIHUBUNGI OLEH KURIR",
                    "attachment": [],
                    "updated_by": "ALGO-SYSTEM",
                    "updated_on": "2026-04-16T20:45:32+07:00",
                    "stt_journey_type": "",
                    "ref_stt_number": "",
                    "shipment_id": "C2PHAYJI",
                    "total_tariff": 0,
                    "total_tariff_before_cod_fee": 21950,
                    "courier_name": "Jamost",
                    "reason": "",
                    "problem_reason_code": "",
                    "chargeable_weight": 3,
                    "pieces": 1,
                    "proof": {
                        "attachment_signed": [],
                        "latitude": 0,
                        "longitude": 0,
                        "relation": "",
                        "name": ""
                    },
                    "root_stt_number": "88LP1776343215269"
                },
                {
                    "row": 8,
                    "datetime": "2026-04-16T20:46:08+07:00",
                    "status_code": "POD",
                    "current_status": "POD",
                    "location": "CGK",
                    "city": "JAKARTA",
                    "remarks": "PAKETMU TELAH SAMPAI DI TUJUAN & DITERIMA OLEH  DEBI TESTING (YBS)",
                    "attachment": [
                        "https://algo-staging.s3.ap-southeast-1.amazonaws.com/shipment/d4b653e421cf7730000481fe9f2836a1-1776347168"
                    ],
                    "updated_by": "ALGO-SYSTEM",
                    "updated_on": "2026-04-16T20:46:08+07:00",
                    "stt_journey_type": "",
                    "ref_stt_number": "",
                    "shipment_id": "C2PHAYJI",
                    "total_tariff": 22050,
                    "total_tariff_before_cod_fee": 21950,
                    "courier_name": "Jamost",
                    "reason": "",
                    "received_by": "Debi Testing (YBS)",
                    "problem_reason_code": "",
                    "chargeable_weight": 3,
                    "total_gross_weight": 3,
                    "total_volume_weight": 0.34,
                    "is_insurance": true,
                    "insurance_rate": 950,
                    "pieces": 1,
                    "proof": {
                        "attachment_signed": [],
                        "latitude": 0,
                        "longitude": 0,
                        "relation": "",
                        "name": "Debi Testing (YBS)"
                    },
                    "root_stt_number": "88LP1776343215269"
                }
            ],
            "root_stt_number": "88LP1776343215269",
            "request_gross_weight_g": 1000,
            "request_gross_weight_kg": 1,
            "request_volume_weight": 0.33
        }
    ]
}

Tariff Definition
total_tariff
Parameter total_tariff merepresentasikan total biaya pengiriman yang telah mencakup seluruh komponen tarif dan surcharge yang berlaku pada satu perjalanan (journey) pengiriman.

Parameter ini tidak memperhitungkan biaya tambahan yang mungkin muncul akibat perubahan rute pengiriman (reroute), return, atau journey lanjutan lainnya.

chargeable_total_tariff
Parameter chargeable_total_tariff merepresentasikan total biaya pengiriman yang dapat ditagihkan (chargeable amount).

Parameter ini mencakup seluruh komponen tarif dan surcharge, termasuk akumulasi biaya dari journey lanjutan yang terjadi setelah shipment dibuat, seperti:

Reroute

Return

Return Reroute

Return HQ

Journey tambahan lainnya yang menimbulkan perubahan biaya pengiriman

Apabila terjadi perubahan rute atau perjalanan tambahan yang memengaruhi biaya pengiriman, maka nilai chargeable_total_tariff dapat berbeda dengan total_tariff.

POD Status Definition
Pada API Tracking dan Webhook, status POD (Proof of Delivery) dapat memiliki beberapa variasi berdasarkan nilai stt_journey_type.

1. Standard Delivery

Tanya

Salin
{
  "status_code": "POD",
  "stt_journey_type": ""
}
Definisi:

Shipment telah berhasil diterima oleh penerima sesuai alamat tujuan awal.

2. Reroute Delivery

Tanya

Salin
{
  "status_code": "POD",
  "stt_journey_type": "reroute"
}
Definisi:

Shipment telah berhasil diterima oleh penerima akan tetapi dengan catatan alamat baru pada destinasi.

3. Return Delivery

Tanya

Salin
{
  "status_code": "POD",
  "stt_journey_type": "return"
}
Definisi:

Shipment telah berhasil dikembalikan dan diterima oleh pengirim awal.

4. Return Reroute Delivery

Tanya

Salin
{
  "status_code": "POD",
  "stt_journey_type": "return-reroute"
}
Definisi:

Shipment telah berhasil dikembalikan kepada pengirim, namun menggunakan alamat pengirim hasil perubahan (reroute return address).

5. Cancel Delivery

Tanya

Salin
{
  "status_code": "POD",
  "stt_journey_type": "cancel"
}
Definisi:

Shipment telah selesai diproses dalam skenario pembatalan dan berhasil diterima kembali oleh pengirim. Secara konsep, proses ini memiliki perilaku yang serupa dengan return shipment.

6. Return HQ Delivery

Tanya

Salin
{
  "status_code": "POD",
  "stt_journey_type": "returnhq"
}
Definisi:

Shipment telah berhasil diterima dan diselesaikan di gudang atau hub Lion Parcel yang ditentukan sebagai tujuan akhir proses return.