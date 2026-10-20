import { useMemo, useState } from "react";
import Image from "next/image";
import { Clock, Tag, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DiscountBadge } from "@/components/ui/discount-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import { ShippingOption } from "@/lib/shipping-data";
import {
  buildPosIndonesiaShippingOptions,
  isPosIndonesiaApiSuccess,
} from "@/lib/posIndonesiaShipmentCost";

interface ShippingResultsProps {
  isSearching: boolean;
  result?: Record<string, unknown>;
}

type ApiErrorResult = { error: true; message?: string };

/**
 * Shape seragam `discount_info` yang disisipkan tiap vendor di
 * getShipmentCost() (lihat calculateDiscountedCost() di BE) - sudah final,
 * dibaca langsung dari respons cek ongkir awal, BUKAN dihitung ulang lewat
 * panggilan API terpisah. Sebelumnya file ini memanggil getAvailableDiscounts()
 * lagi per opsi menggunakan `option.price` (yang sudah final_cost BE,
 * sudah termasuk diskon) sebagai order_value - diskon yang sama ditemukan
 * lagi dan diterapkan KEDUA KALINYA di atas harga yang sudah terdiskon
 * (double-discount, mis. JNT EZ asli Rp18.000 -> BE diskon 50% jadi
 * Rp9.000 -> FE diskon lagi 50% dari Rp9.000 jadi Rp4.500 yang salah).
 */
type DiscountInfoRaw = {
  has_discount?: boolean;
  discount_type?: string | null;
  discount_value?: number | string | null;
  discount_amount?: number | string | null;
  original_price?: number | string | null;
};

/** Flat ongkir selalu menang mutlak atas diskon (tidak stacking) - lihat
 * docs/be-fe/flat-ongkir-jawa-bali.md §2 - jadi badge diskon disembunyikan
 * total kalau `flatRateApplied` true. */
function extractDiscountFields(
  discountInfo: DiscountInfoRaw | null | undefined,
  flatRateApplied: boolean | undefined
): Pick<
  ShippingOption,
  "discountApplied" | "discountType" | "discountValue" | "discountAmount"
> & { originalPriceLabel?: string } {
  if (flatRateApplied || !discountInfo?.has_discount) {
    return {};
  }
  const discountValue = Number(discountInfo.discount_value) || 0;
  const discountAmount = Number(discountInfo.discount_amount) || 0;
  const originalPrice = Number(discountInfo.original_price) || 0;
  return {
    discountApplied: true,
    discountType:
      (discountInfo.discount_type as "percentage" | "fixed_amount" | null) ??
      null,
    discountValue,
    discountAmount,
    originalPriceLabel:
      originalPrice > 0
        ? `Rp${originalPrice.toLocaleString("id-ID")}`
        : undefined,
  };
}

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
    flat_rate_applied?: boolean;
    flat_rate_name?: string | null;
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
      flat_rate_applied?: boolean;
      flat_rate_name?: string | null;
      discount_info?: DiscountInfoRaw;
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
    flat_rate_applied?: boolean;
    flat_rate_name?: string | null;
    discount_info?: DiscountInfoRaw;
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
      flat_rate_applied?: boolean;
      flat_rate_name?: string | null;
      discount_info?: DiscountInfoRaw;
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
    | Array<{
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
      }>
    | {
        response?: {
          data?: Array<{
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
          }>;
        };
      }
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
  // Array terpisah, sejajar dengan `data` (bukan di dalamnya) — urutannya
  // paralel dengan data.price. Di sinilah flat_rate_applied/final_cost yang
  // sebenarnya berada untuk JNE. Lihat docs/be-fe/flat-ongkir-jawa-bali.md §2
  // (koreksi 2026-10-08).
  shipping_costs_with_discount?: Array<{
    final_cost?: number;
    flat_rate_applied?: boolean;
    flat_rate_name?: string | null;
    discount_info?: DiscountInfoRaw & { final_cost?: number };
  }>;
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
  shipping_costs_with_discount?: Array<{
    expressType?: string;
    publishRate?: number;
    clientRate?: number;
    canCOD?: number;
    minSla?: number;
    maxSla?: number;
    original_cost?: number;
    publish_rate?: number;
    client_rate?: number;
    can_cod?: number;
    min_sla?: number;
    max_sla?: number;
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
    final_cost?: number;
    service_code?: string;
    flat_rate_applied?: boolean;
    flat_rate_name?: string | null;
  }>;
};

