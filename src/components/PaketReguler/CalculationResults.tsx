import { useState, useMemo, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShippingOption } from "@/types/dataRegulerForm";
import Image from "next/image";
import {
  CirclePlus,
  Package,
  PackageCheck,
  CreditCard,
  Tag,
  Loader2,
  ClipboardList,
  Wallet,
  Handshake,
  TrendingUp,
  Hash,
  ReceiptText,
  Truck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/apiClient";
import { toast } from "sonner";
import { DiscountBadge } from "@/components/ui/discount-badge";
import { StatusBadge } from "@/components/redesign/status-badge";
import { deliveryTypeToPickup } from "@/lib/utils";
import {
  buildPosIndonesiaShippingOptions,
  isPosIndonesiaApiSuccess,
} from "@/lib/posIndonesiaShipmentCost";
import { AxiosError } from "axios";
import { getAxiosErrorMessage } from "@/lib/apiError";
import { useAuth } from "@/context/AuthContext";
import type { ExpeditionGroup } from "@/types/expeditionGroup";

interface CalculationResultsProps {
  isSearching: boolean;
  result?: Record<string, unknown>;
  /** Dari GET /admin/expedition-groups — menggantikan kategori Reguler/Cargo
   * yang sebelumnya hardcode. Lihat docs/be-fe/expedition-groups.md */
  groups?: ExpeditionGroup[];
  formData?: {
    itemValue?: string;
    paymentMethod?: string;
    formData?: {
      receiverName: string;
      receiverPhone: string;
      province: string;
      regency: string;
      district: string;
      receiverAddress: string;
      postal_code?: string;
      itemContent: string;
      itemType: string;
      itemValue: string;
      itemQuantity: string;
      weight: string;
      length: string;
      width: string;
      height: string;
      notes: string;
      deliveryType: string;
      paymentMethod: string;
    };
    businessData?: {
      id: number;
      businessName: string;
      senderName: string;
      contact: string;
      province: string | null;
      regency: string | null;
      district: string | null;
      address: string;
      postal_code?: string | null;
    } | null;
    receiverId?: string | null;
    senderLatitude?: number | null;
    senderLongitude?: number | null;
  };
  onResetForm?: () => void;
  /** Tab kategori layanan — dikontrol dari parent supaya tab tetap tampil
   * walau belum ada hasil pencarian (lihat halaman Kirim Paket Reguler). */
  activeCategory?: ServiceCategory;
  /** Dilaporkan ke parent setiap kali layanan yang dipilih (atau harganya,
   * mis. karena diskon) berubah — dipakai kartu "Ringkasan Pengiriman" di
   * halaman Kirim Paket Reguler supaya Total Ongkir tidak kosong. */
  onSelectedOptionChange?: (
    option: { name: string; price: string } | null
  ) => void;
}

type ApiErrorResult = { error: true; message?: string };

type JntApiResult = {
  status: string;
  data?: {
    content?: string;
    is_success?: string;
    message?: string;
  };
  /** Sejajar dengan `data`, index-matched dengan array hasil parse `data.content`. */
  shipping_costs_with_discount?: Array<Record<string, unknown>>;
};

type PaxelApiResult = {
  status: string;
  data?: {
    status_code: number;
    message: string;
    data: {
      fixed_price: number;
      time_detail?: Array<{
        service: string;
        time_pickup_start: string;
        time_pickup_end: string;
        time_delivery_start: string;
        time_delivery_end: string;
      }>;
      flat_rate_applied?: boolean;
      flat_rate_name?: string | null;
      discount_info?: DiscountInfoRaw | null;
    };
  };
  shipping_costs_with_discount?: Array<unknown>;
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
    discount_info?: DiscountInfoRaw | null;
  };
};

type SapApiResult = {
  status: string;
  data?: {
    shipping_cost?: number;
    estimated_days?: number;
    service_type?: string;
    message?: string;
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
  discount_info?: DiscountInfoRaw | null;
};

type JntCargoApiResult = {
  success?: boolean;
  status: string;
  message?: string;
  data?: {
    vendor?: string;
    services?: JntCargoServiceItem[];
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
    posindonesia: Record<string, unknown> | null;
    jne: Record<string, unknown> | null;
    idexpress: Record<string, unknown> | null;
    anteraja: Record<string, unknown> | null;
    ninja: Record<string, unknown> | null;
    jntcargo: JntCargoApiResult | null;
  };
};

/**
 * Kategori tab "Pilihan Layanan" — slug grup dari GET /admin/expedition-groups
 * ("all" = semua, atau SERVICE_CATEGORY_UNGROUPED untuk vendor tanpa grup).
 * Lihat docs/be-fe/expedition-groups.md
 */
export type ServiceCategory = string;

/** Tab fallback untuk vendor yang belum/tidak lagi punya grup (grup dihapus admin). */
export const SERVICE_CATEGORY_UNGROUPED = "lainnya";

/**
 * id opsi dibentuk dari prefix vendor (mis. `jne-reg`, `jntcargo-ez`), tapi
 * JNT Express sengaja memakai singkatan "jnt" sedangkan kunci vendor
 * sebenarnya (dipakai expedition-groups/vendor-settings) adalah "jntexpress".
 */
const OPTION_ID_VENDOR_OVERRIDES: Record<string, string> = {
  jnt: "jntexpress",
};

function vendorKeyFromOptionId(optionId: string): string {
  const prefix = optionId.split("-")[0] ?? "";
  return OPTION_ID_VENDOR_OVERRIDES[prefix] ?? prefix;
}

/** Peta vendor (lowercase) -> slug grup, dari field `vendors` tiap grup. */
function buildVendorGroupMap(
  groups: ExpeditionGroup[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const group of groups) {
    for (const vendor of group.vendors ?? []) {
      map[vendor.toLowerCase()] = group.slug;
    }
  }
  return map;
}

function getServiceCategory(
  optionId: string,
  vendorGroupMap: Record<string, string>
): string {
  const vendorKey = vendorKeyFromOptionId(optionId);
  return vendorGroupMap[vendorKey] ?? SERVICE_CATEGORY_UNGROUPED;
}

/** Peta vendor (lowercase) -> grup lengkap, untuk baca field estimasi_*. */
function buildVendorGroupFullMap(
  groups: ExpeditionGroup[]
): Record<string, ExpeditionGroup> {
  const map: Record<string, ExpeditionGroup> = {};
  for (const group of groups) {
    for (const vendor of group.vendors ?? []) {
      map[vendor.toLowerCase()] = group;
    }
  }
  return map;
}

type GroupEstimasi = { kota: string; pulau: string; luarPulau: string };

/**
 * Estimasi SLA yang ditampilkan ke user - diambil langsung dari ketiga field
 * Expedition Group (estimasi_dalam_kota/estimasi_dalam_pulau/
 * estimasi_luar_pulau) vendor terkait, apa adanya - BUKAN dihitung dari
 * respons API tiap vendor, dan BUKAN dipilih berdasarkan jarak
 * pengirim-penerima (tidak ada klasifikasi/mapping rute). Karena itu nilainya
 * akan selalu sama untuk semua vendor dalam satu grup yang sama (beda hanya
 * antar grup, mis. Reguler & COD vs Cargo).
 * `null` artinya vendor belum terdaftar di grup manapun - pemanggil
 * fallback ke durasi lama (dihitung dari API vendor).
 */
function resolveGroupEstimasi(
  optionId: string,
  vendorGroupFullMap: Record<string, ExpeditionGroup>
): GroupEstimasi | null {
  const vendorKey = vendorKeyFromOptionId(optionId);
  const group = vendorGroupFullMap[vendorKey];
  if (!group) return null;

  const kota = group.estimasi_dalam_kota?.trim();
  const pulau = group.estimasi_dalam_pulau?.trim();
  const luarPulau = group.estimasi_luar_pulau?.trim();
  if (!kota && !pulau && !luarPulau) return null;

  return {
    kota: kota || "-",
    pulau: pulau || "-",
    luarPulau: luarPulau || "-",
  };
}

type ApiResult = JntApiResult | PaxelApiResult | CombinedApiResult;

/**
 * Shape seragam `discount_info` yang sekarang disisipkan tiap vendor di
 * getShipmentCost() (lihat calculateDiscountedCost() di BE) - sudah final,
 * tidak perlu panggilan API terpisah lagi. Dibaca langsung dari respons cek
 * ongkir awal, bukan dihitung ulang di FE (menghindari risiko double-count
 * karena `price` tiap opsi sudah termasuk diskon ini).
 */
type DiscountInfoRaw = {
  has_discount?: boolean;
  discount_type?: "percentage" | "fixed_amount" | null;
  discount_value?: number | string | null;
  discount_amount?: number | string | null;
  original_price?: number | string | null;
};

/**
 * Field diskon untuk ditempel ke satu `ShippingOption`. Flat ongkir selalu
 * menang mutlak atas diskon (tidak stacking) - lihat
 * docs/be-fe/flat-ongkir-jawa-bali.md §2 - jadi badge diskon disembunyikan
 * total kalau `flatRateApplied` true, walau `discount_info.has_discount`
 * BE tetap true (dihitung independen dari flat rate).
 */
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
    discountType: discountInfo.discount_type ?? null,
    discountValue,
    discountAmount,
    originalPriceLabel:
      originalPrice > 0
        ? `Rp${originalPrice.toLocaleString("id-ID")}`
        : undefined,
  };
}

