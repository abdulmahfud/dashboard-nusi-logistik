import { useMemo, useState, useEffect } from "react";
import { ShippingCard } from "./../ui/shipping-card";

import { Card, CardContent } from "@/components/ui/card";

import { ShippingOption } from "@/lib/shipping-data";
import { DiscountCalculation } from "@/types/discount";
import { getAvailableDiscounts } from "@/lib/apiClient";

interface ShippingResultsProps {
  isSearching: boolean;
  result?: Record<string, unknown>;
}

type ApiErrorResult = { error: true; message?: string };

type JntApiResult = {
  status: string;
  message?: string;
  data?: {
    content?: string;
    is_success?: string;
    message?: string;
  };
  shipping_costs_with_discount?: Array<{
    cost: string;
    name: string;
    productType: string;
    original_cost?: number;
    final_cost?: number;
    discount_info?: {
      has_discount: boolean;
      discount_applied: boolean;
      discount_amount: number;
      discounted_price: number;
      final_cost: number;
      original_price: number;
      discount_percentage?: number | null;
      discount_id?: number | null;
      discount_description?: string | null;
      discount_type?: string | null;
      discount_value?: number | null;
    };
  }>;
};

type PaxelApiResult = {
  status: string;
  message: string;
  data: {
    status_code: number;
    message: string;
    data: {
      response_code: number;
      service_name: string;
      city_origin: string;
      city_destination: string;
      small_price: number;
      medium_price: number;
      large_price: number;
      custom_price: number;
      time_detail: Array<{
        time_pickup_start: string;
        time_pickup_end: string;
        time_delivery_start: string;
        time_delivery_end: string;
        service: string;
        available_day: {
          day_details: Array<{
            name: string;
            nearest_date: string;
          }>;
          unavailable_day_details: Array<{
            name: string;
            nearest_date: string;
          }>;
          unavailable_days: string[];
        };
      }>;
      fixed_price: number;
      fixed_price_type: string;
      fixed_short_size: string;
      fixed_size: string;
    };
  };
  shipping_costs_with_discount: Array<unknown>;
};

type LionApiResult = {
  status: string;
  data?: {
    shipping_cost?: number;
    estimated_days?: number;
    service_type?: string;
    product?: string;
    message?: string;
  };
};

type SapApiResult = {
  status: string;
  msg?: string;
  data?: {
    origin?: string;
    destination?: string;
    coverage_cod?: boolean;
    services?: Array<{
      minimum_kilo: number;
      insurance_cost: number;
      insurance_admin_cost: number;
      volumetric_kg: number;
      packing_cost: number;
      weight: number;
      final_weight: number;
      kilo_divider: number;
      cost: number;
      discount: string;
      total_cost: number;
      service_type_code: string;
      service_type_name: string;
      surcharge: number;
      sla: string;
      markup_percentage: string;
    }>;
  };
};

type PosIndonesiaApiResult = {
  status: string;
  message?: string;
  data?:
    | Array<{
        insurance: string;
        estimation: string;
        insurancetax: string;
        penyesuaian: string;
        notes: string;
        productid: string;
        penyesuaianpersentase: string;
        totalfee: string;
        fee: string;
        feetax: string;
        productname: string;
        discount: string;
      }>
    | {
        serviceCode: number;
        serviceName: string;
        fee: number;
        feeTax: number;
        insurance: number;
        insuranceTax: number;
        totalFee: number;
        notes: string;
        estimation: string;
        penyesuaian: number;
        penyesuaianpersentase: number;
        discount: number;
      };
};

type JneApiResult = {
  status: string;
  message?: string;
  data?: {
    price?: Array<{
      origin_name: string;
      destination_name: string;
      service_display: string;
      service_code: string;
      goods_type: string;
      currency: string;
      price: string;
      etd_from: string;
      etd_thru: string;
      times: string;
    }>;
  };
  shipping_costs_with_discount?: Array<unknown>;
};

type IdexpressApiResult = {
  status: string;
  message?: string;
  data?: {
    selected?: {
      expressType: string;
      publishRate: number;
      clientRate: number;
      canCOD: number;
      minSla: number;
      maxSla: number;
    };
  };
};