type AnterajaApiResult = {
  status: string;
  cost?: number;
  flat_rate_applied?: boolean;
  flat_rate_name?: string | null;
  discount_info?: DiscountInfoRaw;
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

type NinjaApiResult = {
  status: string;
  message?: string;
  data?: {
    original_cost: number;
    final_cost: number;
    discount_applied: boolean;
    discount_amount: number;
    flat_rate_applied?: boolean;
    flat_rate_name?: string | null;
    discount_info?: DiscountInfoRaw;
    vendor_response?: {
      data?: {
        total_fee: number;
      };
    };
    request_payload?: unknown;
  };
};

type JntCargoServiceItem = {
  service_name?: string;
  service_code?: string;
  service_type?: string;
  available?: boolean;
  error?: string;
  cost?: number | string;
  price?: number | string;
  total_cost?: number | string;
  shipping_cost?: number | string;
  final_cost?: number | string;
  rate?: number | string;
  etd?: string;
  sla?: string;
  flat_rate_applied?: boolean;
  flat_rate_name?: string | null;
  discount_info?: DiscountInfoRaw;
};

type JntCargoApiResult = {
  success?: boolean;
  status: string;
  message?: string;
  data?: {
    vendor?: string;
    origin?: { province?: string; city?: string; district?: string };
    destination?: { province?: string; city?: string; district?: string };
    weight?: string;
    services?: JntCargoServiceItem[];
    coverage_check?: {
      origin_covered?: boolean;
      destination_covered?: boolean;
      service_available?: boolean;
    };
  };
  costs?: JntCargoServiceItem[];
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
    ninja: NinjaApiResult | null;
    jntcargo: JntCargoApiResult | null;
  };
};

type ApiResult = JntApiResult | PaxelApiResult | CombinedApiResult;

