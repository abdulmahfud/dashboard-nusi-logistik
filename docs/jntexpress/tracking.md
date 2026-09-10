Response Examples

Success

{
   "awb":"JD1234567890",
   "orderid":"ASD1234567890",
   "detail":{
      "shipped_date":"2021-09-07 15:34:45",
      "services_code":"EZ",
      "services_type":"",
      "actual_amount":50000,
      "weight":2000,
      "qty":1,
      "itemname":"Kacamata Hitam",
      "detail_cost":{
         "shipping_cost":50000,
         "add_cost":0,
         "insurance_cost":0,
         "cod":2250,
         "return_cost":0
      },
      "sender":{
         "name":"Pengirim",
         "addr":"DKI JAKARTA, JAKARTA, Jalan Raya Pengirim",
         "zipcode":"14310",
         "city":"JAKARTA",
         "geoloc":""
      },
      "receiver":{
         "name":"Penerima",
         "addr":"JAWA BARAT, BEKASI, Jalan Raya Penerima, RT 001, RW 003, Jatiasih",
         "zipcode":"17422",
         "city":"BEKASI",
         "geoloc":""
      },
      "driver":{
         "id":"",
         "name":"Budi",
         "phone":"",
         "photo":""
      },
      "delivDriver":{
         "id":"",
         "name":"Astuti",
         "phone":"+6281234567890",
         "photo":""
      }
   },
   "history":[
      {
         "date_time":"2021-09-07 15:29:37",
         "city_name":"JAKARTA",
         "status":"Manifes",
         "status_code":101,
         "storeName":"",
         "nextSiteName":"KALIDERES",
         "note":"",
         "receiver":"",
         "driverName":"",
         "driverPhone":"",
         "presenter":"",
         "agentName":"",
         "presentername":""
      },
      {
         "date_time":"2021-09-07 15:34:45",
         "city_name":"JAKARTA",
         "status":"Paket telah diterima oleh KALIDERES",
         "status_code":100,
         "storeName":"KALIDERES",
         "nextSiteName":"KALIDERES",
         "note":"",
         "receiver":"",
         "driverName":"Reykalideres",
         "driverPhone":"+6287782000705",
         "presenter":"TRUE",
         "agentName":"",
         "presentername":""
      },
      {
         "date_time":"2021-09-07 15:42:30",
         "city_name":"JAKARTA",
         "status":"Paket akan dikirimkan ke JKT_GATEWAY",
         "status_code":100,
         "storeName":"KALIDERES",
         "nextSiteName":"JKT_GATEWAY",
         "note":"",
         "receiver":"",
         "driverName":"",
         "driverPhone":"",
         "presenter":"TRUE",
         "agentName":"",
         "presentername":""
      },
      {
         "date_time":"2021-09-09 17:44:31",
         "city_name":"JAKARTA",
         "status":"Paket akan dikirim ke alamat penerima",
         "status_code":100,
         "storeName":"KALIDERES",
         "nextSiteName":"KALIDERES",
         "note":"",
         "receiver":"",
         "driverName":"Astuti",
         "driverPhone":"+6281234567890",
         "presenter":"TRUE",
         "agentName":"",
         "presentername":""
      },
      {
         "date_time":"2021-09-09 17:47:36",
         "city_name":"JAKARTA",
         "status":"Paket telah diterima",
         "status_code":200,
         "storeName":"KALIDERES",
         "nextSiteName":"KALIDERES",
         "note":"",
         "receiver":"Penerima",
         "driverName":"Astuti",
         "driverPhone":"",
         "presenter":"TRUE",
         "agentName":"",
         "presentername":""
      }
   ]
}
Failed

{
     "error_id":"404",
     "error_message":"Invalid AWB number"
}