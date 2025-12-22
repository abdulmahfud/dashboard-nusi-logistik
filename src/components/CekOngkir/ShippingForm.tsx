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
import React, { useState, useEffect } from "react";
import { getProvinces, getRegencies, getDistricts } from "@/lib/apiClient";
import type { Province, Regency, District } from "@/types/dataRegulerForm";
import {
  getJntExpressShipmentCost,
  getPaxelShipmentCost,
  getLionShipmentCost,
  getSapShipmentCost,
  getPosIndonesiaShipmentCost,
  getJneShipmentCost,
  getIdexpressShipmentCost,
  getAnterajaShipmentCost,
} from "@/lib/apiClient";

interface ShippingFormProps {
  onResult?: (result: Record<string, unknown>) => void;
  setIsSearching?: (isSearching: boolean) => void;
}

export default function ShippingForm({
  onResult,
  setIsSearching,
}: ShippingFormProps) {
  // State untuk dropdown pencarian
  const [originProvinceOptions, setOriginProvinceOptions] = useState<
    Province[]
  >([]);
  const [originRegencyOptions, setOriginRegencyOptions] = useState<Regency[]>(
    []
  );
  const [originDistrictOptions, setOriginDistrictOptions] = useState<
    District[]
  >([]);
  const [destProvinceOptions, setDestProvinceOptions] = useState<Province[]>(
    []
  );
  const [destRegencyOptions, setDestRegencyOptions] = useState<Regency[]>([]);
  const [destDistrictOptions, setDestDistrictOptions] = useState<District[]>(
    []
  );

  // State untuk pencarian input
  const [originProvinceSearch, setOriginProvinceSearch] = useState("");
  const [originRegencySearch, setOriginRegencySearch] = useState("");
  const [originDistrictSearch, setOriginDistrictSearch] = useState("");
  const [destProvinceSearch, setDestProvinceSearch] = useState("");
  const [destRegencySearch, setDestRegencySearch] = useState("");
  const [destDistrictSearch, setDestDistrictSearch] = useState("");

  // State untuk loading
  const [loadingOriginProvince, setLoadingOriginProvince] = useState(false);
  const [loadingOriginRegency, setLoadingOriginRegency] = useState(false);
  const [loadingOriginDistrict, setLoadingOriginDistrict] = useState(false);
  const [loadingDestProvince, setLoadingDestProvince] = useState(false);
  const [loadingDestRegency, setLoadingDestRegency] = useState(false);
  const [loadingDestDistrict, setLoadingDestDistrict] = useState(false);

  // State untuk nama yang dipilih (untuk API)
  const [selectedOriginRegencyName, setSelectedOriginRegencyName] =
    useState("");
  const [selectedDestDistrictName, setSelectedDestDistrictName] = useState("");

  // State untuk nama yang dipilih (untuk API)
  // selectedOriginRegencyName dan selectedDestDistrictName sudah didefinisikan di atas

  const [formData, setFormData] = useState({
    originProvince: "",
    originRegency: "",
    originDistrict: "",
    destProvince: "",
    destRegency: "",
    destDistrict: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    paymentMethod: "non-cod",
    useInsurance: false,
  });

  // Origin Province search and fetch
  useEffect(() => {
    if (originProvinceSearch.length >= 3) {
      setLoadingOriginProvince(true);
      getProvinces().then((res) => {
        setOriginProvinceOptions(
          res.data.filter((prov) =>
            prov.name.toLowerCase().includes(originProvinceSearch.toLowerCase())
          )
        );
        setLoadingOriginProvince(false);
      });
    } else {
      setOriginProvinceOptions([]);
    }
  }, [originProvinceSearch]);

  // Origin Regency search and fetch
  useEffect(() => {
    if (formData.originProvince && originRegencySearch.length >= 3) {
      setLoadingOriginRegency(true);
      getRegencies(Number(formData.originProvince)).then((res) => {
        setOriginRegencyOptions(
          res.data.filter((reg) =>
            reg.name.toLowerCase().includes(originRegencySearch.toLowerCase())
          )
        );
        setLoadingOriginRegency(false);
      });
    } else {
      setOriginRegencyOptions([]);
    }
  }, [formData.originProvince, originRegencySearch]);

  // Origin District search and fetch
  useEffect(() => {
    if (formData.originRegency && originDistrictSearch.length >= 3) {
      setLoadingOriginDistrict(true);
      getDistricts(Number(formData.originRegency)).then((res) => {
        setOriginDistrictOptions(
          res.data.filter((dist) =>
            dist.name.toLowerCase().includes(originDistrictSearch.toLowerCase())
          )
        );
        setLoadingOriginDistrict(false);
      });
    } else {
      setOriginDistrictOptions([]);
    }
  }, [formData.originRegency, originDistrictSearch]);

  // Destination Province search and fetch
  useEffect(() => {
    if (destProvinceSearch.length >= 3) {
      setLoadingDestProvince(true);
      getProvinces().then((res) => {
        setDestProvinceOptions(
          res.data.filter((prov) =>
            prov.name.toLowerCase().includes(destProvinceSearch.toLowerCase())
          )
        );
        setLoadingDestProvince(false);
      });
    } else {
      setDestProvinceOptions([]);
    }
  }, [destProvinceSearch]);

  // Destination Regency search and fetch
  useEffect(() => {
    if (formData.destProvince && destRegencySearch.length >= 3) {
      setLoadingDestRegency(true);
      getRegencies(Number(formData.destProvince)).then((res) => {
        setDestRegencyOptions(
          res.data.filter((reg) =>
            reg.name.toLowerCase().includes(destRegencySearch.toLowerCase())
          )
        );
        setLoadingDestRegency(false);
      });
    } else {
      setDestRegencyOptions([]);
    }
  }, [formData.destProvince, destRegencySearch]);

  // Destination District search and fetch
  useEffect(() => {
    if (formData.destRegency && destDistrictSearch.length >= 3) {
      setLoadingDestDistrict(true);
      getDistricts(Number(formData.destRegency)).then((res) => {
        setDestDistrictOptions(
          res.data.filter((dist) =>
            dist.name.toLowerCase().includes(destDistrictSearch.toLowerCase())
          )
        );
        setLoadingDestDistrict(false);
      });
    } else {
      setDestDistrictOptions([]);
    }
  }, [formData.destRegency, destDistrictSearch]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setIsSearching) setIsSearching(true);

    // Validasi field wajib
    if (
      !formData.weight ||
      !selectedOriginRegencyName ||
      !selectedDestDistrictName
    ) {
      onResult?.({
        error: true,
        message: `Mohon lengkapi data berikut: ${!formData.weight ? "Berat" : ""} ${!selectedOriginRegencyName ? "Kota Asal" : ""} ${!selectedDestDistrictName ? "Kecamatan Tujuan" : ""}`,
      });
      if (setIsSearching) setIsSearching(false);
      return;
    }

    try {
      // Call all vendor APIs in parallel with simplified format
      const [jntResult, paxelResult, lionResult, sapResult, posIndonesiaResult, jneResult, idexpressResult, anterajaResult] = await Promise.allSettled([
        getJntExpressShipmentCost({
          origin_name: selectedOriginRegencyName,
          destination_name: selectedDestDistrictName,
          weight: formData.weight,
        }),
        getPaxelShipmentCost({
          origin_name: selectedOriginRegencyName,
          destination_name: selectedDestDistrictName,
          weight: formData.weight,
        }),
        getLionShipmentCost({
          origin_name: selectedOriginRegencyName,
          destination_name: selectedDestDistrictName,
          weight: formData.weight,
        }),
        getSapShipmentCost({
          origin_name: selectedOriginRegencyName,
          destination_name: selectedDestDistrictName,
          weight: formData.weight,
        }),
        getPosIndonesiaShipmentCost({
          origin_name: selectedOriginRegencyName,
          destination_name: selectedDestDistrictName,
          weight: formData.weight,
        }),
        getJneShipmentCost({
          origin_name: selectedOriginRegencyName,
          destination_name: selectedDestDistrictName,
          weight: formData.weight,
        }),
        getIdexpressShipmentCost({
          origin_name: selectedOriginRegencyName,
          destination_name: selectedDestDistrictName,
          weight: formData.weight,
        }),
        getAnterajaShipmentCost({
          origin_name: selectedOriginRegencyName,
          destination_name: selectedDestDistrictName,
          weight: formData.weight,
        }),
      ]);

      // Log errors for debugging
      if (paxelResult.status === "rejected") {
        console.error("❌ Paxel API Error:", paxelResult.reason);
        console.error("❌ Paxel Error Response:", paxelResult.reason?.response?.data);
      }
      if (jntResult.status === "rejected") {
        console.error("❌ JNT API Error:", jntResult.reason);
      }
      if (sapResult.status === "rejected") {
        console.error("❌ SAP API Error:", sapResult.reason);
        console.error("❌ SAP Error Response:", sapResult.reason?.response?.data);
      }
      if (posIndonesiaResult.status === "rejected") {
        console.error("❌ Pos Indonesia API Error:", posIndonesiaResult.reason);
        console.error("❌ Pos Indonesia Error Response:", posIndonesiaResult.reason?.response?.data);
      }
      if (jneResult.status === "rejected") {
        console.error("❌ JNE API Error:", jneResult.reason);
        console.error("❌ JNE Error Response:", jneResult.reason?.response?.data);
      }
      if (idexpressResult.status === "rejected") {
        console.error("❌ ID Express API Error:", idexpressResult.reason);
        console.error("❌ ID Express Error Response:", idexpressResult.reason?.response?.data);
      }
      if (anterajaResult.status === "rejected") {
        console.error("❌ Anteraja API Error:", anterajaResult.reason);
        console.error("❌ Anteraja Error Response:", anterajaResult.reason?.response?.data);
      }

      // Combine results from all APIs with better error handling
      const combinedResult = {
        status: "success",
        data: {
          jnt: jntResult.status === "fulfilled" ? jntResult.value : null,
          paxel: paxelResult.status === "fulfilled" ? paxelResult.value : null,
          lion: lionResult.status === "fulfilled" ? lionResult.value : null,
          sap: sapResult.status === "fulfilled" ? sapResult.value : null,
          posindonesia: posIndonesiaResult.status === "fulfilled" ? posIndonesiaResult.value : null,
          jne: jneResult.status === "fulfilled" ? jneResult.value : null,
          idexpress: idexpressResult.status === "fulfilled" ? idexpressResult.value : null,
          anteraja: anterajaResult.status === "fulfilled" ? anterajaResult.value : null,
        },
      };

      onResult?.(combinedResult);
    } catch (err) {
      console.error("API Error:", err);
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

            {/* Origin Province */}
            <div className="relative">
              <Label htmlFor="originProvince" className="text-sm">
                Provinsi
              </Label>
              <Input
                id="originProvince"
                placeholder="Cari provinsi asal..."
                value={originProvinceSearch}
                onChange={(e) => {
                  setOriginProvinceSearch(e.target.value);
                  handleChange("originProvince", "");
                  handleChange("originRegency", "");
                  handleChange("originDistrict", "");
                  setSelectedOriginRegencyName("");
                }}
                autoComplete="off"
                className="bg-white"
              />
              {originProvinceSearch.length >= 3 && !formData.originProvince && (
                <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                  {loadingOriginProvince ? (
                    <div className="p-2 text-sm text-gray-500">Loading...</div>
                  ) : originProvinceOptions.length > 0 ? (
                    originProvinceOptions.map((prov) => (
                      <div
                        key={prov.id}
                        className="p-2 hover:bg-blue-100 cursor-pointer"
                        onClick={() => {
                          handleChange("originProvince", String(prov.id));
                          setOriginProvinceSearch(prov.name);
                          setOriginRegencySearch("");
                          setOriginDistrictSearch("");
                          setSelectedOriginRegencyName("");
                        }}
                      >
                        {prov.name}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      Tidak ada hasil
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Origin Regency */}
            <div className="relative">
              <Label htmlFor="originRegency" className="text-sm">
                Kota/Kabupaten
              </Label>
              <Input
                id="originRegency"
                placeholder="Cari kota/kabupaten asal..."
                value={originRegencySearch}
                onChange={(e) => {
                  setOriginRegencySearch(e.target.value);
                  handleChange("originRegency", "");
                  handleChange("originDistrict", "");
                  setSelectedOriginRegencyName("");
                }}
                disabled={!formData.originProvince}
                autoComplete="off"
                className="bg-white"
              />
              {formData.originProvince &&
                originRegencySearch.length >= 3 &&
                !formData.originRegency && (
                  <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                    {loadingOriginRegency ? (
                      <div className="p-2 text-sm text-gray-500">
                        Loading...
                      </div>
                    ) : originRegencyOptions.length > 0 ? (
                      originRegencyOptions.map((reg) => (
                        <div
                          key={reg.id}
                          className="p-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => {
                            handleChange("originRegency", String(reg.id));
                            setOriginRegencySearch(reg.name);
                            setOriginDistrictSearch("");
                            setSelectedOriginRegencyName(reg.name);
                          }}
                        >
                          {reg.name}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
                        Tidak ada hasil
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Origin District */}
            <div className="relative">
              <Label htmlFor="originDistrict" className="text-sm">
                Kecamatan
              </Label>
              <Input
                id="originDistrict"
                placeholder="Cari kecamatan asal..."
                value={originDistrictSearch}
                onChange={(e) => {
                  setOriginDistrictSearch(e.target.value);
                  handleChange("originDistrict", "");
                }}
                disabled={!formData.originRegency}
                autoComplete="off"
                className="bg-white"
              />
              {formData.originRegency &&
                originDistrictSearch.length >= 3 &&
                !formData.originDistrict && (
                  <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                    {loadingOriginDistrict ? (
                      <div className="p-2 text-sm text-gray-500">
                        Loading...
                      </div>
                    ) : originDistrictOptions.length > 0 ? (
                      originDistrictOptions.map((dist) => (
                        <div
                          key={dist.id}
                          className="p-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => {
                            handleChange("originDistrict", String(dist.id));
                            setOriginDistrictSearch(dist.name);
                          }}
                        >
                          {dist.name}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
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

            {/* Destination Province */}
            <div className="relative">
              <Label htmlFor="destProvince" className="text-sm">
                Provinsi
              </Label>
              <Input
                id="destProvince"
                placeholder="Cari provinsi tujuan..."
                value={destProvinceSearch}
                onChange={(e) => {
                  setDestProvinceSearch(e.target.value);
                  handleChange("destProvince", "");
                  handleChange("destRegency", "");
                  handleChange("destDistrict", "");
                  setSelectedDestDistrictName("");
                }}
                autoComplete="off"
                className="bg-white"
              />
              {destProvinceSearch.length >= 3 && !formData.destProvince && (
                <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                  {loadingDestProvince ? (
                    <div className="p-2 text-sm text-gray-500">Loading...</div>
                  ) : destProvinceOptions.length > 0 ? (
                    destProvinceOptions.map((prov) => (
                      <div
                        key={prov.id}
                        className="p-2 hover:bg-blue-100 cursor-pointer"
                        onClick={() => {
                          handleChange("destProvince", String(prov.id));
                          setDestProvinceSearch(prov.name);
                          setDestRegencySearch("");
                          setDestDistrictSearch("");
                        }}
                      >
                        {prov.name}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-gray-500">
                      Tidak ada hasil
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Destination Regency */}
            <div className="relative">
              <Label htmlFor="destRegency" className="text-sm">
                Kota/Kabupaten
              </Label>
              <Input
                id="destRegency"
                placeholder="Cari kota/kabupaten tujuan..."
                value={destRegencySearch}
                onChange={(e) => {
                  setDestRegencySearch(e.target.value);
                  handleChange("destRegency", "");
                  handleChange("destDistrict", "");
                  setSelectedDestDistrictName("");
                }}
                disabled={!formData.destProvince}
                autoComplete="off"
                className="bg-white"
              />
              {formData.destProvince &&
                destRegencySearch.length >= 3 &&
                !formData.destRegency && (
                  <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                    {loadingDestRegency ? (
                      <div className="p-2 text-sm text-gray-500">
                        Loading...
                      </div>
                    ) : destRegencyOptions.length > 0 ? (
                      destRegencyOptions.map((reg) => (
                        <div
                          key={reg.id}
                          className="p-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => {
                            handleChange("destRegency", String(reg.id));
                            setDestRegencySearch(reg.name);
                            setDestDistrictSearch("");
                          }}
                        >
                          {reg.name}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
                        Tidak ada hasil
                      </div>
                    )}
                  </div>
                )}
            </div>

            {/* Destination District */}
            <div className="relative">
              <Label htmlFor="destDistrict" className="text-sm">
                Kecamatan
              </Label>
              <Input
                id="destDistrict"
                placeholder="Cari kecamatan tujuan..."
                value={destDistrictSearch}
                onChange={(e) => {
                  setDestDistrictSearch(e.target.value);
                  handleChange("destDistrict", "");
                  setSelectedDestDistrictName("");
                }}
                disabled={!formData.destRegency}
                autoComplete="off"
                className="bg-white"
              />
              {formData.destRegency &&
                destDistrictSearch.length >= 3 &&
                !formData.destDistrict && (
                  <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                    {loadingDestDistrict ? (
                      <div className="p-2 text-sm text-gray-500">
                        Loading...
                      </div>
                    ) : destDistrictOptions.length > 0 ? (
                      destDistrictOptions.map((dist) => (
                        <div
                          key={dist.id}
                          className="p-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => {
                            handleChange("destDistrict", String(dist.id));
                            setDestDistrictSearch(dist.name);
                            setSelectedDestDistrictName(dist.name);
                          }}
                        >
                          {dist.name}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
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
                type="number"
                placeholder="Cth : 1000"
                value={formData.weight}
                onChange={(e) => handleChange("weight", e.target.value)}
                className="bg-white pr-16"
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