type AnterajaApiResult = {
  status: string;
  cost?: number;
  response?: {
    status: number;
    info: string;
    content?: {
      origin: string;
      destination: string;
      services?: Array<{
        product_code: string;
        product_name: string;
        etd: string;
        rates: number;
        is_cod: boolean;
        surcharges: unknown;
      }>;
    };
  };
};

type CombinedApiResult = {
  status: string;
  data: {
    jnt: JntApiResult | null;
    paxel: PaxelApiResult | null;
    lion: LionApiResult | null;
    sap: SapApiResult | null;
    posindonesia: PosIndonesiaApiResult | null;
    jne: JneApiResult | null;
    idexpress: IdexpressApiResult | null;
    anteraja: AnterajaApiResult | null;
  };
};

type ApiResult = JntApiResult | PaxelApiResult | CombinedApiResult;

export default function ShippingResults({
  isSearching,
  result,
}: ShippingResultsProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Discount states
  const [discountInfo, setDiscountInfo] = useState<
    Record<string, DiscountCalculation | null>
  >({});
  const [isLoadingDiscounts, setIsLoadingDiscounts] = useState<
    Record<string, boolean>
  >({});

  // Build shippingOptions from API result if present
  const shippingOptions: ShippingOption[] = useMemo(() => {
    const apiResult = result as ApiResult;

    // Handle combined results from both APIs
    if (
      apiResult &&
      apiResult.status === "success" &&
      apiResult.data &&
      "jnt" in apiResult.data &&
      "paxel" in apiResult.data
    ) {
      const combinedData = apiResult.data as CombinedApiResult["data"];
      const options: ShippingOption[] = [];

      // Process JNT results
      if (combinedData.jnt && combinedData.jnt.status === "success") {
        const jntData = combinedData.jnt;

        // Use shipping_costs_with_discount array if available
        if (
          jntData.shipping_costs_with_discount &&
          Array.isArray(jntData.shipping_costs_with_discount) &&
          jntData.shipping_costs_with_discount.length > 0
        ) {
          jntData.shipping_costs_with_discount.forEach((item, index) => {
            // Use final_cost if available, otherwise fallback to cost or discount_info.final_cost
            const priceValue =
              item.final_cost ??
              item.discount_info?.final_cost ??
              Number(item.cost);
            options.push({
              id: `jnt-${item.productType.toLowerCase()}`,
              name: `J&T ${item.name}`,
              logo: "/images/jnt.png",
              price: `Rp${priceValue.toLocaleString("id-ID")}`,
              duration: "1-3 Hari",
              available: true,
              recommended: index === 0,
              tags: [{ label: "Potensi retur Rendah", type: "info" }],
            });
          });
        }
        // Fallback to parsing content if shipping_costs_with_discount is not available
        else if (jntData.data && typeof jntData.data.content === "string") {
          try {
            const contentArr = JSON.parse(jntData.data.content) as Array<{
              cost: string;
              name: string;
              productType: string;
            }>;

            if (Array.isArray(contentArr) && contentArr.length > 0) {
              contentArr.forEach((item, index) => {
                options.push({
                  id: `jnt-${item.productType.toLowerCase()}`,
                  name: `J&T ${item.name}`,
                  logo: "/images/jnt.png",
                  price: `Rp${Number(item.cost).toLocaleString("id-ID")}`,
                  duration: "1-3 Hari",
                  available: true,
                  recommended: index === 0,
                  tags: [{ label: "Potensi retur Rendah", type: "info" }],
                });
              });
            }
          } catch {
            // Silent error handling
          }
        }
      }

      // Process Paxel results
      if (combinedData.paxel && combinedData.paxel.status === "success") {
        const paxelData = combinedData.paxel.data?.data;
        if (paxelData) {
          // Only show fixed_price option for Paxel
          if (paxelData.fixed_price && paxelData.fixed_price > 0) {
            options.push({
              id: "paxel-regular",
              name: "Paxel Express",
              logo: "/images/paxel.png",
              price: `Rp${paxelData.fixed_price.toLocaleString("id-ID")}`,
              duration: "1-3 Hari",
              available: true,
              recommended: false,
              tags: [{ label: "Fast Delivery", type: "info" }],
            });
          }
        }
      }

      // Process Lion results
      if (combinedData.lion && combinedData.lion.status === "success") {
        const lionData = combinedData.lion.data;
        if (lionData?.shipping_cost && lionData.shipping_cost > 0) {
          const shippingCost = lionData.shipping_cost;
          const estimatedDays = lionData.estimated_days || 5;
          const productName = lionData.product || "REGPACK";

          options.push({
            id: "lion-regular",
            name: `Lion Parcel ${productName}`,
            logo: "/images/lion.png",
            price: `Rp${shippingCost.toLocaleString("id-ID")}`,
            duration: `${estimatedDays}-${estimatedDays + 2} Hari`,
            available: true,
            recommended: false,
            tags: [{ label: "Reliable Service", type: "info" }],
          });
        }
      }

      // Process SAP results
      if (combinedData.sap && combinedData.sap.status === "success") {
        const sapData = combinedData.sap.data;
        if (
          sapData?.services &&
          Array.isArray(sapData.services) &&
          sapData.services.length > 0
        ) {
          sapData.services.forEach((service, index) => {
            if (service.total_cost && service.total_cost > 0) {
              options.push({
                id: `sap-${service.service_type_code.toLowerCase()}`,
                name: `SAP ${service.service_type_name}`,
                logo: "/images/sap-new.png",
                price: `Rp${service.total_cost.toLocaleString("id-ID")}`,
                duration: service.sla || "2-4 Hari",
                available: true,
                recommended: index === 0,
                tags: [{ label: "Pengiriman Cepat", type: "info" }],
              });
            }
          });
        }
      }

      // Process Pos Indonesia results
      if (
        combinedData.posindonesia &&
        combinedData.posindonesia.status === "success"
      ) {
        const posData = combinedData.posindonesia.data;

        // Handle new format (single object)
        if (posData && !Array.isArray(posData) && typeof posData === "object") {
          // Check if it's the new format with serviceName and totalFee
          if ("serviceName" in posData && "totalFee" in posData) {
            const newFormatData = posData as {
              serviceName: string;
              totalFee: number;
              estimation: string;
            };

            // Filter hanya untuk "Pos Reguler"
            if (
              newFormatData.serviceName === "Pos Reguler" &&
              newFormatData.totalFee > 0
            ) {
              options.push({
                id: "posindonesia-reguler",
                name: newFormatData.serviceName,
                logo: "/images/pos.png",
                price: `Rp${newFormatData.totalFee.toLocaleString("id-ID")}`,
                duration: newFormatData.estimation || "2-4 Hari",
                available: true,
                recommended: false,
                tags: [{ label: "Pos Indonesia", type: "info" }],
              });
            }
          }
        }
        // Handle old format (array)
        else if (posData && Array.isArray(posData) && posData.length > 0) {
          // Filter hanya untuk "Pos Reguler"
          const posReguler = posData.find(
            (item) => item.productname === "Pos Reguler"
          );
          if (posReguler && posReguler.totalfee) {
            options.push({
              id: "posindonesia-reguler",
              name: posReguler.productname,
              logo: "/images/pos.png",
              price: `Rp${Number(posReguler.totalfee).toLocaleString("id-ID")}`,
              duration: posReguler.estimation,
              available: true,
              recommended: false,
              tags: [{ label: "Pos Indonesia", type: "info" }],
            });
          }
        }
      }

      // Process JNE results
      if (combinedData.jne && combinedData.jne.status === "success") {
        const jneData = combinedData.jne.data;
        if (
          jneData?.price &&
          Array.isArray(jneData.price) &&
          jneData.price.length > 0
        ) {
          jneData.price.forEach((item, index) => {
            if (item.price && Number(item.price) > 0) {
              const etdFrom = item.etd_from || "2";
              const etdThru = item.etd_thru || "3";
              const duration = `${etdFrom}-${etdThru} Hari`;

              options.push({
                id: `jne-${item.service_code.toLowerCase()}`,
                name: `JNE ${item.service_display}`,
                logo: "/images/jne.png",
                price: `Rp${Number(item.price).toLocaleString("id-ID")}`,
                duration: duration,
                available: true,
                recommended: index === 0,
                tags: [{ label: "JNE Express", type: "info" }],
              });
            }
          });
        }
      }

      // Process ID Express results
      if (
        combinedData.idexpress &&
        combinedData.idexpress.status === "success"
      ) {
        const idexpressData = combinedData.idexpress.data;
        if (idexpressData?.selected && idexpressData.selected.publishRate > 0) {
          const selected = idexpressData.selected;
          const duration = `${selected.minSla}-${selected.maxSla} Hari`;

          options.push({
            id: "idexpress-regular",
            name: "ID Express",
            logo: "/images/idx.png",
            price: `Rp${selected.publishRate.toLocaleString("id-ID")}`,
            duration: duration,
            available: true,
            recommended: false,
            tags: [{ label: "ID Express", type: "info" }],
          });
        }
      }

      // Process Anteraja results
      if (combinedData.anteraja && combinedData.anteraja.status === "success") {
        const anterajaData = combinedData.anteraja;

        // Get cost from either direct cost field or from services
        let cost: number | null = null;
        const service = anterajaData.response?.content?.services?.[0];

        // Try to get cost from direct cost field first
        if (anterajaData.cost) {
          cost =
            typeof anterajaData.cost === "string"
              ? Number(anterajaData.cost)
              : anterajaData.cost;
        }

        // Fallback to rates from service if cost is not available
        if ((!cost || cost <= 0) && service?.rates) {
          cost =
            typeof service.rates === "string"
              ? Number(service.rates)
              : service.rates;
        }

        // Only add option if we have a valid cost
        if (cost && cost > 0) {
          const etd = service?.etd || "5 - 9 Day";
          const productName = service?.product_name || "Anteraja Regular";

          options.push({
            id: "anteraja-regular",
            name: productName,
            logo: "/images/anteraja.png",
            price: `Rp${cost.toLocaleString("id-ID")}`,
            duration: etd,
            available: true,
            recommended: false,
            tags: [{ label: "Anteraja", type: "info" }],
          });
        }
      }

      return options;
    }

    // Fallback: Handle single API response (for backward compatibility)
    const singleApiResult = apiResult as JntApiResult;
    if (singleApiResult && singleApiResult.status === "success") {
      // Use shipping_costs_with_discount array if available
      if (
        singleApiResult.shipping_costs_with_discount &&
        Array.isArray(singleApiResult.shipping_costs_with_discount) &&
        singleApiResult.shipping_costs_with_discount.length > 0
      ) {
        return singleApiResult.shipping_costs_with_discount.map(
          (item, index) => {
            // Use final_cost if available, otherwise fallback to cost or discount_info.final_cost
            const priceValue =
              item.final_cost ??
              item.discount_info?.final_cost ??
              Number(item.cost);
            return {
              id: `jnt-${item.productType.toLowerCase()}`,
              name: `J&T ${item.name}`,
              logo: "/images/jnt.png",
              price: `Rp${priceValue.toLocaleString("id-ID")}`,
              duration: "3-6 Hari",
              available: true,
              recommended: index === 0, // Opsi pertama sebagai rekomendasi
              tags: [{ label: "Potensi retur Rendah", type: "info" }],
            };
          }
        );
      }
      // Fallback to parsing content
      if (
        singleApiResult.data &&
        "content" in singleApiResult.data &&
        typeof singleApiResult.data.content === "string"
      ) {
        try {
          const contentArr = JSON.parse(singleApiResult.data.content) as Array<{
            cost: string;
            name: string;
            productType: string;
          }>;
          if (Array.isArray(contentArr) && contentArr.length > 0) {
            // Map semua opsi dari API JNT Express
            return contentArr.map((item, index) => ({
              id: `jnt-${item.productType.toLowerCase()}`,
              name: `J&T ${item.name}`,
              logo: "/images/jnt.png",
              price: `Rp${Number(item.cost).toLocaleString("id-ID")}`,
              duration: "3-6 Hari",
              available: true,
              recommended: index === 0, // Opsi pertama sebagai rekomendasi
              tags: [{ label: "Potensi retur Rendah", type: "info" }],
            }));
          }
        } catch {
          return [];
        }
      }
    }
    return [];
  }, [result]);

  // Function to fetch discount for a specific option
  const fetchDiscountForOption = async (option: ShippingOption) => {
    try {
      setIsLoadingDiscounts((prev) => ({ ...prev, [option.id]: true }));

      // Extract cost from price string
      const shippingCost = parseInt(option.price.replace(/[^\d]/g, ""));

      // Determine vendor based on option ID
      let vendor = "JNTEXPRESS";
      if (option.id.startsWith("paxel")) {
        vendor = "PAXEL";
      } else if (option.id.startsWith("lion")) {
        vendor = "LION";
      } else if (option.id.startsWith("sap")) {
        vendor = "SAP";
      } else if (option.id.startsWith("posindonesia")) {
        vendor = "POSINDONESIA";
      } else if (option.id.startsWith("jne")) {
        vendor = "JNE";
      } else if (option.id.startsWith("idexpress")) {
        vendor = "IDEXPRESS";
      } else if (option.id.startsWith("anteraja")) {
        vendor = "ANTERAJA";
      }

      // Get discount for the selected vendor
      const discountResponse = await getAvailableDiscounts({
        vendor: vendor,
        order_value: shippingCost,
      });

      if (
        discountResponse.status === "success" &&
        discountResponse.data.best_discount
      ) {
        setDiscountInfo((prev) => ({
          ...prev,
          [option.id]: discountResponse.data
            .best_discount as DiscountCalculation,
        }));
      } else {
        setDiscountInfo((prev) => ({
          ...prev,
          [option.id]: null,
        }));
      }
    } catch {
      setDiscountInfo((prev) => ({
        ...prev,
        [option.id]: null,
      }));
    } finally {
      setIsLoadingDiscounts((prev) => ({ ...prev, [option.id]: false }));
    }
  };

  // Auto-fetch discounts when shipping options change
  useEffect(() => {
    if (shippingOptions.length > 0) {
      // Fetch discounts for all options
      shippingOptions.forEach((option) => {
        fetchDiscountForOption(option);
      });
    }
  }, [shippingOptions]);

  function isApiErrorResult(obj: unknown): obj is ApiErrorResult {
    return (
      !!obj &&
      typeof obj === "object" &&
      "error" in obj &&
      (obj as Record<string, unknown>)["error"] === true
    );
  }

  // Show loading state
  if (isSearching) {
    return (
      <div className="flex flex-col items-center justify-center h-60">
        <div className="w-12 h-12 border-4 border-blue-300 rounded-full border-t-blue-600 animate-spin"></div>
        <p className="mt-4 text-sm text-gray-500">
          Mencari layanan pengiriman...
        </p>
      </div>
    );
  }

  // Show error state
  if (result && isApiErrorResult(result)) {
    return (
      <div className="p-4 text-red-600">
        {result.message || "Gagal cek ongkir"}
      </div>
    );
  }

  // Debug: tampilkan data mentah jika tidak ada shippingOptions
  if (!shippingOptions.length && result) {
    return (
      <div className="p-4 text-center">
        <div className="text-yellow-600 mb-2">
          <svg
            className="w-12 h-12 mx-auto mb-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <h3 className="font-semibold">Tidak Ada Layanan Pengiriman</h3>
        </div>
        <p className="text-sm text-gray-600 mb-3">
          Maaf, tidak ada layanan pengiriman yang tersedia untuk rute ini.
        </p>
        <div className="text-xs text-gray-500 space-y-1">
          <p>Kemungkinan penyebab:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Lokasi asal atau tujuan belum tersedia di jaringan J&T</li>
            <li>Berat paket melebihi batas maksimal</li>
            <li>Rute pengiriman sedang tidak beroperasi</li>
          </ul>
        </div>
        <details className="mt-3">
          <summary className="text-xs text-gray-400 cursor-pointer">
            Debug Info
          </summary>
          <pre className="text-xs bg-gray-100 p-2 mt-2 rounded overflow-x-auto text-left">
            {JSON.stringify(result, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  // Don't show anything if no results yet
  if (!shippingOptions.length) {
    return null;
  }

  return (
    <div className="animate-slide-up">
      {/* Display all shipping options */}
      {shippingOptions.map((option) => (
        <Card
          key={option.id}
          className="mb-4 border-gray-100 bg-white overflow-hidden hover:shadow-md transition-shadow"
        >
          <CardContent className="relative pt-3">
            <ShippingCard
              option={option}
              isSelected={selectedOption === option.id}
              onClick={() => setSelectedOption(option.id)}
              discount={discountInfo[option.id]}
              isLoadingDiscount={isLoadingDiscounts[option.id] || false}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
