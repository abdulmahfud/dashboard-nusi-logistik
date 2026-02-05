[2026-02-05 12:54:31] local.INFO: ExpeditionRateLimitMiddleware: Request received {"url":"http://127.0.0.1:8000/api/admin/expedition/jntexpress/shipment_cost","method":"POST","vendor":"jntexpress","path":"api/admin/expedition/jntexpress/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:31] local.INFO: Expedition shipmentCost method called {"vendor":"jntexpress","vendor_original":"jntexpress","method":"POST","url":"http://127.0.0.1:8000/api/admin/expedition/jntexpress/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:31] local.ERROR: JntExpress API Configuration Missing {"base_url":"Set","api_username":"Set","api_key":"Set","api_password":"Missing"} 
[2026-02-05 12:54:31] local.INFO: Expedition shipmentCost request {"vendor":"jntexpress","request_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:31] local.INFO: JNT location mapping successful (new format) {"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","regency_id":224,"district_id":3746,"sendSiteCode":"JOMBANG","destAreaCode":"KEBOMAS"} 
[2026-02-05 12:54:31] local.INFO: JntExpress getShipmentCost URL and payload {"url":"https://partner-track.jet.co.id/jandt_track/inquiry.action","payload":{"data":"{\"weight\":\"1.5\",\"sendSiteCode\":\"JOMBANG\",\"destAreaCode\":\"KEBOMAS\",\"cusName\":\"BHISAKIRIM\",\"productType\":\"EZ\"}","sign":"ZjNjYzkwN2UwZTNkZDE1NWU3MDExNmNmYTQwYjY0NGQ="},"json_data":"{\"weight\":\"1.5\",\"sendSiteCode\":\"JOMBANG\",\"destAreaCode\":\"KEBOMAS\",\"cusName\":\"BHISAKIRIM\",\"productType\":\"EZ\"}","signature":"ZjNjYzkwN2UwZTNkZDE1NWU3MDExNmNmYTQwYjY0NGQ=","request_data":{"weight":"1.5","sendSiteCode":"JOMBANG","destAreaCode":"KEBOMAS","cusName":"BHISAKIRIM","productType":"EZ"},"mapping_info":{"sendSiteCode":"JOMBANG","destAreaCode":"KEBOMAS","weight":1.5}} 
[2026-02-05 12:54:32] local.INFO: JntExpress getShipmentCost response {"awb_request":{"weight":"1.5","sendSiteCode":"JOMBANG","destAreaCode":"KEBOMAS","cusName":"BHISAKIRIM","productType":"EZ"},"response":{"content":"[{\"cost\":\"22000\",\"name\":\"EZ\",\"productType\":\"EZ\"}]","is_success":"true","message":""},"http_status":200} 
[2026-02-05 12:54:32] local.INFO: DiscountService: Calculating discount {"vendor":"JNTEXPRESS","shipping_cost":22000.0,"service_type":"EZ","user_type":null,"user_id":null} 
[2026-02-05 12:54:32] local.INFO: DiscountService: Best discount result {"discount_found":false,"discount_id":null,"discount_type":null,"discount_value":null} 
[2026-02-05 12:54:32] local.INFO: JntExpress getShipmentCost final result {"shipping_costs_count":1,"shipping_costs":[{"cost":"22000","name":"EZ","productType":"EZ","original_cost":22000.0,"discount_info":{"has_discount":false,"discount_applied":false,"discount_amount":0,"discounted_price":22000.0,"final_cost":22000.0,"original_price":22000.0,"discount_percentage":null,"discount_id":null,"discount_description":null,"discount_type":null,"discount_value":null},"final_cost":22000.0}]} 
[2026-02-05 12:54:32] local.INFO: Expedition shipmentCost response {"vendor":"jntexpress","result_status":"success","result_message":"Shipment cost retrieved successfully"} 
[2026-02-05 12:54:32] local.INFO: ExpeditionRateLimitMiddleware: Request received {"url":"http://127.0.0.1:8000/api/admin/expedition/paxel/shipment_cost","method":"POST","vendor":"paxel","path":"api/admin/expedition/paxel/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:32] local.INFO: Expedition shipmentCost method called {"vendor":"paxel","vendor_original":"paxel","method":"POST","url":"http://127.0.0.1:8000/api/admin/expedition/paxel/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:32] local.INFO: Expedition shipmentCost request {"vendor":"paxel","request_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:32] local.INFO: Paxel location mapping successful (new format) {"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","origin":{"province":"JAWA TIMUR","city":"JOMBANG","district":"PETERONGAN","address":"Alamat tidak tersedia"},"destination":{"province":"JAWA TIMUR","city":"GRESIK","district":"KEBOMAS","address":"Alamat tidak tersedia"}} 
[2026-02-05 12:54:33] local.INFO: Paxel getShipmentCost response {"request_payload":{"origin":{"province":"JAWA TIMUR","city":"JOMBANG","district":"PETERONGAN","address":"Alamat tidak tersedia"},"destination":{"province":"JAWA TIMUR","city":"GRESIK","district":"KEBOMAS","address":"Alamat tidak tersedia"},"weight":1,"dimension":"20x15x10","service_type":"SAMEDAY"},"status_code":200,"body":"{
  \"status_code\": 200,
  \"message\": \"OK\",
  \"data\": {
    \"response_code\": 0,
    \"service_name\": \"\",
    \"city_origin\": \"JOMBANG\",
    \"city_destination\": \"GRESIK\",
    \"small_price\": 16000,
    \"medium_price\": 30000,
    \"large_price\": 43000,
    \"custom_price\": 43000,
    \"time_detail\": [
      {
        \"time_pickup_start\": \"08:00:00\",
        \"time_pickup_end\": \"10:00:00\",
        \"time_delivery_start\": \"10:00:00\",
        \"time_delivery_end\": \"14:00:00\",
        \"service\": \"next_day\",
        \"available_day\": {
          \"day_details\": [
            {
              \"name\": \"Friday\",
              \"nearest_date\": \"2026-02-06\"
            },
            {
              \"name\": \"Saturday\",
              \"nearest_date\": \"2026-02-07\"
            },
            {
              \"name\": \"Monday\",
              \"nearest_date\": \"2026-02-09\"
            },
            {
              \"name\": \"Tuesday\",
              \"nearest_date\": \"2026-02-10\"
            },
            {
              \"name\": \"Wednesday\",
              \"nearest_date\": \"2026-02-11\"
            },
            {
              \"name\": \"Thursday\",
              \"nearest_date\": \"2026-02-12\"
            },
            {
              \"name\": \"Friday\",
              \"nearest_date\": \"2026-02-13\"
            }
          ],
          \"unavailable_day_details\": [
            {
              \"name\": \"Sunday\",
              \"nearest_date\": \"2026-02-08\"
            },
            {
              \"name\": \"Sunday\",
              \"nearest_date\": \"2026-02-15\"
            }
          ],
          \"unavailable_days\": [
            \"Sunday\"
          ]
        }
      },
      {
        \"time_pickup_start\": \"10:00:00\",
        \"time_pickup_end\": \"12:00:00\",
        \"time_delivery_start\": \"10:00:00\",
        \"time_delivery_end\": \"14:00:00\",
        \"service\": \"next_day\",
        \"available_day\": {
          \"day_details\": [
            {
              \"name\": \"Friday\",
              \"nearest_date\": \"2026-02-06\"
            },
            {
              \"name\": \"Saturday\",
              \"nearest_date\": \"2026-02-07\"
            },
            {
              \"name\": \"Monday\",
              \"nearest_date\": \"2026-02-09\"
            },
            {
              \"name\": \"Tuesday\",
              \"nearest_date\": \"2026-02-10\"
            },
            {
              \"name\": \"Wednesday\",
              \"nearest_date\": \"2026-02-11\"
            },
            {
              \"name\": \"Thursday\",
              \"nearest_date\": \"2026-02-12\"
            },
            {
              \"name\": \"Friday\",
              \"nearest_date\": \"2026-02-13\"
            }
          ],
          \"unavailable_day_details\": [
            {
              \"name\": \"Sunday\",
              \"nearest_date\": \"2026-02-08\"
            },
            {
              \"name\": \"Sunday\",
              \"nearest_date\": \"2026-02-15\"
            }
          ],
          \"unavailable_days\": [
            \"Sunday\"
          ]
        }
      },
      {
        \"time_pickup_start\": \"12:00:00\",
        \"time_pickup_end\": \"14:00:00\",
        \"time_delivery_start\": \"10:00:00\",
        \"time_delivery_end\": \"14:00:00\",
        \"service\": \"next_day\",
        \"available_day\": {
          \"day_details\": [
            {
              \"name\": \"Friday\",
              \"nearest_date\": \"2026-02-06\"
            },
            {
              \"name\": \"Saturday\",
              \"nearest_date\": \"2026-02-07\"
            },
            {
              \"name\": \"Monday\",
              \"nearest_date\": \"2026-02-09\"
            },
            {
              \"name\": \"Tuesday\",
              \"nearest_date\": \"2026-02-10\"
            },
            {
              \"name\": \"Wednesday\",
              \"nearest_date\": \"2026-02-11\"
            },
            {
              \"name\": \"Thursday\",
              \"nearest_date\": \"2026-02-12\"
            },
            {
              \"name\": \"Friday\",
              \"nearest_date\": \"2026-02-13\"
            }
          ],
          \"unavailable_day_details\": [
            {
              \"name\": \"Sunday\",
              \"nearest_date\": \"2026-02-08\"
            },
            {
              \"name\": \"Sunday\",
              \"nearest_date\": \"2026-02-15\"
            }
          ],
          \"unavailable_days\": [
            \"Sunday\"
          ]
        }
      },
      {
        \"time_pickup_start\": \"14:00:00\",
        \"time_pickup_end\": \"16:00:00\",
        \"time_delivery_start\": \"10:00:00\",
        \"time_delivery_end\": \"14:00:00\",
        \"service\": \"next_day\",
        \"available_day\": {
          \"day_details\": [
            {
              \"name\": \"Thursday\",
              \"nearest_date\": \"2026-02-05\"
            },
            {
              \"name\": \"Friday\",
              \"nearest_date\": \"2026-02-06\"
            },
            {
              \"name\": \"Saturday\",
              \"nearest_date\": \"2026-02-07\"
            },
            {
              \"name\": \"Monday\",
              \"nearest_date\": \"2026-02-09\"
            },
            {
              \"name\": \"Tuesday\",
              \"nearest_date\": \"2026-02-10\"
            },
            {
              \"name\": \"Wednesday\",
              \"nearest_date\": \"2026-02-11\"
            },
            {
              \"name\": \"Thursday\",
              \"nearest_date\": \"2026-02-12\"
            }
          ],
          \"unavailable_day_details\": [
            {
              \"name\": \"Sunday\",
              \"nearest_date\": \"2026-02-08\"
            },
            {
              \"name\": \"Sunday\",
              \"nearest_date\": \"2026-02-15\"
            }
          ],
          \"unavailable_days\": [
            \"Sunday\"
          ]
        }
      }
    ],
    \"fixed_price\": 16000,
    \"fixed_price_type\": \"dimension\",
    \"fixed_short_size\": \"SML\",
    \"fixed_size\": \"small\"
  }
}
"} 
[2026-02-05 12:54:33] local.INFO: Expedition shipmentCost response {"vendor":"paxel","result_status":"success","result_message":"OK"} 
[2026-02-05 12:54:33] local.INFO: ExpeditionRateLimitMiddleware: Request received {"url":"http://127.0.0.1:8000/api/admin/expedition/lion/shipment_cost","method":"POST","vendor":"lion","path":"api/admin/expedition/lion/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:33] local.INFO: Expedition shipmentCost method called {"vendor":"lion","vendor_original":"lion","method":"POST","url":"http://127.0.0.1:8000/api/admin/expedition/lion/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:33] local.INFO: Expedition shipmentCost request {"vendor":"lion","request_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:33] local.INFO: Lion location mapping successful (new format) {"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","origin":"PETERONGAN, JOMBANG","destination":"KEBOMAS, GRESIK"} 
[2026-02-05 12:54:33] local.INFO: Lion getShipmentCost request {"local_method":"POST (from local API)","lion_api_method":"GET (to Lion API)","url":"https://api-stg-middleware.thelionparcel.com/v3/tariff","query_params":{"origin":"PETERONGAN, JOMBANG","destination":"KEBOMAS, GRESIK","weight":1.5,"commodity":"gen"},"full_url":"https://api-stg-middleware.thelionparcel.com/v3/tariff?origin=PETERONGAN%2C+JOMBANG&destination=KEBOMAS%2C+GRESIK&weight=1.5&commodity=gen","auth_headers":{"Authorization":"Basic bGlvbnBhcmNlbDpsaW9ucGFyY2VsQDEyMw==","Accept":"application/json"},"format_info":{"origin_format":"district, city (e.g., KEBON JERUK, JAKARTA BARAT)","destination_format":"district, city (e.g., PETERONGAN, JOMBANG)","weight_unit":"kg (Lion Parcel requirement)","commodity_default":"gen","authentication":"Basic Auth with config from services.php"}} 
[2026-02-05 12:54:34] local.INFO: Lion API response details {"status_code":200,"headers":{"Date":["Thu, 05 Feb 2026 05:54:34 GMT"],"Content-Type":["application/json"],"Content-Length":["870"],"Connection":["keep-alive"],"CF-RAY":["9c9027640c34fd9f-SIN"],"vary":["Origin"],"cf-cache-status":["DYNAMIC"],"Set-Cookie":["__cf_bm=vMUJJGzeDyWFrTj7DpDOKeG.j2VnWPgk0_z9SZKf.TI-1770270874-1.0.1.1-grbtlUC.kLXfgviW0hRbfjgrrlLLejFhvrObPjhei0w77wrlXRWuq2dRdGr4KRlJynU.0EkecAThwMkEyWCcW4PcFy1n3ptY19.A4PbNc4M; path=/; expires=Thu, 05-Feb-26 06:24:34 GMT; domain=.thelionparcel.com; HttpOnly; Secure; SameSite=None"],"expect-ct":["max-age=86400, enforce"],"referrer-policy":["same-origin"],"x-content-type-options":["nosniff"],"x-frame-options":["SAMEORIGIN"],"x-xss-protection":["1; mode=block"],"Server":["cloudflare"]},"body":"{\"origin\":\"PETERONGAN, JOMBANG\",\"destination\":\"KEBOMAS, GRESIK\",\"commodity\":\"gen\",\"weight\":1.5,\"is_cod_area\":true,\"forward_area\":\"KEBOMAS, GRESIK\",\"result\":[{\"row\":1,\"service_type\":\"PACKAGE\",\"product\":\"REGPACK\",\"publish_rate\":9800,\"forward_rate\":5000,\"shipping_surcharge_rate\":4200,\"commodity_surcharge_rate\":0,\"heavy_weight_surcharge_rate\":0,\"insurance_rate\":0,\"wood_packing_rate\":0,\"document_surcharge\":0,\"is_embargo\":false,\"estimasi_sla\":\"2 - 4 Hari\",\"status\":\"ACTIVE\",\"total_tariff\":19000,\"base_rate\":19000},{\"row\":2,\"service_type\":\"PACKAGE\",\"product\":\"JAGOPACK\",\"publish_rate\":9100,\"forward_rate\":5000,\"shipping_surcharge_rate\":3900,\"commodity_surcharge_rate\":0,\"heavy_weight_surcharge_rate\":0,\"insurance_rate\":0,\"wood_packing_rate\":0,\"document_surcharge\":0,\"is_embargo\":false,\"estimasi_sla\":\"2 - 6 Hari\",\"status\":\"ACTIVE\",\"total_tariff\":18000,\"base_rate\":18000}]}
","success":true} 
[2026-02-05 12:54:34] local.INFO: Expedition shipmentCost response {"vendor":"lion","result_status":"success","result_message":null} 
[2026-02-05 12:54:34] local.INFO: ExpeditionRateLimitMiddleware: Request received {"url":"http://127.0.0.1:8000/api/admin/expedition/sap/shipment_cost","method":"POST","vendor":"sap","path":"api/admin/expedition/sap/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:34] local.INFO: Expedition shipmentCost method called {"vendor":"sap","vendor_original":"sap","method":"POST","url":"http://127.0.0.1:8000/api/admin/expedition/sap/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:34] local.INFO: Expedition shipmentCost request {"vendor":"sap","request_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:34] local.INFO: SAP API Request: getShipmentCost {"payload":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:34] local.INFO: SAP location mapping successful - prepared data {"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","origin_regency_id":224,"origin_district_id":3672,"origin_sub_district_id":41080,"destination_regency_id":215,"destination_district_id":3746,"destination_sub_district_id":41503,"origin_code":"JI4417","destination_code":"JI1008","prepared_data":{"origin":"JI4417","destination":"JI1008","weight":1.5,"customer_code":"DEV000","packing_type_code":"ACH02","volumetric":"1x1x1","item_value":100000}} 
[2026-02-05 12:54:34] local.INFO: SAP getShipmentCost - Final request data {"request_data":{"origin":"JI4417","destination":"JI1008","weight":1.5,"customer_code":"DEV000","packing_type_code":"ACH02","volumetric":"1x1x1","item_value":100000},"all_fields_present":{"origin":true,"destination":true,"weight":true,"customer_code":true,"packing_type_code":true,"volumetric":true,"item_value":true}} 
[2026-02-05 12:54:34] local.INFO: SAP getShipmentCost request {"url":"https://apisanbox.coresyssap.com/v2/master/shipment_cost","headers":{"api_key":"DEV_m4rK3tPlac3#_2019","Content-Type":"application/json","Accept":"application/json"},"payload":{"origin":"JI4417","destination":"JI1008","weight":1.5,"customer_code":"DEV000","packing_type_code":"ACH02","volumetric":"1x1x1","item_value":100000}} 
[2026-02-05 12:54:35] local.INFO: SAP getShipmentCost response {"status":404,"successful":false,"body":"{\"status\":\"fail\",\"data\":[],\"msg\":\"Harga tidak ditemukan\"}"} 
[2026-02-05 12:54:35] local.ERROR: Exception in SapService::getShipmentCost {"exception":"Illuminate\\Http\\Client\\RequestException","message":"HTTP request returned status code 404:
{\"status\":\"fail\",\"data\":[],\"msg\":\"Harga tidak ditemukan\"}
","url":"https://apisanbox.coresyssap.com/v2/master/shipment_cost","request_data":{"origin":"JI4417","destination":"JI1008","weight":1.5,"customer_code":"DEV000","packing_type_code":"ACH02","volumetric":"1x1x1","item_value":100000}} 
[2026-02-05 12:54:35] local.ERROR: SAP API Error: getShipmentCost {"message":"HTTP request returned status code 404:
{\"status\":\"fail\",\"data\":[],\"msg\":\"Harga tidak ditemukan\"}
","response":{"status":"fail","data":[],"msg":"Harga tidak ditemukan"},"status":404} 
[2026-02-05 12:54:35] local.INFO: Expedition shipmentCost response {"vendor":"sap","result_status":"error","result_message":"HTTP request returned status code 404:
{\"status\":\"fail\",\"data\":[],\"msg\":\"Harga tidak ditemukan\"}
"} 
[2026-02-05 12:54:35] local.INFO: ExpeditionRateLimitMiddleware: Request received {"url":"http://127.0.0.1:8000/api/admin/expedition/posindonesia/shipment_cost","method":"POST","vendor":"posindonesia","path":"api/admin/expedition/posindonesia/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:35] local.INFO: Expedition shipmentCost method called {"vendor":"posindonesia","vendor_original":"posindonesia","method":"POST","url":"http://127.0.0.1:8000/api/admin/expedition/posindonesia/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:35] local.INFO: Expedition shipmentCost request {"vendor":"posindonesia","request_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:35] local.INFO: PosIndonesia location mapping successful (new format) {"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","shipperZipcode":61485,"receiverZipcode":61124} 
[2026-02-05 12:54:35] local.INFO: PosIndonesia getShipmentCost request {"payload":{"customerid":"DAGBHISAKRM04594A","desttypeid":"1","itemtypeid":"1","shipperzipcode":"61485","receiverzipcode":"61124","weight":1500,"length":0,"width":0,"height":0,"diameter":0,"valuegoods":0},"url":"http://168.231.103.155:45123/pos/utility/1.0.0/getFee","mapped_shipperzipcode":61485,"mapped_receiverzipcode":61124,"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS"} 
[2026-02-05 12:54:35] local.WARNING: POS X-POS-USER not configured - request may fail if required by API  
[2026-02-05 12:54:35] local.WARNING: POS X-POS-PASSWORD not configured - request may fail if required by API  
[2026-02-05 12:54:36] local.INFO: PosIndonesia request successful {"attempt":1} 
[2026-02-05 12:54:36] local.INFO: PosIndonesia getShipmentCost filtered result {"serviceCode":"240","payload":{"customerid":"DAGBHISAKRM04594A","desttypeid":"1","itemtypeid":"1","shipperzipcode":"61485","receiverzipcode":"61124","weight":1500,"length":0,"width":0,"height":0,"diameter":0,"valuegoods":0},"response":{"serviceCode":240,"serviceName":"Pos Reguler","fee":12364,"feeTax":136,"insurance":0,"insuranceTax":0,"totalFee":12500,"notes":"-","estimation":"2 HARI","penyesuaian":0,"penyesuaianpersentase":-1500,"discount":0}} 
[2026-02-05 12:54:36] local.INFO: Expedition shipmentCost response {"vendor":"posindonesia","result_status":"success","result_message":"Shipment cost retrieved successfully"} 
[2026-02-05 12:54:36] local.INFO: ExpeditionRateLimitMiddleware: Request received {"url":"http://127.0.0.1:8000/api/admin/expedition/jne/shipment_cost","method":"POST","vendor":"jne","path":"api/admin/expedition/jne/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:36] local.INFO: Expedition shipmentCost method called {"vendor":"jne","vendor_original":"jne","method":"POST","url":"http://127.0.0.1:8000/api/admin/expedition/jne/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:36] local.INFO: Expedition shipmentCost request {"vendor":"jne","request_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:36] local.INFO: JNE origin mapping successful {"regency_name":"JOMBANG","regency_id":224,"origin_code":"MJK10100"} 
[2026-02-05 12:54:36] local.INFO: JNE destination mapping successful {"district_name":"KEBOMAS","district_id":3746,"destination_code":"SUB10117"} 
[2026-02-05 12:54:36] local.INFO: JNE location mapping successful (new format) {"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","regency_id":224,"district_id":3746,"origin_code":"MJK10100","destination_code":"SUB10117"} 
[2026-02-05 12:54:36] local.INFO: JNE getShipmentCost request {"url":"https://apiv2.jne.co.id:10206/tracing/api/pricedev","payload":{"username":"NUSISERBA","api_key":"354610f6e8767945879307660e629a3e","from":"MJK10100","thru":"SUB10117","weight":1.5},"origin_code":"MJK10100","destination_code":"SUB10117","weight":"1.5"} 
[2026-02-05 12:54:36] local.INFO: JNE getShipmentCost response {"status":200,"body":"{
  \"price\" : [ {
    \"origin_name\" : \"JOMBANG,KAB. JOMBANG\",
    \"destination_name\" : \"KEBOMAS,GRESIK\",
    \"service_display\" : \"JTR\",
    \"service_code\" : \"JTR23\",
    \"goods_type\" : \"Paket\",
    \"currency\" : \"IDR\",
    \"price\" : \"65000\",
    \"etd_from\" : \"6\",
    \"etd_thru\" : \"7\",
    \"times\" : \"D\"
  }, {
    \"origin_name\" : \"JOMBANG,KAB. JOMBANG\",
    \"destination_name\" : \"KEBOMAS,GRESIK\",
    \"service_display\" : \"JTR<130\",
    \"service_code\" : \"JTR<130\",
    \"goods_type\" : \"Paket\",
    \"currency\" : \"IDR\",
    \"price\" : \"500000\",
    \"etd_from\" : \"6\",
    \"etd_thru\" : \"7\",
    \"times\" : null
  }, {
    \"origin_name\" : \"JOMBANG,KAB. JOMBANG\",
    \"destination_name\" : \"KEBOMAS,GRESIK\",
    \"service_display\" : \"JTR>130\",
    \"service_code\" : \"JTR>130\",
    \"goods_type\" : \"Paket\",
    \"currency\" : \"IDR\",
    \"price\" : \"700000\",
    \"etd_from\" : \"6\",
    \"etd_thru\" : \"7\",
    \"times\" : \"D\"
  }, {
    \"origin_name\" : \"JOMBANG,KAB. JOMBANG\",
    \"destination_name\" : \"KEBOMAS,GRESIK\",
    \"service_display\" : \"JTR>200\",
    \"service_code\" : \"JTR>200\",
    \"goods_type\" : \"Paket\",
    \"currency\" : \"IDR\",
    \"price\" : \"900000\",
    \"etd_from\" : \"6\",
    \"etd_thru\" : \"7\",
    \"times\" : null
  }, {
    \"origin_name\" : \"JOMBANG,KAB. JOMBANG\",
    \"destination_name\" : \"KEBOMAS,GRESIK\",
    \"service_display\" : \"REG\",
    \"service_code\" : \"REG23\",
    \"goods_type\" : \"Document/Paket\",
    \"currency\" : \"IDR\",
    \"price\" : \"28000\",
    \"etd_from\" : \"2\",
    \"etd_thru\" : \"3\",
    \"times\" : \"D\"
  } ]
}"} 
[2026-02-05 12:54:36] local.INFO: Expedition shipmentCost response {"vendor":"jne","result_status":"success","result_message":"Shipment cost retrieved successfully (REG23 service)"} 
[2026-02-05 12:54:37] local.INFO: ExpeditionRateLimitMiddleware: Request received {"url":"http://127.0.0.1:8000/api/admin/expedition/idexpress/shipment_cost","method":"POST","vendor":"idexpress","path":"api/admin/expedition/idexpress/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:37] local.INFO: Expedition shipmentCost method called {"vendor":"idexpress","vendor_original":"idexpress","method":"POST","url":"http://127.0.0.1:8000/api/admin/expedition/idexpress/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:37] local.INFO: Expedition shipmentCost request {"vendor":"idexpress","request_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:37] local.INFO: ID Express location mapping successful (new format) {"origin_province":"JAWA TIMUR","origin_regency":"JOMBANG","origin_district":"PETERONGAN","origin_regency_id":224,"sender_city_id":124,"destination_province":"JAWA TIMUR","destination_regency":"GRESIK","destination_district":"KEBOMAS","destination_regency_id":215,"destination_district_id":3746,"recipient_district_id":15663} 
[2026-02-05 12:54:37] local.INFO: ID Express shipping cost request {"url":"https://api-stg.idexpress.tech/open/v2/waybill/get-standard-fee","base_url":"https://api-stg.idexpress.tech","app_id":"2052360424","payload":{"senderCityId":124,"recipientDistrictId":15663,"weight":"1.5","expressType":"00"},"json_data":"{
\"senderCityId\": 124,
\"recipientDistrictId\": 15663,
\"weight\": \"1.5\",
\"expressType\":\"00\"
}","json_data_length":90,"sign":"6d2f86b747562ee41abefb8c6fa52728","sign_formula":"md5(jsonData + appId + secretKey)","original_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:37] local.INFO: ID Express shipping cost response {"attempt":1,"http_status":200,"response_successful":true,"response_failed":false,"response_body_raw":"{\"code\":0,\"desc\":\"\",\"total\":1,\"data\":{\"selected\":{\"expressType\":\"00\",\"publishRate\":23000,\"clientRate\":18400,\"canCOD\":1,\"minSla\":1,\"maxSla\":2}}}
","response_json":{"code":0,"desc":"","total":1,"data":{"selected":{"expressType":"00","publishRate":23000,"clientRate":18400,"canCOD":1,"minSla":1,"maxSla":2}}},"response_headers":{"Date":["Thu, 05 Feb 2026 05:54:37 GMT"],"Content-Type":["application/json"],"Transfer-Encoding":["chunked"],"Connection":["keep-alive"],"vary":["Origin"],"x-envoy-upstream-service-time":["397"],"Server":["cloudflare"],"cf-cache-status":["DYNAMIC"],"Nel":["{\"report_to\":\"cf-nel\",\"success_fraction\":0.0,\"max_age\":604800}"],"Report-To":["{\"group\":\"cf-nel\",\"max_age\":604800,\"endpoints\":[{\"url\":\"https://a.nel.cloudflare.com/report/v4?s=TZOPbQHRBnu3H1NHbt2p%2F9pWwUnD0l%2Be1bzMMBdZR6UtNc2egIlFyi9aT76sa%2BfkaG4SUx0qEYfJbH17xo1re%2Bav7j98pnmcCUEG7vQG7lgEjreSapQ7Xdenjs0XvSWTJTk%3D\"}]}"],"CF-RAY":["9c9027780cd0806f-SIN"],"alt-svc":["h3=\":443\"; ma=86400"],"x-encoded-content-encoding":["gzip"]}} 
[2026-02-05 12:54:37] local.INFO: DiscountService: Calculating discount {"vendor":"IDEXPRESS","shipping_cost":23000.0,"service_type":"REGULER","user_type":null,"user_id":null} 
[2026-02-05 12:54:37] local.INFO: DiscountService: Best discount result {"discount_found":false,"discount_id":null,"discount_type":null,"discount_value":null} 
[2026-02-05 12:54:37] local.INFO: Expedition shipmentCost response {"vendor":"idexpress","result_status":"success","result_message":"Shipping cost retrieved successfully"} 
[2026-02-05 12:54:38] local.INFO: ExpeditionRateLimitMiddleware: Request received {"url":"http://127.0.0.1:8000/api/admin/expedition/anteraja/shipment_cost","method":"POST","vendor":"anteraja","path":"api/admin/expedition/anteraja/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:38] local.INFO: Expedition shipmentCost method called {"vendor":"anteraja","vendor_original":"anteraja","method":"POST","url":"http://127.0.0.1:8000/api/admin/expedition/anteraja/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:38] local.INFO: Expedition shipmentCost request {"vendor":"anteraja","request_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:38] local.INFO: Anteraja origin mapping successful {"district_name":"PETERONGAN","district_id":3672,"anteraja_dist_code":"35.17.10"} 
[2026-02-05 12:54:38] local.INFO: Anteraja destination mapping successful {"district_name":"KEBOMAS","district_id":3746,"anteraja_dist_code":"35.25.14"} 
[2026-02-05 12:54:38] local.INFO: Anteraja getShipmentCost request {"url":"https://doit-sit.anteraja.id/BSKI/serviceRates","method":"POST","payload":{"origin":"35.17.10","destination":"35.25.14","weight":1500},"origin_codes":{"prov_code":"35","prov_name":"Jawa Timur","city_code":"35.17","city_name":"Jombang","dist_code":"35.17.10","dist_name":"Peterongan"},"destination_codes":{"prov_code":"35","prov_name":"Jawa Timur","city_code":"35.25","city_name":"Gresik","dist_code":"35.25.14","dist_name":"Kebomas"}} 
[2026-02-05 12:54:38] local.INFO: Anteraja getShipmentCost response {"status":200,"body":"{\"status\":200,\"info\":\"OK\",\"content\":{\"origin\":\"35.17.10\",\"destination\":\"35.25.14\",\"services\":[{\"product_code\":\"REG\",\"product_name\":\"Anteraja Regular\",\"etd\":\"2 - 4 Day\",\"rates\":16000,\"is_cod\":false,\"surcharges\":null}]}}","url":"https://doit-sit.anteraja.id/BSKI/serviceRates"} 
[2026-02-05 12:54:38] local.INFO: Expedition shipmentCost response {"vendor":"anteraja","result_status":"success","result_message":null} 
[2026-02-05 12:54:38] local.INFO: ExpeditionRateLimitMiddleware: Request received {"url":"http://127.0.0.1:8000/api/admin/expedition/ninja/shipment_cost","method":"POST","vendor":"ninja","path":"api/admin/expedition/ninja/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:38] local.INFO: Expedition shipmentCost method called {"vendor":"ninja","vendor_original":"ninja","method":"POST","url":"http://127.0.0.1:8000/api/admin/expedition/ninja/shipment_cost","ip":"127.0.0.1","user_id":1} 
[2026-02-05 12:54:38] local.INFO: Expedition shipmentCost request {"vendor":"ninja","request_data":{"origin_province":"JAWA TIMUR","origin_regencie":"JOMBANG","origin_district":"PETERONGAN","destination_province":"JAWA TIMUR","destination_regencie":"GRESIK","destination_district":"KEBOMAS","weight":"1.5"}} 
[2026-02-05 12:54:40] local.INFO: Ninja Express getShipmentCost request {"url":"https://api.ninjavan.co/id/1.0/public/price","body":{"weight":1.5,"service_level":"Standard","from":{"l1_tier_code":"ID_A00011_08","l2_tier_code":"ID_B00151_01"},"to":{"l1_tier_code":"ID_A00011_06","l2_tier_code":"ID_B00149_01"}}} 
[2026-02-05 12:54:40] local.INFO: Ninja Express getShipmentCost response {"response":{"data":{"total_fee":24400.0}}} 
[2026-02-05 12:54:40] local.INFO: DiscountService: Calculating discount {"vendor":"NINJA","shipping_cost":24400.0,"service_type":"Standard","user_type":null,"user_id":null} 
[2026-02-05 12:54:40] local.INFO: DiscountService: Best discount result {"discount_found":false,"discount_id":null,"discount_type":null,"discount_value":null} 
[2026-02-05 12:54:40] local.INFO: Expedition shipmentCost response {"vendor":"ninja","result_status":"success","result_message":"Shipment cost retrieved successfully"} 