export default function ShippingResults({
  isSearching,
  result,
}: ShippingResultsProps) {
  const [sortBy, setSortBy] = useState<"cheapest" | "expensive">("cheapest");
  const [showAll, setShowAll] = useState(false);

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
            const discountFields = extractDiscountFields(
              item.discount_info,
              item.flat_rate_applied
            );
            options.push({
              id: `jnt-${item.productType.toLowerCase()}`,
              name: `J&T ${item.name}`,
              logo: "/images/jnt.png",
              price: `Rp${priceValue.toLocaleString("id-ID")}`,
              originalPrice: discountFields.originalPriceLabel,
              duration: "1-3 Hari",
              available: true,
              recommended: index === 0,
              tags: [{ label: "Potensi retur Rendah", type: "info" }],
              flatRateApplied: item.flat_rate_applied,
              flatRateName: item.flat_rate_name,
              discountApplied: discountFields.discountApplied,
              discountType: discountFields.discountType,
              discountValue: discountFields.discountValue,
              discountAmount: discountFields.discountAmount,
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
      // Catatan: diskon & flat ongkir belum benar-benar berfungsi untuk Paxel
      // (bug BE, bukan FE) — BE membaca price/cost/rate yang tidak dipakai
      // response Paxel (yang sebenarnya fixed_price/small_price/dst), jadi
      // flat_rate_applied di sini kemungkinan selalu undefined untuk saat
      // ini. Lihat docs/be-fe/flat-ongkir-jawa-bali.md §2 (koreksi 2026-10-08).
      if (combinedData.paxel && combinedData.paxel.status === "success") {
        const paxelData = combinedData.paxel.data?.data;
        if (paxelData) {
          // Only show fixed_price option for Paxel
          if (paxelData.fixed_price && paxelData.fixed_price > 0) {
            const discountFields = extractDiscountFields(
              paxelData.discount_info,
              paxelData.flat_rate_applied
            );
            options.push({
              id: "paxel-regular",
              name: "Paxel Express",
              logo: "/images/paxel.png",
              price: `Rp${paxelData.fixed_price.toLocaleString("id-ID")}`,
              originalPrice: discountFields.originalPriceLabel,
              duration: "1-3 Hari",
              available: true,
              recommended: false,
              tags: [{ label: "Fast Delivery", type: "info" }],
              flatRateApplied: paxelData.flat_rate_applied,
              flatRateName: paxelData.flat_rate_name,
              discountApplied: discountFields.discountApplied,
              discountType: discountFields.discountType,
              discountValue: discountFields.discountValue,
              discountAmount: discountFields.discountAmount,
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
          const discountFields = extractDiscountFields(
            lionData.discount_info,
            lionData.flat_rate_applied
          );

          options.push({
            id: "lion-regular",
            name: `Lion Parcel ${productName}`,
            logo: "/images/lion.png",
            price: `Rp${shippingCost.toLocaleString("id-ID")}`,
            originalPrice: discountFields.originalPriceLabel,
            duration: `${estimatedDays}-${estimatedDays + 2} Hari`,
            available: true,
            recommended: false,
            tags: [{ label: "Reliable Service", type: "info" }],
            flatRateApplied: lionData.flat_rate_applied,
            flatRateName: lionData.flat_rate_name,
            discountApplied: discountFields.discountApplied,
            discountType: discountFields.discountType,
            discountValue: discountFields.discountValue,
            discountAmount: discountFields.discountAmount,
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
              const discountFields = extractDiscountFields(
                service.discount_info,
                service.flat_rate_applied
              );
              options.push({
                id: `sap-${service.service_type_code.toLowerCase()}`,
                name: `SAP ${service.service_type_name}`,
                logo: "/images/sap-new.png",
                price: `Rp${service.total_cost.toLocaleString("id-ID")}`,
                originalPrice: discountFields.originalPriceLabel,
                duration: service.sla || "2-4 Hari",
                available: true,
                recommended: index === 0,
                tags: [{ label: "Pengiriman Cepat", type: "info" }],
                flatRateApplied: service.flat_rate_applied,
                flatRateName: service.flat_rate_name,
                discountApplied: discountFields.discountApplied,
                discountType: discountFields.discountType,
                discountValue: discountFields.discountValue,
                discountAmount: discountFields.discountAmount,
              });
            }
          });
        }
      }

      // Process Pos Indonesia results (BE: final_cost, service_name, estimation)
      if (isPosIndonesiaApiSuccess(combinedData.posindonesia)) {
        const posMapped = buildPosIndonesiaShippingOptions(
          combinedData.posindonesia?.data
        );
        for (const pos of posMapped) {
          options.push({
            id: pos.id,
            name: pos.name,
            logo: "/images/pos.png",
            price: pos.price,
            originalPrice: pos.originalPrice,
            duration: pos.duration,
            available: true,
            recommended: false,
            tags: [{ label: "Pos Indonesia", type: "info" }],
            ...(pos.posIndonesiaPosting
              ? { posIndonesiaPosting: pos.posIndonesiaPosting }
              : {}),
            flatRateApplied: pos.flatRateApplied,
            flatRateName: pos.flatRateName,
            discountApplied: pos.discountApplied,
            discountType: pos.discountType,
            discountValue: pos.discountValue,
            discountAmount: pos.discountAmount,
          });
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
          const jneDiscArr = combinedData.jne.shipping_costs_with_discount;
          jneData.price.forEach((item, index) => {
            if (item.price && Number(item.price) > 0) {
              // flat_rate_applied/final_cost JNE ada di array terpisah ini,
              // sejajar dengan `data`, bukan di dalam item data.price.
              const discItem = Array.isArray(jneDiscArr)
                ? jneDiscArr[index]
                : undefined;
              const priceValue =
                discItem?.final_cost ??
                discItem?.discount_info?.final_cost ??
                Number(item.price);
              const etdFrom = item.etd_from || "2";
              const etdThru = item.etd_thru || "3";
              const duration = `${etdFrom}-${etdThru} Hari`;
              const discountFields = extractDiscountFields(
                discItem?.discount_info,
                discItem?.flat_rate_applied
              );

              options.push({
                id: `jne-${item.service_code.toLowerCase()}`,
                name: `JNE ${item.service_display}`,
                logo: "/images/jne.png",
                price: `Rp${priceValue.toLocaleString("id-ID")}`,
                originalPrice: discountFields.originalPriceLabel,
                duration: duration,
                available: true,
                recommended: index === 0,
                tags: [{ label: "JNE Express", type: "info" }],
                flatRateApplied: discItem?.flat_rate_applied,
                flatRateName: discItem?.flat_rate_name,
                discountApplied: discountFields.discountApplied,
                discountType: discountFields.discountType,
                discountValue: discountFields.discountValue,
                discountAmount: discountFields.discountAmount,
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
        const idexpressData = combinedData.idexpress;

        // Use shipping_costs_with_discount array if available
        if (
          idexpressData.shipping_costs_with_discount &&
          Array.isArray(idexpressData.shipping_costs_with_discount) &&
          idexpressData.shipping_costs_with_discount.length > 0
        ) {
          idexpressData.shipping_costs_with_discount.forEach((item, index) => {
            // Use final_cost if available, otherwise fallback to publishRate or original_cost
            const priceValue =
              item.final_cost ??
              item.discount_info?.final_cost ??
              item.publishRate ??
              item.original_cost ??
              0;

            if (priceValue > 0) {
              const minSla = item.min_sla ?? item.minSla ?? 1;
              const maxSla = item.max_sla ?? item.maxSla ?? 2;
              const duration = `${minSla}-${maxSla} Hari`;
              const discountFields = extractDiscountFields(
                item.discount_info,
                item.flat_rate_applied
              );

              options.push({
                id: `idexpress-${item.service_code?.toLowerCase() ?? "regular"}`,
                name: "ID Express",
                logo: "/images/idx.png",
                price: `Rp${priceValue.toLocaleString("id-ID")}`,
                originalPrice: discountFields.originalPriceLabel,
                duration: duration,
                available: true,
                recommended: index === 0,
                tags: [{ label: "ID Express", type: "info" }],
                flatRateApplied: item.flat_rate_applied,
                flatRateName: item.flat_rate_name,
                discountApplied: discountFields.discountApplied,
                discountType: discountFields.discountType,
                discountValue: discountFields.discountValue,
                discountAmount: discountFields.discountAmount,
              });
            }
          });
        }
        // Fallback to selected data if shipping_costs_with_discount is not available
        else if (
          idexpressData.data?.selected &&
          idexpressData.data.selected.publishRate > 0
        ) {
          const selected = idexpressData.data.selected;
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
          const discountFields = extractDiscountFields(
            anterajaData.discount_info,
            anterajaData.flat_rate_applied
          );

          options.push({
            id: "anteraja-regular",
            name: productName,
            logo: "/images/anteraja.png",
            price: `Rp${cost.toLocaleString("id-ID")}`,
            originalPrice: discountFields.originalPriceLabel,
            duration: etd,
            available: true,
            recommended: false,
            tags: [{ label: "Anteraja", type: "info" }],
            flatRateApplied: anterajaData.flat_rate_applied,
            flatRateName: anterajaData.flat_rate_name,
            discountApplied: discountFields.discountApplied,
            discountType: discountFields.discountType,
            discountValue: discountFields.discountValue,
            discountAmount: discountFields.discountAmount,
          });
        }
      }

      // Process Ninja results
      if (combinedData.ninja && combinedData.ninja.status === "success") {
        const ninjaData = combinedData.ninja.data;
        if (ninjaData?.final_cost && ninjaData.final_cost > 0) {
          const discountFields = extractDiscountFields(
            ninjaData.discount_info,
            ninjaData.flat_rate_applied
          );
          options.push({
            id: "ninja-regular",
            name: "Ninja Express",
            logo: "/images/ninja.png",
            price: `Rp${ninjaData.final_cost.toLocaleString("id-ID")}`,
            originalPrice: discountFields.originalPriceLabel,
            duration: "2-4 Hari",
            available: true,
            recommended: false,
            tags: [{ label: "Ninja Express", type: "info" }],
            flatRateApplied: ninjaData.flat_rate_applied,
            flatRateName: ninjaData.flat_rate_name,
            discountApplied: discountFields.discountApplied,
            discountType: discountFields.discountType,
            discountValue: discountFields.discountValue,
            discountAmount: discountFields.discountAmount,
          });
        }
      }

      // Process J&T Cargo results
      if (
        combinedData.jntcargo &&
        combinedData.jntcargo.status === "success"
      ) {
        const jntCargoServices =
          combinedData.jntcargo.costs ??
          combinedData.jntcargo.data?.services ??
          [];

        jntCargoServices.forEach((service) => {
          const serviceLabel =
            service.service_name || service.service_type || "Reguler";
          const serviceId = `jntcargo-${(
            service.service_code ||
            service.service_type ||
            "reguler"
          ).toLowerCase()}`;

          if (!service.available) {
            options.push({
              id: serviceId,
              name: `J&T Cargo ${serviceLabel}`.trim(),
              logo: "/images/jnt-cargo.png",
              price: "Tidak tersedia",
              duration: "-",
              available: false,
              recommended: false,
              tags: [
                {
                  label: service.error || "Layanan tidak tersedia",
                  type: "warning",
                },
              ],
            });
            return;
          }

          const priceValue = Number(
            service.cost ??
              service.price ??
              service.total_cost ??
              service.shipping_cost ??
              service.final_cost ??
              service.rate ??
              0
          );
          if (!priceValue || priceValue <= 0) return;

          const discountFields = extractDiscountFields(
            service.discount_info,
            service.flat_rate_applied
          );

          options.push({
            id: serviceId,
            name: `J&T Cargo ${serviceLabel}`.trim(),
            logo: "/images/jnt-cargo.png",
            price: `Rp${priceValue.toLocaleString("id-ID")}`,
            originalPrice: discountFields.originalPriceLabel,
            duration: service.sla || service.etd || "-",
            available: true,
            recommended: false,
            tags: [{ label: "J&T Cargo", type: "info" }],
            flatRateApplied: service.flat_rate_applied,
            flatRateName: service.flat_rate_name,
            discountApplied: discountFields.discountApplied,
            discountType: discountFields.discountType,
            discountValue: discountFields.discountValue,
            discountAmount: discountFields.discountAmount,
          });
        });
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

  /** Harga akhir untuk pengurutan - `option.price` BE selalu final_cost (sudah termasuk diskon/flat ongkir). */
  const finalPrice = (option: ShippingOption): number => {
    const n = parseInt(option.price.replace(/[^\d]/g, ""), 10);
    return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
  };

  const sortedOptions = [...shippingOptions].sort((a, b) => {
    const ua = a.available === false;
    const ub = b.available === false;
    if (ua !== ub) return ua ? 1 : -1; // tidak tersedia selalu di bawah
    const diff = finalPrice(a) - finalPrice(b);
    if (!Number.isFinite(diff)) return 0;
    return sortBy === "cheapest" ? diff : -diff;
  });
  const PREVIEW_COUNT = 6;
  const visibleOptions = showAll
    ? sortedOptions
    : sortedOptions.slice(0, PREVIEW_COUNT);

  const headCls = "h-11 text-xs font-semibold text-slate-500";

  return (
    <div className="animate-slide-up space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
          {shippingOptions.length} hasil ditemukan
        </span>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Urutkan</span>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as "cheapest" | "expensive")}
          >
            <SelectTrigger className="h-10 w-[150px] rounded-lg border-slate-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cheapest">Termurah</SelectItem>
              <SelectItem value="expensive">Termahal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <Table>
          <TableHeader className="bg-slate-50/60">
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className={headCls}>Ekspedisi / Layanan</TableHead>
              <TableHead className={headCls}>Estimasi</TableHead>
              <TableHead className={headCls}>Ongkir</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleOptions.map((option) => {
              const unavailable = option.available === false;
              return (
                <TableRow
                  key={option.id}
                  className={cn(
                    "border-slate-100 hover:bg-slate-50/60",
                    unavailable && "opacity-60"
                  )}
                >
                  <TableCell className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <Image
                          src={option.logo}
                          alt={option.name}
                          width={100}
                          height={100}
                          className="max-h-full max-w-full object-contain p-1"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">
                            {option.name}
                          </span>
                          {option.recommended && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                              <ThumbsUp className="h-3 w-3" aria-hidden />
                              Rekomendasi
                            </span>
                          )}
                        </div>
                        {option.tags && option.tags.length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {option.tags.map((tag, i) => (
                              <span
                                key={i}
                                className={cn(
                                  "rounded px-2 py-0.5 text-xs",
                                  tag.type === "warning"
                                    ? "bg-amber-50 text-amber-700"
                                    : tag.type === "info"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-slate-100 text-slate-700"
                                )}
                              >
                                {tag.label}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-slate-400" aria-hidden />
                      {option.duration}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    {option.flatRateApplied ? (
                      <div>
                        <span className="text-sm font-bold text-blue-600">
                          {option.price}
                        </span>
                        <div className="mt-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                            <Tag className="h-3 w-3" aria-hidden />
                            Flat Ongkir
                            {option.flatRateName ? `: ${option.flatRateName}` : ""}
                          </span>
                        </div>
                      </div>
                    ) : option.discountApplied &&
                      option.discountType &&
                      option.discountValue != null ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-blue-600">
                            {option.price}
                          </span>
                          {option.originalPrice && (
                            <span className="text-xs text-slate-400 line-through">
                              {option.originalPrice}
                            </span>
                          )}
                        </div>
                        <div className="mt-1">
                          <DiscountBadge
                            discountType={option.discountType}
                            discountValue={option.discountValue}
                            discountAmount={option.discountAmount ?? 0}
                            showAmount={false}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-bold",
                            unavailable ? "text-slate-400" : "text-blue-600"
                          )}
                        >
                          {option.price}
                        </span>
                        {option.originalPrice && (
                          <span className="text-xs text-slate-400 line-through">
                            {option.originalPrice}
                          </span>
                        )}
                      </div>
                    )}
                    {unavailable && (
                      <span className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        Tidak tersedia
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {sortedOptions.length > PREVIEW_COUNT && (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowAll((v) => !v)}
            className="rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          >
            {showAll ? "Tampilkan lebih sedikit" : "Tampilkan lebih banyak"}
          </Button>
        </div>
      )}
    </div>
  );
}
