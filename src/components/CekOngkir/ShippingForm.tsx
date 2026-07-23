import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import {
  getExpeditionVendorSettings,
  getJntExpressShipmentCost,
  getPaxelShipmentCost,
  getLionShipmentCost,
  getSapShipmentCost,
  getPosIndonesiaShipmentCost,
  getJneShipmentCost,
  getIdexpressShipmentCost,
  getAnterajaShipmentCost,
  getNinjaShipmentCost,
  getJntCargoShipmentCost,
  searchAddressNew,
} from "@/lib/apiClient";
import { notifyShipmentCost422Rejections } from "@/lib/shipment-cost-errors";

interface ShippingFormProps {
  onResult?: (result: Record<string, unknown>) => void;
  setIsSearching?: (isSearching: boolean) => void;
  onPaymentMethodChange?: (method: string) => void;
}

interface AddressResult {
  type: "postal_code" | "subdistrict";
  id: number;
  name: string | number;
  full_address: string;
  code?: number | null;
  province: string;
  regency: string;
  district: string;
  subdistrict: string;
  province_id: number;
  regency_id: number;
  district_id: number;
  subdistrict_id: number;
}

export default function ShippingForm({
  onResult,
  setIsSearching,
  onPaymentMethodChange,
}: ShippingFormProps) {
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [originResults, setOriginResults] = useState<AddressResult[]>([]);
  const [destResults, setDestResults] = useState<AddressResult[]>([]);
  const [loadingOrigin, setLoadingOrigin] = useState(false);
  const [loadingDest, setLoadingDest] = useState(false);
  const [showOriginResults, setShowOriginResults] = useState(false);
  const [showDestResults, setShowDestResults] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState<AddressResult | null>(
    null
  );
  const [selectedDest, setSelectedDest] = useState<AddressResult | null>(null);

  const [formData, setFormData] = useState({
    weight: "",
    length: "",
    width: "",
    height: "",
    paymentMethod: "non-cod",
    useInsurance: false,
  });

  const originInputRef = useRef<HTMLDivElement>(null);
  const destInputRef = useRef<HTMLDivElement>(null);
  const normalizeVendorKey = (vendor: string): string =>
    vendor.toLowerCase().replace(/[\s_-]/g, "");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        originInputRef.current &&
        !originInputRef.current.contains(event.target as Node)
      ) {
        setShowOriginResults(false);
      }
      if (
        destInputRef.current &&
        !destInputRef.current.contains(event.target as Node)
      ) {
        setShowDestResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search origin address
  useEffect(() => {
    if (originQuery.length >= 3) {
      setLoadingOrigin(true);
      const timeoutId = setTimeout(() => {
        searchAddressNew(originQuery)
          .then((response) => {
            setOriginResults(response.results);
            setShowOriginResults(true);
          })
          .catch((error) => {
            console.error("Error searching origin address:", error);
            setOriginResults([]);
          })
          .finally(() => {
            setLoadingOrigin(false);
          });
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setOriginResults([]);
      setShowOriginResults(false);
    }
  }, [originQuery]);

  // Search destination address
  useEffect(() => {
    if (destQuery.length >= 3) {
      setLoadingDest(true);
      const timeoutId = setTimeout(() => {
        searchAddressNew(destQuery)
          .then((response) => {
            setDestResults(response.results);
            setShowDestResults(true);
          })
          .catch((error) => {
            console.error("Error searching destination address:", error);
            setDestResults([]);
          })
          .finally(() => {
            setLoadingDest(false);
          });
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setDestResults([]);
      setShowDestResults(false);
    }
  }, [destQuery]);

  // Helper function untuk format angka dengan titik pemisah ribuan (format Indonesia)
  const formatNumber = (value: string): string => {
    // Hapus semua karakter non-digit
    const numericValue = value.replace(/\D/g, "");
    if (!numericValue) return "";
    // Format dengan titik pemisah ribuan
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Helper function untuk menghapus format (mendapatkan nilai numerik)
  const removeFormat = (value: string): string => {
    return value.replace(/\./g, "");
  };

  const handleChange = (field: string, value: string | boolean) => {
    // Jika field adalah weight, format dengan titik pemisah ribuan
    if (field === "weight" && typeof value === "string") {
      const formattedValue = formatNumber(value);
      setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

    if (field === "paymentMethod" && typeof value === "string") {
      onPaymentMethodChange?.(value);
    }
  };

  const handleSelectOrigin = (result: AddressResult) => {
    setSelectedOrigin(result);
    setOriginQuery(result.full_address);
    setShowOriginResults(false);
  };

  const handleSelectDest = (result: AddressResult) => {
    setSelectedDest(result);
    setDestQuery(result.full_address);
    setShowDestResults(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setIsSearching) setIsSearching(true);

    // Validasi field wajib
    if (!formData.weight || !selectedOrigin || !selectedDest) {
      const missingFields = [];
      if (!formData.weight) missingFields.push("Berat");
      if (!selectedOrigin) missingFields.push("Alamat Asal");
      if (!selectedDest) missingFields.push("Alamat Tujuan");

      onResult?.({
        error: true,
        message: `Mohon lengkapi data berikut: ${missingFields.join(", ")}`,
      });
      if (setIsSearching) setIsSearching(false);
      return;
    }

    try {
      const vendorSettingsResponse = await getExpeditionVendorSettings();
      const vendorSettings = Array.isArray(vendorSettingsResponse.data)
        ? vendorSettingsResponse.data
        : [];
      const isCodOrder = formData.paymentMethod === "cod";

      const allowedVendors = new Set(
        vendorSettings
          .filter(
            (item) => item.is_active && (!isCodOrder || item.is_cod_active)
          )
          .map((item) => normalizeVendorKey(item.vendor))
      );

      if (isCodOrder && allowedVendors.size === 0) {
        onResult?.({
          error: true,
          message: "Saat ini tidak ada ekspedisi yang mendukung COD.",
        });
        if (setIsSearching) setIsSearching(false);
        return;
      }

      if (!isCodOrder && allowedVendors.size === 0) {
        onResult?.({
          error: true,
          message: "Saat ini tidak ada ekspedisi yang aktif.",
        });
        if (setIsSearching) setIsSearching(false);
        return;
      }

      // Prepare common payload for all APIs
      // Hapus format titik dari weight dan konversi dari gram ke kilogram
      const weightInGrams = removeFormat(formData.weight);
      const weightInKg = (Number(weightInGrams) / 1000).toString();
      
      const shipmentPayload = {
        origin_province: selectedOrigin.province.toUpperCase(),
        origin_regencie: selectedOrigin.regency.toUpperCase(),
        origin_district: selectedOrigin.district.toUpperCase(),
        destination_province: selectedDest.province.toUpperCase(),
        destination_regencie: selectedDest.regency.toUpperCase(),
        destination_district: selectedDest.district.toUpperCase(),
        weight: weightInKg,
      };

      // Call all vendor APIs in parallel
      const [
        jntResult,
        paxelResult,
        lionResult,
        sapResult,
        posIndonesiaResult,
        jneResult,
        idexpressResult,
        anterajaResult,
        ninjaResult,
        jntCargoResult,
      ] = await Promise.allSettled([
        allowedVendors.has("jntexpress")
          ? getJntExpressShipmentCost(shipmentPayload)
          : Promise.resolve(null),
        allowedVendors.has("paxel")
          ? getPaxelShipmentCost(shipmentPayload)
          : Promise.resolve(null),
        allowedVendors.has("lion")
          ? getLionShipmentCost(shipmentPayload)
          : Promise.resolve(null),
        allowedVendors.has("sap")
          ? getSapShipmentCost(shipmentPayload)
          : Promise.resolve(null),
        allowedVendors.has("posindonesia")
          ? getPosIndonesiaShipmentCost(shipmentPayload)
          : Promise.resolve(null),
        allowedVendors.has("jne")
          ? getJneShipmentCost(shipmentPayload)
          : Promise.resolve(null),
        allowedVendors.has("idexpress")
          ? getIdexpressShipmentCost(shipmentPayload)
          : Promise.resolve(null),
        allowedVendors.has("anteraja")
          ? getAnterajaShipmentCost(shipmentPayload)
          : Promise.resolve(null),
        allowedVendors.has("ninja")
          ? getNinjaShipmentCost(shipmentPayload)
          : Promise.resolve(null),
        allowedVendors.has("jntcargo")
          ? getJntCargoShipmentCost(shipmentPayload)
          : Promise.resolve(null),
      ]);

      notifyShipmentCost422Rejections([
        { label: "J&T Express", settled: jntResult },
        { label: "Paxel", settled: paxelResult },
        { label: "Lion Parcel", settled: lionResult },
        { label: "SAP", settled: sapResult },
        { label: "Pos Indonesia", settled: posIndonesiaResult },
        { label: "JNE", settled: jneResult },
        { label: "ID Express", settled: idexpressResult },
        { label: "Anteraja", settled: anterajaResult },
        { label: "Ninja", settled: ninjaResult },
        { label: "J&T Cargo", settled: jntCargoResult },
      ]);

      // Combine results from all APIs
      const combinedResult = {
        status: "success",
        data: {
          jnt: jntResult.status === "fulfilled" ? jntResult.value : null,
          paxel: paxelResult.status === "fulfilled" ? paxelResult.value : null,
          lion: lionResult.status === "fulfilled" ? lionResult.value : null,
          sap: sapResult.status === "fulfilled" ? sapResult.value : null,
          posindonesia:
            posIndonesiaResult.status === "fulfilled"
              ? posIndonesiaResult.value
              : null,
          jne: jneResult.status === "fulfilled" ? jneResult.value : null,
          idexpress:
            idexpressResult.status === "fulfilled"
              ? idexpressResult.value
              : null,
          anteraja:
            anterajaResult.status === "fulfilled" ? anterajaResult.value : null,
          ninja: ninjaResult.status === "fulfilled" ? ninjaResult.value : null,
          jntcargo:
            jntCargoResult.status === "fulfilled" ? jntCargoResult.value : null,
        },
      };

      onResult?.(combinedResult);
    } catch (err) {
      const errorResult = {
        error: true,
        message:
          err && typeof err === "object" && "message" in err
            ? (err as { message?: string }).message || "Gagal cek ongkir"
            : "Gagal cek ongkir",
      };

      onResult?.(errorResult);
    } finally {
      if (setIsSearching) setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-slide-down">
      <Card className="shadow-sm">
        <CardHeader className="p-3 mt-3 ml-3">
          <CardTitle className="text-lg font-semibold">
            Tentukan Alamat
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Area Asal */}
          <div className="space-y-3">
            <Label className="text-shipping-label">
              Area Asal<span className="text-red-500">*</span>
            </Label>
            <div className="relative" ref={originInputRef}>
              <div className="relative">
                <Input
                  placeholder="Cari alamat asal (minimal 3 huruf)..."
                  value={originQuery}
                  onChange={(e) => {
                    setOriginQuery(e.target.value);
                    setSelectedOrigin(null);
                  }}
                  autoComplete="off"
                  className="bg-white pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {loadingOrigin ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {showOriginResults && originQuery.length >= 3 && (
                <div className="border rounded-md bg-white max-h-60 overflow-y-auto absolute z-20 w-full mt-1 shadow-lg">
                  {loadingOrigin ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Mencari...
                    </div>
                  ) : originResults.length > 0 ? (
                    originResults.map((result) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSelectOrigin(result)}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {result.full_address}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {result.province} → {result.regency} → {result.district}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Tidak ada hasil
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Area Tujuan */}
          <div className="space-y-3">
            <Label className="text-shipping-label">
              Area Tujuan<span className="text-red-500">*</span>
            </Label>
            <div className="relative" ref={destInputRef}>
              <div className="relative">
                <Input
                  placeholder="Cari alamat tujuan (minimal 3 huruf)..."
                  value={destQuery}
                  onChange={(e) => {
                    setDestQuery(e.target.value);
                    setSelectedDest(null);
                  }}
                  autoComplete="off"
                  className="bg-white pr-10"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {loadingDest ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  ) : (
                    <Search className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>
              {showDestResults && destQuery.length >= 3 && (
                <div className="border rounded-md bg-white max-h-60 overflow-y-auto absolute z-20 w-full mt-1 shadow-lg">
                  {loadingDest ? (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Mencari...
                    </div>
                  ) : destResults.length > 0 ? (
                    destResults.map((result) => (
                      <div
                        key={`${result.type}-${result.id}`}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSelectDest(result)}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {result.full_address}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {result.province} → {result.regency} → {result.district}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Tidak ada hasil
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="weight" className="text-shipping-label">
              Berat (gram)<span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="weight"
                type="text"
                placeholder="Cth : 1.000"
                value={formData.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                className="bg-white pr-16"
                inputMode="numeric"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-shipping-label">
                gram
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold">
              Data dimensi (opsional)
            </CardTitle>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="length" className="text-xs text-shipping-label">
                  Panjang
                </Label>
                <div className="relative">
                  <Input
                    id="length"
                    type="number"
                    placeholder="Cth : 10"
                    value={formData.length}
                    onChange={(e) => handleChange("length", e.target.value)}
                    className="bg-white pr-12 text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-shipping-label">
                    cm
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="width" className="text-xs text-shipping-label">
                  Lebar
                </Label>
                <div className="relative">
                  <Input
                    id="width"
                    type="number"
                    placeholder="Cth : 10"
                    value={formData.width}
                    onChange={(e) => handleChange("width", e.target.value)}
                    className="bg-white pr-12 text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-shipping-label">
                    cm
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="height" className="text-xs text-shipping-label">
                  Tinggi
                </Label>
                <div className="relative">
                  <Input
                    id="height"
                    type="number"
                    placeholder="Cth : 10"
                    value={formData.height}
                    onChange={(e) => handleChange("height", e.target.value)}
                    className="bg-white pr-12 text-sm"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-shipping-label">
                    cm
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-shipping-label">Metode Pembayaran</Label>
            <RadioGroup
              defaultValue="non-cod"
              value={formData.paymentMethod}
              onValueChange={(value) => handleChange("paymentMethod", value)}
              className="grid grid-cols-2 gap-3"
            >
              <Label
                htmlFor="payment-cod"
                className={cn(
                  "flex items-center justify-center border rounded-md py-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors",
                  formData.paymentMethod === "cod" &&
                    "border-blue-400 bg-blue-50"
                )}
              >
                <RadioGroupItem id="payment-cod" value="cod" className="mr-2" />
                COD (Cash On Delivery)
              </Label>
              <Label
                htmlFor="payment-non-cod"
                className={cn(
                  "flex items-center justify-center border rounded-md py-3 px-4 cursor-pointer hover:bg-gray-50 transition-colors",
                  formData.paymentMethod === "non-cod" &&
                    "border-blue-400 bg-blue-50"
                )}
              >
                <RadioGroupItem
                  id="payment-non-cod"
                  value="non-cod"
                  className="mr-2"
                />
                Non COD
              </Label>
            </RadioGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-700 text-white transition-all duration-300"
          >
            Cek Ongkos Kirim
          </Button>
        </CardFooter>
        <div className="mt-5 rounded-lg bg-yellow-300 border border-shipping-noteBorder bg-shipping-note p-4 animate-fade-in">
          <h4 className="font-medium mb-2">Catatan</h4>
          <ul className="list-disc list-inside text-sm space-y-1.5">
            <li>
              Cek ongkos kirim di halaman ini hanya untuk pengiriman reguler,{" "}
              <span className="font-medium">
                tidak termasuk layanan instant delivery.
              </span>
            </li>
            <li>
              Biaya COD sudah termasuk{" "}
              <span className="font-medium">PPN 11%</span>.
            </li>
          </ul>
        </div>
      </Card>
    </form>
  );
}