export default function CalculationResults({
  isSearching,
  result,
  groups = [],
  formData,
  onResetForm,
  activeCategory = "all",
  onSelectedOptionChange,
}: CalculationResultsProps) {
  const vendorGroupMap = useMemo(() => buildVendorGroupMap(groups), [groups]);
  const vendorGroupFullMap = useMemo(
    () => buildVendorGroupFullMap(groups),
    [groups]
  );
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isInsured, setIsInsured] = useState(false);
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  const [orderResult, setOrderResult] = useState<{
    success: boolean;
    message: string;
    awb_no?: string;
    order_id?: number;
    reference_no?: string;
    /** cod: sudah langsung diproses ke ekspedisi (awb_no ada); payment: tersimpan untuk direview di Pembayaran Paket */
    flow?: "cod" | "payment";
  } | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  const { user } = useAuth();
  // Akun corporate (kerja sama/postpaid): tidak bayar di muka sama sekali —
  // ongkir otomatis ditambahkan ke limit kredit, diproses BE lewat request
  // yang sama tanpa perubahan payload dari FE (lihat
  // docs/be-fe/kerja-sama-akun-invoice.md §4). Jadi cuma tampilan yang beda,
  // bukan endpoint-nya.
  const isCorporate = user?.account_type === "corporate";

  // Reset selection state when form data or result changes
  useEffect(() => {
    // Reset all selection states when new data comes in
    setSelectedOption(null);
    setShowPaymentSection(false);
    setIsInsured(false);
    setOrderResult(null);
    setShowSuccessDialog(false);
    setTermsAccepted(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]); // Only depend on result changes, not isSearching or formData

  const isCOD = formData?.formData?.paymentMethod === "cod";

  // Build shippingOptions from API result if present
  const shippingOptions: ShippingOption[] = useMemo(() => {
    const apiResult = result as ApiResult;

    // Handle combined results from all APIs
    if (
      apiResult &&
      apiResult.status === "success" &&
      apiResult.data &&
      "jnt" in apiResult.data &&
      "paxel" in apiResult.data &&
      "lion" in apiResult.data
    ) {
      const combinedData = apiResult.data as CombinedApiResult["data"];
      const options: ShippingOption[] = [];

      // Process JNT results
      // final_cost/flat_rate_applied/flat_rate_name TIDAK ada di data.content
      // (tetap mentah, tidak pernah diubah BE) - ada di shipping_costs_with_discount,
      // array terpisah sejajar dengan `data`, index-matched dengan hasil parse
      // data.content. Sebelumnya field ini dibaca langsung dari item content
      // (selalu undefined) dan price selalu dari item.cost mentah, jadi
      // diskon/flat ongkir JNT Express tidak pernah ikut tampil. Lihat
      // docs/be-fe/flat-ongkir-jawa-bali.md §2 untuk pola yang sama di JNE.
      if (combinedData.jnt && combinedData.jnt.status === "success") {
        const jntData = combinedData.jnt;
        const jntDiscArr = jntData.shipping_costs_with_discount;
        if (jntData.data && typeof jntData.data.content === "string") {
          try {
            const contentArr = JSON.parse(jntData.data.content) as Array<{
              cost: string;
              name: string;
              productType: string;
            }>;

            if (Array.isArray(contentArr) && contentArr.length > 0) {
              contentArr.forEach((item, index) => {
                const discItem = Array.isArray(jntDiscArr)
                  ? jntDiscArr[index]
                  : undefined;
                const priceValue =
                  Number(discItem?.final_cost) || Number(item.cost) || 0;
                const flatRateApplied = discItem?.flat_rate_applied as
                  | boolean
                  | undefined;
                const discountFields = extractDiscountFields(
                  discItem?.discount_info as DiscountInfoRaw | undefined,
                  flatRateApplied
                );

                options.push({
                  id: `jnt-${item.productType.toLowerCase()}`,
                  name: `J&T ${item.name}`,
                  logo: "/images/jnt.png",
                  price: `Rp${priceValue.toLocaleString("id-ID")}`,
                  originalPrice: discountFields.originalPriceLabel,
                  duration: "3-6 Hari",
                  available: true,
                  recommended: index === 0,
                  tags: [
                    { label: "Potensi retur Rendah", type: "success" as const },
                  ],
                  flatRateApplied,
                  flatRateName: discItem?.flat_rate_name as
                    | string
                    | null
                    | undefined,
                  discountApplied: discountFields.discountApplied,
                  discountType: discountFields.discountType,
                  discountValue: discountFields.discountValue,
                  discountAmount: discountFields.discountAmount,
                });
              });
            }
          } catch (error) {
            console.error("❌ Error parsing JNT options:", error);
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
        if (paxelData?.fixed_price) {
          const fixedPrice = paxelData.fixed_price;
          const paxelFlat = {
            flatRateApplied: paxelData.flat_rate_applied,
            flatRateName: paxelData.flat_rate_name,
          };
          // Catatan: discount_info BE untuk Paxel sama seperti flat_rate_applied
          // di atas - ada di tipe tapi BE menulisnya ke struktur respons yang
          // tidak pernah dibaca di sini (bug lama yang sudah didokumentasikan,
          // lihat komentar di atas). Tetap dibaca di sini demi konsistensi kode
          // dengan vendor lain; akan otomatis berfungsi begitu bug BE-nya
          // diperbaiki tanpa perlu ubah FE lagi.
          const paxelDiscountFields = extractDiscountFields(
            paxelData.discount_info,
            paxelFlat.flatRateApplied
          );

          // Add same-day service if available
          if (
            paxelData.time_detail?.some(
              (time: { service: string }) => time.service === "same_day"
            )
          ) {
            options.push({
              id: "paxel-same-day",
              name: "Paxel Same Day",
              logo: "/images/paxel.png",
              price: `Rp${fixedPrice.toLocaleString("id-ID")}`,
              duration: "Same Day",
              available: true,
              recommended: true,
              tags: [{ label: "Same Day Delivery", type: "success" as const }],
              ...paxelFlat,
              originalPrice: paxelDiscountFields.originalPriceLabel,
              discountApplied: paxelDiscountFields.discountApplied,
              discountType: paxelDiscountFields.discountType,
              discountValue: paxelDiscountFields.discountValue,
              discountAmount: paxelDiscountFields.discountAmount,
            });
          }

          // Add next-day service if available
          if (
            paxelData.time_detail?.some(
              (time: { service: string }) => time.service === "next_day"
            )
          ) {
            options.push({
              id: "paxel-next-day",
              name: "Paxel Next Day",
              logo: "/images/paxel.png",
              price: `Rp${fixedPrice.toLocaleString("id-ID")}`,
              duration: "1-3 Hari",
              available: true,
              recommended: false,
              tags: [{ label: "Pengiriman Cepat", type: "success" as const }],
              ...paxelFlat,
              originalPrice: paxelDiscountFields.originalPriceLabel,
              discountApplied: paxelDiscountFields.discountApplied,
              discountType: paxelDiscountFields.discountType,
              discountValue: paxelDiscountFields.discountValue,
              discountAmount: paxelDiscountFields.discountAmount,
            });
          }

          // If no specific services found, create a general option
          if (
            !paxelData.time_detail?.some(
              (time: { service: string }) =>
                time.service === "same_day" || time.service === "next_day"
            )
          ) {
            options.push({
              id: "paxel-regular",
              name: "Paxel Regular",
              logo: "/images/paxel.png",
              price: `Rp${fixedPrice.toLocaleString("id-ID")}`,
              duration: "1-2 Hari",
              available: true,
              recommended: true,
              tags: [{ label: "Fast Delivery", type: "success" as const }],
              ...paxelFlat,
              originalPrice: paxelDiscountFields.originalPriceLabel,
              discountApplied: paxelDiscountFields.discountApplied,
              discountType: paxelDiscountFields.discountType,
              discountValue: paxelDiscountFields.discountValue,
              discountAmount: paxelDiscountFields.discountAmount,
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
          const lionDiscountFields = extractDiscountFields(
            lionData.discount_info,
            lionData.flat_rate_applied
          );

          options.push({
            id: "lion-regular",
            name: `Lion Parcel ${productName}`,
            logo: "/images/lion.png",
            price: `Rp${shippingCost.toLocaleString("id-ID")}`,
            duration: `${estimatedDays}-${estimatedDays + 2} Hari`,
            available: true,
            recommended: false,
            tags: [
              { label: "Pengiriman Terjangkau", type: "success" as const },
              { label: productName, type: "info" as const },
            ],
            flatRateApplied: lionData.flat_rate_applied,
            flatRateName: lionData.flat_rate_name,
            originalPrice: lionDiscountFields.originalPriceLabel,
            discountApplied: lionDiscountFields.discountApplied,
            discountType: lionDiscountFields.discountType,
            discountValue: lionDiscountFields.discountValue,
            discountAmount: lionDiscountFields.discountAmount,
          });
        }
      }

      // Process SAP results
      if (combinedData.sap && combinedData.sap.status === "success") {
        const sapData = combinedData.sap.data as Record<string, unknown>;
        if (
          sapData?.services &&
          Array.isArray(sapData.services) &&
          sapData.services.length > 0
        ) {
          sapData.services.forEach(
            (service: Record<string, unknown>, index: number) => {
              if (service.total_cost && Number(service.total_cost) > 0) {
                const sapFlatRateApplied = service.flat_rate_applied as
                  | boolean
                  | undefined;
                const sapDiscountFields = extractDiscountFields(
                  service.discount_info as DiscountInfoRaw | undefined,
                  sapFlatRateApplied
                );

                options.push({
                  id: `sap-${String(service.service_type_code || "regular").toLowerCase()}`,
                  name: `SAP ${String(service.service_type_name || "REGULER")}`,
                  logo: "/images/sap-new.png",
                  price: `Rp${Number(service.total_cost).toLocaleString("id-ID")}`,
                  originalPrice: sapDiscountFields.originalPriceLabel,
                  duration: String(service.sla || "2-4 Hari"),
                  available: true,
                  recommended: index === 0,
                  tags: [
                    { label: "Pengiriman Cepat", type: "success" as const },
                  ],
                  flatRateApplied: sapFlatRateApplied,
                  flatRateName: service.flat_rate_name as
                    | string
                    | null
                    | undefined,
                  discountApplied: sapDiscountFields.discountApplied,
                  discountType: sapDiscountFields.discountType,
                  discountValue: sapDiscountFields.discountValue,
                  discountAmount: sapDiscountFields.discountAmount,
                });
              }
            }
          );
        } else if (
          sapData?.shipping_cost &&
          Number(sapData.shipping_cost) > 0
        ) {
          // Fallback to old format
          const shippingCost = Number(sapData.shipping_cost);
          const estimatedDays = Number(sapData.estimated_days) || 3;
          const serviceType = String(sapData.service_type || "REGULER");

          options.push({
            id: "sap-regular",
            name: `SAP ${serviceType}`,
            logo: "/images/sap-new.png",
            price: `Rp${shippingCost.toLocaleString("id-ID")}`,
            duration: `${estimatedDays}-${estimatedDays + 2} Hari`,
            available: true,
            recommended: false,
            tags: [
              { label: "Pengiriman Cepat", type: "success" as const },
              { label: serviceType, type: "info" as const },
            ],
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
            tags: [{ label: "Pos Indonesia", type: "info" as const }],
            ...(pos.posIndonesiaPosting
              ? { posIndonesiaPosting: pos.posIndonesiaPosting }
              : {}),
            flatRateApplied: pos.flatRateApplied,
            flatRateName: pos.flatRateName,
          });
        }
      }

      // Process JNE results
      if (combinedData.jne && combinedData.jne.status === "success") {
        const jneResult = combinedData.jne as Record<string, unknown>;
        const jneData = jneResult.data as Record<string, unknown>;
        // flat_rate_applied/final_cost JNE ada di array terpisah ini,
        // sejajar dengan `data` (bukan di dalamnya), urutan paralel dengan
        // data.price. Lihat docs/be-fe/flat-ongkir-jawa-bali.md §2 (koreksi
        // 2026-10-08).
        const jneDiscArr = jneResult.shipping_costs_with_discount as
          | Array<Record<string, unknown>>
          | undefined;
        if (
          jneData?.price &&
          Array.isArray(jneData.price) &&
          jneData.price.length > 0
        ) {
          jneData.price.forEach(
            (item: Record<string, unknown>, index: number) => {
              if (item.price && Number(item.price) > 0) {
                const discItem = Array.isArray(jneDiscArr)
                  ? jneDiscArr[index]
                  : undefined;
                const priceValue =
                  Number(discItem?.final_cost) ||
                  Number(
                    (discItem?.discount_info as Record<string, unknown>)
                      ?.final_cost
                  ) ||
                  Number(item.price);
                const etdFrom = String(item.etd_from || "2");
                const etdThru = String(item.etd_thru || "3");
                const duration = `${etdFrom}-${etdThru} Hari`;
                const jneFlatRateApplied = discItem?.flat_rate_applied as
                  | boolean
                  | undefined;
                const jneDiscountFields = extractDiscountFields(
                  discItem?.discount_info as DiscountInfoRaw | undefined,
                  jneFlatRateApplied
                );

                options.push({
                  id: `jne-${String(item.service_code || "regular").toLowerCase()}`,
                  name: `JNE ${String(item.service_display || "REG")}`,
                  logo: "/images/jne.png",
                  price: `Rp${priceValue.toLocaleString("id-ID")}`,
                  originalPrice: jneDiscountFields.originalPriceLabel,
                  duration: duration,
                  available: true,
                  recommended: index === 0,
                  tags: [{ label: "JNE Express", type: "info" as const }],
                  flatRateApplied: jneFlatRateApplied,
                  flatRateName: discItem?.flat_rate_name as
                    | string
                    | null
                    | undefined,
                  discountApplied: jneDiscountFields.discountApplied,
                  discountType: jneDiscountFields.discountType,
                  discountValue: jneDiscountFields.discountValue,
                  discountAmount: jneDiscountFields.discountAmount,
                });
              }
            }
          );
        }
      }

      // Process ID Express results
      if (
        combinedData.idexpress &&
        combinedData.idexpress.status === "success"
      ) {
        const idexpressData = combinedData.idexpress as Record<string, unknown>;

        // Use shipping_costs_with_discount array if available
        if (
          idexpressData.shipping_costs_with_discount &&
          Array.isArray(idexpressData.shipping_costs_with_discount) &&
          idexpressData.shipping_costs_with_discount.length > 0
        ) {
          idexpressData.shipping_costs_with_discount.forEach(
            (item: Record<string, unknown>, index: number) => {
              const priceValue =
                Number(item.final_cost) ||
                Number(
                  (item.discount_info as Record<string, unknown>)?.final_cost
                ) ||
                Number(item.publishRate) ||
                Number(item.original_cost) ||
                0;

              if (priceValue > 0) {
                const minSla = Number(item.min_sla || item.minSla || 1);
                const maxSla = Number(item.max_sla || item.maxSla || 2);
                const duration = `${minSla}-${maxSla} Hari`;
                const idexpressFlatRateApplied = item.flat_rate_applied as
                  | boolean
                  | undefined;
                const idexpressDiscountFields = extractDiscountFields(
                  item.discount_info as DiscountInfoRaw | undefined,
                  idexpressFlatRateApplied
                );

                options.push({
                  id: `idexpress-${String(item.service_code || "regular").toLowerCase()}`,
                  name: "ID Express",
                  logo: "/images/idx.png",
                  price: `Rp${priceValue.toLocaleString("id-ID")}`,
                  originalPrice: idexpressDiscountFields.originalPriceLabel,
                  duration: duration,
                  available: true,
                  recommended: index === 0,
                  tags: [{ label: "ID Express", type: "info" as const }],
                  flatRateApplied: idexpressFlatRateApplied,
                  flatRateName: item.flat_rate_name as
                    | string
                    | null
                    | undefined,
                  discountApplied: idexpressDiscountFields.discountApplied,
                  discountType: idexpressDiscountFields.discountType,
                  discountValue: idexpressDiscountFields.discountValue,
                  discountAmount: idexpressDiscountFields.discountAmount,
                });
              }
            }
          );
        }
        // Fallback to selected data if shipping_costs_with_discount is not available
        else if (
          idexpressData.data &&
          typeof idexpressData.data === "object" &&
          "selected" in idexpressData.data
        ) {
          const selected = (idexpressData.data as Record<string, unknown>)
            .selected as Record<string, unknown>;
          if (selected && Number(selected.publishRate) > 0) {
            const duration = `${Number(selected.minSla) || 1}-${Number(selected.maxSla) || 2} Hari`;

            options.push({
              id: "idexpress-regular",
              name: "ID Express",
              logo: "/images/idx.png",
              price: `Rp${Number(selected.publishRate).toLocaleString("id-ID")}`,
              duration: duration,
              available: true,
              recommended: false,
              tags: [{ label: "ID Express", type: "info" as const }],
            });
          }
        }
      }

      // Process Anteraja results
      if (combinedData.anteraja && combinedData.anteraja.status === "success") {
        const anterajaData = combinedData.anteraja as Record<string, unknown>;

        // Get cost from either direct cost field or from services
        let cost: number | null = null;
        const response = anterajaData.response as
          | Record<string, unknown>
          | undefined;
        const content = response?.content as
          | Record<string, unknown>
          | undefined;
        const services = content?.services as
          | Array<Record<string, unknown>>
          | undefined;
        const service = services?.[0];

        // Try to get cost from direct cost field first
        if (anterajaData.cost) {
          cost =
            typeof anterajaData.cost === "string"
              ? Number(anterajaData.cost)
              : Number(anterajaData.cost);
        }

        // Fallback to rates from service if cost is not available
        if ((!cost || cost <= 0) && service?.rates) {
          cost =
            typeof service.rates === "string"
              ? Number(service.rates)
              : Number(service.rates);
        }

        // Only add option if we have a valid cost
        if (cost && cost > 0) {
          const etd = String(service?.etd || "5 - 9 Day");
          const productName = String(
            service?.product_name || "Anteraja Regular"
          );

          const anterajaFlatRateApplied = anterajaData.flat_rate_applied as
            | boolean
            | undefined;
          const anterajaDiscountFields = extractDiscountFields(
            anterajaData.discount_info as DiscountInfoRaw | undefined,
            anterajaFlatRateApplied
          );

          options.push({
            id: "anteraja-regular",
            name: productName,
            logo: "/images/anteraja.png",
            price: `Rp${cost.toLocaleString("id-ID")}`,
            originalPrice: anterajaDiscountFields.originalPriceLabel,
            duration: etd,
            available: true,
            recommended: false,
            tags: [{ label: "Anteraja", type: "info" as const }],
            flatRateApplied: anterajaFlatRateApplied,
            flatRateName: anterajaData.flat_rate_name as
              | string
              | null
              | undefined,
            discountApplied: anterajaDiscountFields.discountApplied,
            discountType: anterajaDiscountFields.discountType,
            discountValue: anterajaDiscountFields.discountValue,
            discountAmount: anterajaDiscountFields.discountAmount,
          });
        }
      }

      // Process Ninja results
      if (combinedData.ninja && combinedData.ninja.status === "success") {
        const ninjaData = combinedData.ninja.data as Record<string, unknown>;
        if (ninjaData?.final_cost && Number(ninjaData.final_cost) > 0) {
          const ninjaFlatRateApplied = ninjaData.flat_rate_applied as
            | boolean
            | undefined;
          const ninjaDiscountFields = extractDiscountFields(
            ninjaData.discount_info as DiscountInfoRaw | undefined,
            ninjaFlatRateApplied
          );

          options.push({
            id: "ninja-regular",
            name: "Ninja Express",
            logo: "/images/ninja.png",
            price: `Rp${Number(ninjaData.final_cost).toLocaleString("id-ID")}`,
            originalPrice: ninjaDiscountFields.originalPriceLabel,
            duration: "2-4 Hari",
            available: true,
            recommended: false,
            tags: [{ label: "Ninja Express", type: "info" as const }],
            flatRateApplied: ninjaFlatRateApplied,
            flatRateName: ninjaData.flat_rate_name as
              | string
              | null
              | undefined,
            discountApplied: ninjaDiscountFields.discountApplied,
            discountType: ninjaDiscountFields.discountType,
            discountValue: ninjaDiscountFields.discountValue,
            discountAmount: ninjaDiscountFields.discountAmount,
          });
        }
      }
      // Process J&T Cargo results
      if (combinedData.jntcargo && combinedData.jntcargo.status === "success") {
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

          if (!service.available) return;

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

          const jntCargoDiscountFields = extractDiscountFields(
            service.discount_info,
            service.flat_rate_applied
          );

          options.push({
            id: serviceId,
            name: `J&T Cargo ${serviceLabel}`.trim(),
            logo: "/images/jnt-cargo.png",
            price: `Rp${priceValue.toLocaleString("id-ID")}`,
            originalPrice: jntCargoDiscountFields.originalPriceLabel,
            duration: service.sla || service.etd || "-",
            available: true,
            recommended: false,
            tags: [{ label: "J&T Cargo", type: "info" as const }],
            flatRateApplied: service.flat_rate_applied,
            flatRateName: service.flat_rate_name,
            discountApplied: jntCargoDiscountFields.discountApplied,
            discountType: jntCargoDiscountFields.discountType,
            discountValue: jntCargoDiscountFields.discountValue,
            discountAmount: jntCargoDiscountFields.discountAmount,
          });
        });
      }

      return options;
    }

    // Fallback: Handle single API response (for backward compatibility)
    if (
      apiResult &&
      apiResult.status === "success" &&
      apiResult.data &&
      "content" in apiResult.data &&
      typeof apiResult.data.content === "string"
    ) {
      try {
        const contentArr = JSON.parse(apiResult.data.content) as Array<{
          cost: string;
          name: string;
          productType: string;
        }>;

        if (Array.isArray(contentArr) && contentArr.length > 0) {
          const options = contentArr.map((item, index) => ({
            id: `jnt-${item.productType.toLowerCase()}`,
            name: `J&T ${item.name}`,
            logo: "/images/jnt.png",
            price: `Rp${Number(item.cost).toLocaleString("id-ID")}`,
            duration: "1-3 Hari",
            available: true,
            recommended: index === 0,
            tags: [{ label: "Potensi retur Rendah", type: "success" as const }],
          }));
          return options;
        }
      } catch (error) {
        console.error(
          "❌ CalculationResults - Error parsing shipping options:",
          error
        );
        return [];
      }
    }

    return [];
  }, [result]);

  const selectedShippingOption = shippingOptions.find(
    (option) => option.id === selectedOption
  );

  const filteredShippingOptions =
    activeCategory === "all"
      ? shippingOptions
      : shippingOptions.filter(
          (o) => getServiceCategory(o.id, vendorGroupMap) === activeCategory
        );

  // Laporkan layanan terpilih (nama + ongkir, sudah memperhitungkan diskon
  // kalau ada — `price` BE selalu final_cost, sudah termasuk diskon/flat
  // ongkir) ke parent — dipakai kartu "Ringkasan Pengiriman" di halaman.
  useEffect(() => {
    if (!onSelectedOptionChange) return;
    if (!selectedShippingOption) {
      onSelectedOptionChange(null);
      return;
    }
    onSelectedOptionChange({
      name: selectedShippingOption.name,
      price: selectedShippingOption.price,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShippingOption]);

  function isApiErrorResult(obj: unknown): obj is ApiErrorResult {
    return (
      !!obj &&
      typeof obj === "object" &&
      "error" in obj &&
      (obj as Record<string, unknown>)["error"] === true
    );
  }

  if (result && isApiErrorResult(result)) {
    return (
      <div className="p-4 text-red-600">
        {result.message || "Gagal cek ongkir"}
      </div>
    );
  }

  // Handle error responses and invalid data
  if (!isSearching && !shippingOptions.length && result) {
    // Check if result is an error response
    if (typeof result === "object" && result !== null) {
      // Handle API error responses
      if ("error" in result || "message" in result) {
        const errorMessage = String(
          (result as Record<string, unknown>).message ||
            (result as Record<string, unknown>).error ||
            "Terjadi kesalahan pada server"
        );
        return (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-600 mb-2">
              <span className="text-lg">⚠️</span>
              <span className="font-medium">Gagal memuat opsi pengiriman</span>
            </div>
            <p className="text-red-700 text-sm">{errorMessage}</p>
            <p className="text-red-600 text-xs mt-2">
              Silakan coba lagi atau hubungi support jika masalah berlanjut.
            </p>
          </div>
        );
      }

      // Handle empty or invalid response structure
      if (Object.keys(result).length === 0) {
        return (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 text-yellow-600 mb-2">
              <span className="text-lg">ℹ️</span>
              <span className="font-medium">
                Tidak ada opsi pengiriman tersedia
              </span>
            </div>
            <p className="text-yellow-700 text-sm">
              Untuk rute pengiriman ini belum tersedia layanan ekspedisi.
            </p>
            <p className="text-yellow-600 text-xs mt-2">
              Coba ubah alamat pengirim atau tujuan pengiriman.
            </p>
          </div>
        );
      }
    }

    // Fallback: Show raw data for debugging (only in development)
    if (process.env.NODE_ENV === "development") {
      return (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-2 text-gray-600 mb-2">
            <span className="text-lg">🔍</span>
            <span className="font-medium">Debug: Response Data</span>
          </div>
          <p className="text-gray-700 text-sm mb-2">
            Tidak ada opsi pengiriman ditemukan dari response berikut:
          </p>
          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      );
    }

    // Production fallback
    return (
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-2 text-gray-600 mb-2">
          <span className="text-lg">ℹ️</span>
          <span className="font-medium">Tidak ada opsi pengiriman</span>
        </div>
        <p className="text-gray-700 text-sm">
          Untuk rute pengiriman ini belum tersedia layanan ekspedisi.
        </p>
      </div>
    );
  }

  if (!isSearching && !shippingOptions.length) {
    return null;
  }

  const handleShippingSelect = (optionId: string) => {
    // If clicking the same option, do nothing
    if (selectedOption === optionId) {
      return;
    }

    setSelectedOption(optionId);
    setShowPaymentSection(true);
  };

  const calculateTotal = () => {
    if (!selectedShippingOption) return 0;

    // `price` BE selalu final_cost (sudah termasuk diskon/flat ongkir).
    const shippingCost = parseInt(
      selectedShippingOption.price.replace(/[^\d]/g, "")
    );

    const itemValue = parseInt(formData?.itemValue || "0");
    const isCOD = formData?.paymentMethod === "cod";

    // COD fee: 3% of item value
    const codFee = isCOD ? Math.round(itemValue * 0.03) : 0;

    // Insurance: 0.5% of item value when checked
    const insuranceCost = isInsured ? Math.round(itemValue * 0.005) : 0;

    if (isCOD) {
      // For COD: User pays COD fee (3%) only
      // Shipment cost and insurance are paid by recipient, not included in total
      return codFee;
    } else {
      // For non-COD: User pays shipping cost + insurance only
      // (Item value is paid directly to seller, not through shipping)
      return shippingCost + insuranceCost;
    }
  };

  const getItemValue = () => {
    return parseInt(formData?.itemValue || "0");
  };

  const getCODFee = () => {
    const itemValue = getItemValue();
    const isCOD = formData?.paymentMethod === "cod";
    // COD fee: 3% of item value
    return isCOD ? Math.round(itemValue * 0.03) : 0;
  };

  const getInsuranceCost = () => {
    const itemValue = getItemValue();
    // Insurance: 0.5% of item value when checked
    return isInsured ? Math.round(itemValue * 0.005) : 0;
  };

  // Build shipping data for payment - standardized format for all vendors
  const buildShippingData = () => {
    if (
      !selectedShippingOption ||
      !formData?.formData ||
      !formData?.businessData
    ) {
      return null;
    }

    // Calculate COD value - if COD method selected, cod = item_value
    let codValue = 0;
    if (formData.formData.paymentMethod === "cod") {
      // COD value should equal item_value when COD method is selected
      const itemValue = getItemValue();
      codValue = itemValue;
    }

    // Calculate insurance value for API
    // API expects 1 if insurance is selected, 0 if not
    const insuranceValue = isInsured ? 1 : 0;

    // Get weight in kg (convert from grams)
    const weightInKg = parseInt(formData.formData.weight || "0") / 1000;

    // Get quantity
    const qty = parseInt(formData.formData.itemQuantity || "1");

    // Get item value
    const itemValue = parseInt(formData.formData.itemValue || "0");

    // Get goods description
    const goodsDesc = formData.formData.itemContent || "General Goods";

    // Get instruction/notes
    const instruction = formData.formData.notes || "Tolong hati-hati";

    // Determine pickup status - use utility function for consistency
    const pickup = deliveryTypeToPickup(formData.formData.deliveryType);

    // Build receiver object - always send receiver object (not receiver_id) as per documentation
    // Backend will create receiver if it doesn't exist
    const receiverFormData = formData.formData;
    
    if (!receiverFormData.receiverName || !receiverFormData.receiverPhone || !receiverFormData.receiverAddress) {
      toast.error(
        "Data penerima tidak lengkap. Silakan lengkapi nama, nomor telepon, dan alamat penerima."
      );
      return null;
    }
    // Validate province, regency, and district are available (check for empty strings too)
    if (
      !receiverFormData.province || 
      receiverFormData.province.trim() === "" ||
      !receiverFormData.regency || 
      receiverFormData.regency.trim() === "" ||
      !receiverFormData.district || 
      receiverFormData.district.trim() === ""
    ) {
      toast.error(
        "Data lokasi penerima tidak lengkap. Silakan pilih provinsi, kota, dan kecamatan penerima."
      );
      return null;
    }

    // Build receiver object according to documentation format
    const receiver: {
      name: string;
      phone: string;
      email?: string;
      address: string;
      province: string;
      regency: string;
      district: string;
      postal_code?: string;
      latitude?: number;
      longitude?: number;
    } = {
      name: receiverFormData.receiverName,
      phone: receiverFormData.receiverPhone,
      address: receiverFormData.receiverAddress,
      province: receiverFormData.province,
      regency: receiverFormData.regency,
      district: receiverFormData.district,
    };

    // Add optional fields if available
    if (receiverFormData.postal_code && receiverFormData.postal_code.trim() !== "") {
      receiver.postal_code = receiverFormData.postal_code;
    }

    // Determine vendor from selectedOption or selectedShippingOption.id
    const optionId = selectedOption || selectedShippingOption?.id || "";
    let vendor = "jntexpress"; // Default vendor

    if (optionId.startsWith("paxel")) {
      vendor = "paxel";
    } else if (optionId.startsWith("lion")) {
      vendor = "lion";
    } else if (optionId.startsWith("sap")) {
      vendor = "sap";
    } else if (optionId.startsWith("posindonesia")) {
      vendor = "posindonesia";
    } else if (optionId.startsWith("jne")) {
      vendor = "jne";
    } else if (optionId.startsWith("idexpress")) {
      vendor = "idexpress";
    } else if (optionId.startsWith("anteraja")) {
      vendor = "anteraja";
    } else if (optionId.startsWith("ninja")) {
      vendor = "ninja";
    } else if (optionId.startsWith("jnt")) {
      vendor = "jntexpress";
    }

    // Get sender data from businessData
    const senderData = formData.businessData;
    
    // Build sender object with latitude and longitude if available
    const sender: {
      name: string;
      phone: string;
      email?: string;
      address: string;
      province: string;
      regency: string;
      district: string;
      postal_code?: string;
      latitude?: number;
      longitude?: number;
    } = {
      name: senderData.senderName || senderData.businessName || "",
      phone: senderData.contact || "",
      address: senderData.address || "",
      province: senderData.province || "",
      regency: senderData.regency || "",
      district: senderData.district || "",
    };

    // Add optional fields if available
    if (senderData.postal_code && senderData.postal_code.trim() !== "") {
      sender.postal_code = senderData.postal_code;
    }
    if (formData.senderLatitude !== null && formData.senderLatitude !== undefined) {
      sender.latitude = formData.senderLatitude;
    }
    if (formData.senderLongitude !== null && formData.senderLongitude !== undefined) {
      sender.longitude = formData.senderLongitude;
    }

    // Get dimensions from formData (in cm)
    const length = parseInt(formData.formData.length || "0");
    const width = parseInt(formData.formData.width || "0");
    const height = parseInt(formData.formData.height || "0");

    // Get item type/category
    const itemType = formData.formData.itemType || "";

    // Build standardized order data format according to documentation
    // Format: { vendor, sender, receiver, pickup, serviceType, detail }
    // Detail includes: weight, qty, item_value, cod, goods_desc, category (optional), insurance, instruction, panjang (optional), lebar (optional), tinggi (optional)
    const shippingData: {
      vendor: string;
      sender: typeof sender;
      receiver: typeof receiver;
      pickup: boolean;
      serviceType?: string;
      detail: {
        weight: number;
        qty: number;
        item_value: number;
        cod: number;
        goods_desc: string;
        category?: string;
        insurance: number;
        instruction: string;
        panjang?: number;
        lebar?: number;
        tinggi?: number;
      };
    } = {
      vendor: vendor,
      sender: sender,
      receiver: receiver,
      pickup: pickup,
      serviceType: formData.formData.paymentMethod === "cod" ? "COD" : "REGULER",
      detail: {
        weight: weightInKg,
        qty: qty,
        item_value: itemValue,
        cod: codValue,
        goods_desc: goodsDesc,
        insurance: insuranceValue,
        instruction: instruction,
      },
    };

    // Add optional fields to detail if available
    if (itemType) {
      shippingData.detail.category = itemType.toUpperCase();
    }
    if (length > 0) {
      shippingData.detail.panjang = length;
    }
    if (width > 0) {
      shippingData.detail.lebar = width;
    }
    if (height > 0) {
      shippingData.detail.tinggi = height;
    }

    return shippingData;
  };

  const handleSubmitOrder = async () => {
    if (
      !selectedShippingOption ||
      !formData?.formData ||
      !formData?.businessData
    ) {
      const missingData = {
        selectedShippingOption: !!selectedShippingOption,
        formData: !!formData?.formData,
        businessData: !!formData?.businessData,
      };

      console.error(
        "❌ CalculationResults - Missing required data:",
        missingData
      );
      toast.error("Data tidak lengkap untuk melakukan order");
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const shippingData = buildShippingData();
      if (!shippingData) {
        toast.error("Gagal membangun data pengiriman");
        return;
      }

      // Satu endpoint untuk semua kombinasi akun/metode bayar - BE yang
      // menentukan status order lewat resolvePaymentPlan(): COD diproses
      // langsung ke vendor (awb_no terisi), non-COD (personal maupun
      // corporate) disimpan untuk direview di halaman Pembayaran Paket
      // (awb_no kosong). Tidak ada pembayaran di halaman ini.
      const response = await createOrder(shippingData.vendor, {
        shipping_data: shippingData,
        amount: isCOD ? 0 : calculateTotal(),
      });

      if (response.success && response.data) {
        handleOrderSaved(response.data);
      } else {
        toast.error(response.message || "Gagal menyimpan paket");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      if (error instanceof AxiosError) {
        const message = getAxiosErrorMessage(
          error,
          "Terjadi kesalahan saat membuat order"
        );
        const lower = message.toLowerCase();
        if (
          lower.includes("limit kredit") ||
          lower.includes("kerja sama") ||
          (lower.includes("akun") && lower.includes("nonaktif")) ||
          // Personal tanpa rekening bank approved coba order COD — lihat
          // docs/be-fe/update-cod-butuh-rekening-bank-personal.md
          (lower.includes("cod") && lower.includes("rekening"))
        ) {
          // Order memang tidak dibuat sama sekali untuk kasus-kasus ini —
          // tidak ada jalur "bayar sekarang"/ganti metode bayar di sini.
          // Cukup tampilkan pesan dari BE apa adanya, lebih lama biar terbaca.
          toast.error(message, { duration: 8000 });
        } else {
          toast.error(message || "Terjadi kesalahan saat membuat order");
        }
      } else {
        toast.error("Terjadi kesalahan saat membuat order");
      }
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleOrderSaved = (order: {
    id: number;
    reference_no: string;
    status: string;
    awb_no: string | null;
  }) => {
    const processedNow = Boolean(order.awb_no);

    toast.success(
      processedNow
        ? "Pengiriman COD berhasil dibuat."
        : "Paket berhasil disimpan."
    );

    setOrderResult({
      success: true,
      message: processedNow
        ? "Pengiriman COD Anda sedang diproses. Detail pesanan tercantum di bawah."
        : isCorporate
          ? "Paket Anda sudah disimpan. Lanjutkan ke halaman Pembayaran Paket untuk diproses ke ekspedisi menggunakan limit kredit."
          : "Paket Anda sudah disimpan. Lanjutkan ke halaman Pembayaran Paket untuk melakukan pembayaran.",
      awb_no: order.awb_no ?? undefined,
      order_id: order.id,
      reference_no: order.reference_no,
      flow: processedNow ? "cod" : "payment",
    });

    setShowSuccessDialog(true);
  };

  const handleCreateNewOrder = () => {
    setShowSuccessDialog(false);
    onResetForm?.();
    router.push("/dashboard/paket/paket-reguler");
  };

  const handleGoToLaporanPengiriman = () => {
    setShowSuccessDialog(false);
    router.push("/dashboard/laporan/laporan-pengiriman");
  };

  // No payment flow needed - orders go directly to pending payment status

  return (
    <div className="animate-slide-up space-y-4">
      {shippingOptions.length > 0 && filteredShippingOptions.length === 0 && (
        <p className="py-8 text-center text-sm text-slate-500">
          Tidak ada layanan di kategori ini untuk rute yang dipilih.
        </p>
      )}

      {/* Shipping Options List */}
      {filteredShippingOptions.map((option) => {
        const groupEstimasi = resolveGroupEstimasi(
          option.id,
          vendorGroupFullMap
        );

        return (
        <Card
          key={`${option.id}-${selectedOption === option.id ? "selected" : "unselected"}`}
          className={`cursor-pointer rounded-xl transition-all duration-200 ${
            selectedOption === option.id
              ? "border-blue-500 bg-blue-50"
              : "border-slate-200 hover:border-slate-300"
          }`}
          onClick={() => handleShippingSelect(option.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Image
                  src={option.logo}
                  alt={option.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {option.name}
                  </h3>
                  <div className="flex items-center space-x-2">
                    {/* `option.price` selalu final_cost BE (sudah termasuk
                        diskon/flat ongkir) - tidak lagi tergantung seleksi,
                        jadi harga coret tampil langsung di semua opsi. */}
                    <span className="text-lg font-bold text-gray-900">
                      {option.price}
                    </span>
                    {option.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {option.originalPrice}
                      </span>
                    )}
                  </div>

                  {/* Flat ongkir menang mutlak atas diskon — lihat docs/be-fe/flat-ongkir-jawa-bali.md §2 */}
                  {option.flatRateApplied && (
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        <Tag className="h-3 w-3" aria-hidden />
                        Flat Ongkir
                        {option.flatRateName ? `: ${option.flatRateName}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Badge diskon tampil di semua opsi (bukan cuma yang
                      dipilih) - dibaca langsung dari respons cek ongkir awal,
                      tidak ada panggilan API terpisah lagi. */}
                  {option.discountApplied &&
                    option.discountType &&
                    option.discountValue != null && (
                      <div className="mt-1">
                        <DiscountBadge
                          discountType={option.discountType}
                          discountValue={option.discountValue}
                          discountAmount={option.discountAmount ?? 0}
                          showAmount={true}
                          className="text-xs"
                        />
                      </div>
                    )}
                  {option.tags && option.tags.length > 0 && (
                    <div className="flex space-x-1 mt-1">
                      {option.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`text-xs px-2 py-1 rounded ${
                            tag.type === "success"
                              ? "bg-green-100 text-green-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                {groupEstimasi ? (
                  <div className="space-y-0.5 text-xs text-gray-600">
                    <div>Kota: {groupEstimasi.kota}</div>
                    <div>Pulau: {groupEstimasi.pulau}</div>
                    <div>Luar Pulau: {groupEstimasi.luarPulau}</div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">
                    {option.duration}
                  </div>
                )}
                {option.recommended && (
                  <div className="text-xs text-green-600 font-medium">
                    Rekomendasi
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}

      {/* Payment & Summary Section */}
      {showPaymentSection && selectedShippingOption && (
        <div className="space-y-4 mt-6">
          {/* Insurance */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold mb-3">Asuransi</h3>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="insurance"
                  checked={isInsured}
                  onCheckedChange={(checked) => setIsInsured(checked === true)}
                />
                <label htmlFor="insurance" className="text-sm font-medium">
                  Asuransikan Kiriman Saya
                </label>
              </div>
            </CardContent>
          </Card>


          {/* Akun corporate (kerja sama): tidak ada pilihan metode bayar
              sama sekali — ongkir otomatis masuk ke limit kredit. */}
          {!isCOD && isCorporate && (
            <Card className="overflow-hidden border-indigo-200">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
                <div className="flex items-center gap-2 text-white">
                  <Handshake className="h-5 w-5" />
                  <h3 className="text-base font-semibold">
                    Customer Corporate
                  </h3>
                </div>
              </div>
              <CardContent className="space-y-4 p-4">
                <p className="text-sm text-gray-700">
                  Ongkir pengiriman ini{" "}
                  <span className="font-semibold text-indigo-600">
                    otomatis ditambahkan ke limit kredit
                  </span>{" "}
                  perusahaan Anda — tidak perlu bayar sekarang. Tagihan akan
                  dikirim lewat invoice bulanan sesuai kesepakatan.
                </p>

                {user?.credit && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-indigo-100 bg-indigo-50/60 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-indigo-700">
                        <CreditCard className="h-3.5 w-3.5" />
                        Limit Kredit
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        Rp
                        {Number(user.credit.credit_limit).toLocaleString(
                          "id-ID"
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg border border-amber-100 bg-amber-50/60 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-amber-700">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Outstanding Saat Ini
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        Rp
                        {Number(
                          user.credit.outstanding_balance
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>
                    <div className="rounded-lg border border-green-100 bg-green-50/60 p-3">
                      <div className="flex items-center gap-1.5 text-xs text-green-700">
                        <Wallet className="h-3.5 w-3.5" />
                        Setelah Order Ini
                      </div>
                      <p className="mt-1 text-sm font-semibold text-gray-900">
                        Rp
                        {(
                          Number(user.credit.outstanding_balance) +
                          calculateTotal()
                        ).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                )}

                {user?.credit && user.credit.kerja_sama_is_active === false && (
                  <div className="rounded-md bg-red-50 p-3 text-xs text-red-800">
                    Customer corporate Anda sedang nonaktif — order tidak bisa
                    diproses lewat limit kredit sampai diaktifkan kembali oleh
                    admin.
                  </div>
                )}
              </CardContent>
            </Card>
          )}


          {/* Payment Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Ekspedisi</span>
                  <span className="font-medium">
                    {selectedShippingOption.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Nilai Barang</span>
                  <span className="font-medium">
                    Rp{getItemValue().toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>
                    Pengiriman
                    {selectedShippingOption.flatRateApplied && (
                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                        <Tag className="h-3 w-3" aria-hidden />
                        Flat Ongkir
                      </span>
                    )}
                  </span>
                  <div className="text-right">
                    {selectedShippingOption.discountApplied ? (
                      <div className="space-y-1">
                        <div className="font-medium text-green-600">
                          {selectedShippingOption.price}
                        </div>
                        {selectedShippingOption.originalPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            {selectedShippingOption.originalPrice}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="font-medium">
                        {selectedShippingOption.price}
                      </span>
                    )}
                  </div>
                </div>

                {/* Show discount savings */}
                {selectedShippingOption.discountApplied && (
                  <div className="flex justify-between text-green-600">
                    <span className="text-sm">Hemat Diskon</span>
                    <span className="font-medium text-sm">
                      -Rp{" "}
                      {(
                        selectedShippingOption.discountAmount ?? 0
                      ).toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {isInsured && (
                  <div className="flex justify-between">
                    <span>Asuransi</span>
                    <span className="font-medium">
                      Rp{getInsuranceCost().toLocaleString("id-ID")}
                    </span>
                  </div>
                )}
                {formData?.paymentMethod === "cod" && (
                  <div className="flex justify-between">
                    <span>Biaya COD</span>
                    <span className="font-medium">
                      Rp{getCODFee().toLocaleString("id-ID")}
                    </span>
                  </div>
                )}

                <Separator />

                {/* COD specific sections */}
                {formData?.paymentMethod === "cod" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-blue-600 font-medium">
                        Ditagihkan penerima
                      </span>
                      <span className="font-medium text-blue-600">
                        Rp
                        {(
                          getItemValue() +
                          parseInt(
                            selectedShippingOption.price.replace(/[^\d]/g, "")
                          ) +
                          getCODFee() +
                          getInsuranceCost()
                        ).toLocaleString("id-ID")}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-600 font-medium">
                        Nilai Pencairan
                      </span>
                      <span className="font-medium text-green-600">
                        Rp{getItemValue().toLocaleString("id-ID")}
                      </span>
                    </div>
                    {/* Total Pembayaran untuk COD: tidak ada pembayaran */}
                    <div className="flex justify-between text-lg font-bold text-green-600 mt-2 pt-2 border-t">
                      <span>Total Pembayaran</span>
                      <span>Rp 0 (Tidak ada pembayaran)</span>
                    </div>
                  </>
                ) : isCorporate ? (
                  /* Corporate: tidak ada pembayaran di muka, masuk limit kredit */
                  <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2 text-lg font-bold text-indigo-700">
                    <span className="flex items-center gap-1.5 text-sm sm:text-base">
                      <Handshake className="h-4 w-4" />
                      Ditambahkan ke Limit Kredit
                    </span>
                    <span>Rp{calculateTotal().toLocaleString("id-ID")}</span>
                  </div>
                ) : (
                  /* Non-COD personal: belum ada pembayaran di halaman ini - baru ditagih saat direview di Pembayaran Paket */
                  <div className="flex justify-between text-lg font-bold text-blue-600">
                    <span>Total Biaya Kirim</span>
                    <span>Rp{calculateTotal().toLocaleString("id-ID")}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Terms and Submit */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-start space-x-2 mb-4">
                <Checkbox
                  id="terms"
                  checked={termsAccepted}
                  onCheckedChange={(checked) =>
                    setTermsAccepted(checked === true)
                  }
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Dengan klik &quot;Simpan Paket&quot; kamu menyetujui Syarat &
                  Ketentuan yang berlaku.
                </label>
              </div>

              <div className="flex space-x-3">
                <Button
                  className="w-full h-11 px-6 py-4 font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmitOrder}
                  disabled={!termsAccepted || isSubmittingOrder}
                >
                  {isSubmittingOrder ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <CirclePlus className="w-4 h-4" />
                      Simpan Paket
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {orderResult && (
            <Card
              className={`p-4 ${orderResult.success ? "bg-green-50" : "bg-red-50"}`}
            >
              <div className="flex items-center space-x-2">
                {orderResult.success ? (
                  <span className="text-green-600">✅</span>
                ) : (
                  <span className="text-red-600">❌</span>
                )}
                <span className="text-sm font-medium">
                  {orderResult.message}
                </span>
                {orderResult.awb_no && (
                  <span className="text-sm text-gray-600">
                    AWB: {orderResult.awb_no}
                  </span>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader className="items-center text-center">
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full ${
                orderResult?.flow === "cod"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              {orderResult?.flow === "cod" ? (
                <Truck className="h-8 w-8" aria-hidden />
              ) : (
                <PackageCheck className="h-8 w-8" aria-hidden />
              )}
            </span>
            <DialogTitle className="text-xl font-bold text-slate-900">
              {orderResult?.flow === "cod"
                ? "Pengiriman Sedang Diproses"
                : "Paket Berhasil Disimpan!"}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              {orderResult?.flow === "cod"
                ? "Pesanan COD Anda sudah diterima ekspedisi dan sedang dalam pengiriman."
                : isCorporate
                  ? "Lanjutkan ke halaman Pembayaran Paket untuk memproses paket ini lewat limit kredit."
                  : "Lanjutkan ke halaman Pembayaran Paket untuk melakukan pembayaran."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 rounded-2xl border border-slate-100 bg-slate-50 p-4">
            {orderResult?.order_id && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Hash className="h-3.5 w-3.5" aria-hidden />
                  Order ID
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  #{orderResult.order_id}
                </span>
              </div>
            )}
            {orderResult?.reference_no && (
              <div className="flex items-center justify-between gap-3">
                <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500">
                  <ReceiptText className="h-3.5 w-3.5" aria-hidden />
                  Reference
                </span>
                <span className="break-all text-right text-sm font-semibold text-slate-900">
                  {orderResult.reference_no}
                </span>
              </div>
            )}
            {orderResult?.awb_no && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <Truck className="h-3.5 w-3.5" aria-hidden />
                  No. AWB
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {orderResult.awb_no}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-200 pt-2.5">
              <span className="text-xs font-medium text-slate-500">
                Status
              </span>
              {orderResult?.flow === "cod" ? (
                <StatusBadge status="success" label="Sedang Dikirim" />
              ) : (
                <StatusBadge
                  status="pending"
                  label={
                    isCorporate ? "Belum Diproses" : "Menunggu Pembayaran"
                  }
                />
              )}
            </div>
          </div>

          {orderResult?.flow === "cod" ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={handleCreateNewOrder}
                variant="outline"
                className="h-11 gap-2 rounded-full border-slate-200 font-semibold"
              >
                <Package className="h-4 w-4 shrink-0" />
                Buat Paket Baru
              </Button>
              <Button
                type="button"
                onClick={handleGoToLaporanPengiriman}
                className="h-11 gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 font-semibold text-white hover:from-blue-600 hover:to-indigo-600"
              >
                <ClipboardList className="h-4 w-4 shrink-0" />
                Laporan Pengiriman
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Button
                type="button"
                onClick={() => {
                  setShowSuccessDialog(false);
                  router.push("/dashboard/paket/pembayaran-paket");
                }}
                className="h-11 gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 font-semibold text-white hover:from-blue-600 hover:to-indigo-600"
              >
                <CreditCard className="h-4 w-4" />
                {isCorporate ? "Lihat & Proses Paket" : "Lakukan Pembayaran"}
              </Button>

              <Button
                type="button"
                onClick={handleCreateNewOrder}
                variant="outline"
                className="h-11 gap-2 rounded-full border-slate-200 font-semibold"
              >
                <Package className="h-4 w-4" />
                Buat Paket Baru
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
