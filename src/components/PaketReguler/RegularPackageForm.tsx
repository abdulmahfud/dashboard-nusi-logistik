"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyInput } from "@/components/ui/currency-input";
import { WeightInput } from "@/components/ui/weight-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  PenLine,
  Search,
  Send,
  User,
  CircleChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  getShippers,
  getReceivers,
  getProvinces,
  getRegencies,
  getDistricts,
  getJntExpressShipmentCost,
  getPaxelShipmentCost,
  getLionShipmentCost,
  getSapShipmentCost,
} from "@/lib/apiClient";
import type {
  Shipper,
  Receiver,
  Province,
  Regency,
  District,
} from "@/types/dataRegulerForm";
import { itemTypes } from "@/types/dataRegulerForm";

type ReceiverManual = {
  name: string;
  phone: string;
  address: string;
  province: string;
  regency: string;
  district: string;
};

type RegularPackagePayload = {
  receiver_id?: string;
  receiver?: ReceiverManual;
  receiverName?: string;
  receiverPhone?: string;
  province?: string;
  regency?: string;
  district?: string;
  receiverAddress?: string;
  itemContent?: string;
  itemType?: string;
  itemValue?: string;
  itemQuantity?: string;
  weight?: string;
  length?: string;
  width?: string;
  height?: string;
  notes?: string;
  deliveryType?: string;
  paymentMethod?: string;
  servicetype?: number; // Added servicetype
  [key: string]: string | number | boolean | ReceiverManual | undefined;
};

interface Business {
  id: number;
  businessName: string;
  senderName: string;
  contact: string;
  province: string | null;
  regency: string | null;
  district: string | null;
  address: string;
}

interface RegularPackageFormProps {
  onResult?: (result: Record<string, unknown>) => void;
  setIsSearching?: (isSearching: boolean) => void;
  onFormDataChange?: (data: {
    itemValue?: string;
    paymentMethod?: string;
    formData?: {
      receiverName: string;
      receiverPhone: string;
      province: string;
      regency: string;
      district: string;
      receiverAddress: string;
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
    businessData?: Business | null;
    receiverId?: string | null;
  }) => void;
}

export default function RegularPackageForm({
  onResult,
  setIsSearching,
  onFormDataChange,
}: RegularPackageFormProps) {
  const [businessData, setBusinessData] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [open, setOpen] = useState(false);
  const [openRecipient, setOpenRecipient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessRecipients, setBusinessRecipients] = useState<Receiver[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<Province[]>([]);
  const [regencyOptions, setRegencyOptions] = useState<Regency[]>([]);
  const [districtOptions, setDistrictOptions] = useState<District[]>([]);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [regencySearch, setRegencySearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [loadingProvince, setLoadingProvince] = useState(false);
  const [loadingRegency, setLoadingRegency] = useState(false);
  const [loadingDistrict, setLoadingDistrict] = useState(false);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [selectedDistrictName, setSelectedDistrictName] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    receiverName: "",
    receiverPhone: "",
    province: "",
    regency: "",
    district: "",
    receiverAddress: "",
    itemContent: "",
    itemType: "",
    itemValue: "",
    itemQuantity: "",
    weight: "",
    length: "",
    width: "",
    height: "",
    notes: "",
    deliveryType: "dropoff",
    paymentMethod: "cod",
  });

  // Loading state sekarang dikontrol parent

  useEffect(() => {
    getShippers().then((res) => {
      const mapped = res.data.data.map((shipper: Shipper) => ({
        id: shipper.id,
        businessName: shipper.name,
        senderName: shipper.contact || shipper.name,
        contact: shipper.phone,
        province: shipper.province,
        regency: shipper.regency,
        district: shipper.district,
        address: shipper.address,
      }));
      setBusinessData(mapped);
      setSelectedBusiness(mapped[0] || null);
    });

    getReceivers().then((res) => {
      setBusinessRecipients(res.data.data);
    });
  }, []);

  // Notify parent of initial form data
  useEffect(() => {
    if (onFormDataChange) {
      const notificationData = {
        itemValue: formData.itemValue,
        paymentMethod: formData.paymentMethod,
        formData: formData,
        businessData: selectedBusiness,
        receiverId: receiverId,
      };

      onFormDataChange(notificationData);
    }
  }, [formData, selectedBusiness, receiverId, onFormDataChange]);

  // Province search and fetch
  useEffect(() => {
    if (provinceSearch.length >= 3) {
      setLoadingProvince(true);
      getProvinces().then((res) => {
        setProvinceOptions(
          res.data.filter((prov) =>
            prov.name.toLowerCase().includes(provinceSearch.toLowerCase())
          )
        );
        setLoadingProvince(false);
      });
    } else {
      setProvinceOptions([]);
    }
  }, [provinceSearch]);

  // Regency search and fetch
  useEffect(() => {
    if (formData.province && regencySearch.length >= 3) {
      setLoadingRegency(true);
      getRegencies(Number(formData.province)).then((res) => {
        setRegencyOptions(
          res.data.filter((reg) =>
            reg.name.toLowerCase().includes(regencySearch.toLowerCase())
          )
        );
        setLoadingRegency(false);
      });
    } else {
      setRegencyOptions([]);
    }
  }, [formData.province, regencySearch]);

  // District search and fetch
  useEffect(() => {
    if (formData.regency && districtSearch.length >= 3) {
      setLoadingDistrict(true);
      getDistricts(Number(formData.regency)).then((res) => {
        setDistrictOptions(
          res.data.filter((dist) =>
            dist.name.toLowerCase().includes(districtSearch.toLowerCase())
          )
        );
        setLoadingDistrict(false);
      });
    } else {
      setDistrictOptions([]);
    }
  }, [formData.regency, districtSearch]);

  const handleSelectAddress = (business: Business) => {
    setSelectedBusiness(business);
    setOpen(false);
  };

  const validateField = (field: string, value: string): string => {
    if (!value || value.trim() === "") {
      return "Field ini wajib diisi";
    }

    switch (field) {
      case "receiverName":
        return value.length < 2 ? "Nama minimal 2 karakter" : "";
      case "receiverPhone":
        return !/^[0-9+\-\s()]{8,15}$/.test(value)
          ? "Nomor telepon tidak valid"
          : "";
      case "receiverAddress":
        return value.length < 10 ? "Alamat minimal 10 karakter" : "";
      case "itemContent":
        return value.length < 2 ? "Isi barang minimal 2 karakter" : "";
      case "itemType":
        return "";
      case "itemValue":
        return parseInt(value) < 1000 ? "Nilai barang minimal Rp 1.000" : "";
      case "itemQuantity":
        return parseInt(value) < 1 ? "Jumlah minimal 1" : "";
      case "weight":
        return parseInt(value) < 1 ? "Berat minimal 1 gram" : "";
      case "length":
      case "width":
      case "height":
        return parseInt(value) < 1 ? "Dimensi minimal 1 cm" : "";
      default:
        return "";
    }
  };

  const validateAllFields = (): boolean => {
    const requiredFields = [
      "receiverName",
      "receiverPhone",
      "receiverAddress",
      "itemContent",
      "itemType",
      "itemValue",
      "itemQuantity",
      "weight",
      "length",
      "width",
      "height",
    ];

    const newErrors: Record<string, string> = {};
    let hasErrors = false;

    // Check if using saved receiver but still need location validation
    if (!receiverId) {
      if (!formData.province) {
        newErrors.province = "Provinsi wajib dipilih";
        hasErrors = true;
      }
      if (!formData.regency) {
        newErrors.regency = "Kota/Kabupaten wajib dipilih";
        hasErrors = true;
      }
      if (!formData.district) {
        newErrors.district = "Kecamatan wajib dipilih";
        hasErrors = true;
      }
    }

    // Validate all required fields
    requiredFields.forEach((field) => {
      const value = formData[field as keyof typeof formData] || "";
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
        hasErrors = true;
      }
    });

    // Check if business is selected
    if (!selectedBusiness) {
      hasErrors = true;
      alert("Silakan pilih alamat pengirim terlebih dahulu");
    }

    setFormErrors(newErrors);
    return !hasErrors;
  };

  const handleChange = (field: string, value: string) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);

    // Validate field and update errors
    const error = validateField(field, value);
    setFormErrors((prev) => ({
      ...prev,
      [field]: error,
    }));

    // Notify parent of relevant form data changes
    if (
      (field === "itemValue" || field === "paymentMethod") &&
      onFormDataChange
    ) {
      const changeData = {
        itemValue: newData.itemValue,
        paymentMethod: newData.paymentMethod,
        formData: newData,
        businessData: selectedBusiness,
        receiverId: receiverId,
      };

      onFormDataChange(changeData);
    }

    // Jika user edit field penerima manual, reset receiverId
    if (["receiverName", "receiverPhone", "receiverAddress"].includes(field)) {
      setReceiverId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields first
    if (!validateAllFields()) {
      onResult?.({
        error: true,
        message: "Silakan lengkapi semua field yang wajib diisi",
      });
      return;
    }

    if (setIsSearching) setIsSearching(true);

    // Additional validation for location data
    const isUsingExistingReceiver = !!receiverId;
    const hasLocationData = isUsingExistingReceiver
      ? selectedDistrictName && selectedBusiness?.regency
      : selectedDistrictName && selectedBusiness?.regency && formData.district;

    if (!hasLocationData) {
      const errorMessage = isUsingExistingReceiver
        ? "Alamat pengirim dan tujuan wajib diisi."
        : "Alamat pengirim dan kecamatan tujuan wajib diisi.";

      onResult?.({
        error: true,
        message: errorMessage,
      });
      if (setIsSearching) setIsSearching(false);
      return;
    }

    // Siapkan payload
    let payload: RegularPackagePayload = {
      ...formData,
    };

    // Set servicetype sesuai deliveryType
    payload.servicetype = formData.deliveryType === "pickup" ? 1 : 6;

    if (receiverId) {
      payload = {
        ...payload,
        receiver_id: receiverId,
      };
      // Hapus data manual receiver agar backend tidak ambigu
      delete payload.receiverName;
      delete payload.receiverPhone;
      delete payload.province;
      delete payload.regency;
      delete payload.district;
      delete payload.receiverAddress;
    } else {
      // Kirim object receiver manual
      payload = {
        ...payload,
        receiver: {
          name: formData.receiverName,
          phone: formData.receiverPhone,
          address: formData.receiverAddress,
          province: formData.province,
          regency: formData.regency,
          district: formData.district,
        },
      };
    }

    // Ambil data untuk ongkir
    const weight = formData.weight;
    // Format baru: origin_name (regency) dan destination_name (district)
    const originName = selectedBusiness?.regency || "";
    const destinationName = selectedDistrictName;

    // Validate required parameters
    if (!weight || !originName || !destinationName) {
      const missingFields = [];
      if (!weight) missingFields.push("berat");
      if (!originName)
        missingFields.push(
          "kota pengirim (data alamat pengirim tidak lengkap)"
        );
      if (!destinationName) missingFields.push("kecamatan tujuan");

      const errorMessage = `Data tidak lengkap: ${missingFields.join(", ")} wajib diisi`;
      console.error("❌ RegularPackageForm - Missing required fields:", {
        weight,
        originName,
        destinationName,
        selectedBusiness,
        selectedDistrictName,
        missingFields,
      });

      onResult?.({
        error: true,
        message: errorMessage,
      });
      if (setIsSearching) setIsSearching(false);
      return;
    }

    try {
      // Determine destination name based on receiverId or formData
      let finalDestinationName = destinationName;
      let paxelDestinationName = formData.district || "";
      let lionDestinationName = `${formData.district}, ${formData.regency}`.trim();
      let sapDestinationName = formData.regency;

      // For saved recipients, we need to get the actual location names
      if (receiverId) {
        const selectedRecipient = businessRecipients.find(
          (r) => String(r.id) === receiverId
        );
        if (selectedRecipient) {
          finalDestinationName = selectedRecipient.district || "";
          paxelDestinationName = selectedRecipient.district || "";
          lionDestinationName = `${selectedRecipient.district || ""}, ${selectedRecipient.regency || ""}`.trim();
          sapDestinationName = selectedRecipient.regency || "";
        }
      }

      // Prepare Lion Parcel origin (format: "district, regency")
      const lionOriginName = `${selectedBusiness?.district || ""}, ${selectedBusiness?.regency || ""}`.trim();

      // Call all four APIs in parallel with simplified format
      const [jntResult, paxelResult, lionResult, sapResult] =
        await Promise.allSettled([
          getJntExpressShipmentCost({
            origin_name: originName,
            destination_name: finalDestinationName,
            weight,
          }),
          getPaxelShipmentCost({
            origin_name: originName,
            destination_name: paxelDestinationName,
            weight,
          }),
          getLionShipmentCost({
            origin_name: lionOriginName,
            destination_name: lionDestinationName,
            weight,
          }),
          getSapShipmentCost({
            origin_name: originName,
            destination_name: sapDestinationName,
            weight,
          }),
        ]);

      // Debug logging
      console.log("🔍 JNT Result:", jntResult);
      console.log("🔍 Paxel Result:", paxelResult);
      console.log("🔍 Lion Result:", lionResult);
      console.log("🔍 SAP Result:", sapResult);

      // Handle individual API errors
      if (jntResult.status === "rejected") {
        console.error("❌ JNT API failed:", jntResult.reason);
      }
      if (paxelResult.status === "rejected") {
        console.error("❌ Paxel API failed:", paxelResult.reason);
      }
      if (lionResult.status === "rejected") {
        console.error("❌ Lion API failed:", lionResult.reason);
      }
      if (sapResult.status === "rejected") {
        console.error("❌ SAP API failed:", sapResult.reason);
      }

      // Combine results from all APIs
      const combinedResult = {
        status: "success",
        data: {
          jnt: jntResult.status === "fulfilled" ? jntResult.value : null,
          paxel: paxelResult.status === "fulfilled" ? paxelResult.value : null,
          lion: lionResult.status === "fulfilled" ? lionResult.value : null,
          sap: sapResult.status === "fulfilled" ? sapResult.value : null,
        },
      };

      onResult?.(combinedResult);
    } catch (err) {
      console.error("❌ RegularPackageForm - API call failed:", err);
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

  const filteredRecipients = businessRecipients.filter((recipient) =>
    recipient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        {/* Section Detail Pengiriman */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Detail Pengiriman</h2>

          <div className="mb-6">
            <Label>Opsi Penjemputan</Label>
            <RadioGroup
              value={formData.deliveryType}
              onValueChange={(value) => handleChange("deliveryType", value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* Pick Up Option */}
              <label
                htmlFor="pickup"
                className={`flex items-start space-x-2 p-4 rounded-lg border cursor-pointer transition ${
                  formData.deliveryType === "pickup"
                    ? "border-blue-500 bg-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <RadioGroupItem value="pickup" id="pickup" className="peer" />
                <div>
                  <div className="font-medium">Pick Up</div>
                  <div className="text-sm text-gray-500">
                    Paket akan dijemput ke tempatmu
                  </div>
                </div>
              </label>

              {/* Drop Off Option */}
              <label
                htmlFor="dropoff"
                className={`flex items-start space-x-2 p-4 rounded-lg border cursor-pointer transition ${
                  formData.deliveryType === "dropoff"
                    ? "border-blue-500 bg-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <RadioGroupItem value="dropoff" id="dropoff" className="peer" />
                <div>
                  <div className="font-medium">Drop Off</div>
                  <div className="text-sm text-gray-500">
                    Paket perlu diantar ke agen ekspedisi
                  </div>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="mb-6">
            <Label>Metode Pembayaran</Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => handleChange("paymentMethod", value)}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {/* COD Option */}
              <label
                htmlFor="cod"
                className={`flex items-center space-x-2 p-4 rounded-lg border cursor-pointer transition ${
                  formData.paymentMethod === "cod"
                    ? "border-blue-500 bg-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <RadioGroupItem value="cod" id="cod" className="peer" />
                <div>
                  <div className="font-medium">COD (Cash on Delivery)</div>
                  <div className="text-sm text-gray-500">
                    Pembayaran akan dilakukan saat paket sampai di tujuan
                  </div>
                </div>
              </label>

              {/* Non-COD Option */}
              <label
                htmlFor="non-cod"
                className={`flex items-center space-x-2 p-4 rounded-lg border cursor-pointer transition ${
                  formData.paymentMethod === "non-cod"
                    ? "border-blue-500 bg-blue-200"
                    : "border-gray-200 hover:border-gray-400"
                }`}
              >
                <RadioGroupItem value="non-cod" id="non-cod" className="peer" />
                <div>
                  <div className="font-medium">Non-COD</div>
                  <div className="text-sm text-gray-500">
                    Pembayaran akan dilakukan sebelum paket dikirim
                  </div>
                </div>
              </label>
            </RadioGroup>
          </div>
        </Card>
        {/* Section List Pengirim */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Send className="h-5 w-5" />
              Pengirim
            </h2>
            {/* Button untuk membuka popup */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="h-11 px-6 py-4 font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out">
                  <PenLine size={16} /> Pilih Alamat
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Pilih Alamat</DialogTitle>
                  <DialogDescription>
                    Pilih alamat yang tersedia atau tambahkan alamat baru.
                  </DialogDescription>
                </DialogHeader>

                {/* List alamat yang tersedia */}
                <div className="space-y-2">
                  {businessData.map((business) => (
                    <div
                      key={business.id}
                      className={`p-3 border rounded-lg cursor-pointer ${
                        selectedBusiness && selectedBusiness.id === business.id
                          ? "border-primary"
                          : "border-gray-300"
                      }`}
                      onClick={() => handleSelectAddress(business)}
                    >
                      <p className="font-medium">{business.businessName}</p>
                      <p className="text-sm text-gray-500">
                        {business.address}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Button untuk tambah alamat */}
                {/* <Button variant="outline" className="w-full mt-3">
                  Tambah Alamat Baru
                </Button> */}
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            <div>
              <Label>Nama Usaha</Label>
              <Input value={selectedBusiness?.businessName || ""} readOnly />
            </div>
            <div>
              <Label>Nama Pengirim</Label>
              <Input value={selectedBusiness?.senderName || ""} readOnly />
            </div>
            <div>
              <Label>Kontak</Label>
              <Input value={selectedBusiness?.contact || ""} readOnly />
            </div>
            <div>
              <Label>Provinsi</Label>
              <Input value={selectedBusiness?.province || ""} readOnly />
            </div>
            <div>
              <Label>Kota</Label>
              <Input value={selectedBusiness?.regency || ""} readOnly />
            </div>
            <div>
              <Label>Kecamatan</Label>
              <Input value={selectedBusiness?.district || ""} readOnly />
            </div>
            <div>
              <Label>Alamat</Label>
              <Textarea
                className="min-h-[100px]"
                value={selectedBusiness?.address || ""}
                readOnly
              />
            </div>
          </div>
        </Card>
        {/* Section List Penerima */}
        <Card className="p-6 mb-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <User className="h-5 w-5" />
            Penerima
          </h2>

          <div className="space-y-4">
            {/* Nama & Nomor Telepon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="receiverName">
                  Nama Penerima <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receiverName"
                  placeholder="Nama lengkap penerima"
                  value={formData.receiverName}
                  onChange={(e) => handleChange("receiverName", e.target.value)}
                  className={formErrors.receiverName ? "border-red-500" : ""}
                />
                {formErrors.receiverName && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.receiverName}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="receiverPhone">
                  Nomor Telepon <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receiverPhone"
                  placeholder="08XXXXXXXXXX"
                  value={formData.receiverPhone}
                  onChange={(e) =>
                    handleChange("receiverPhone", e.target.value)
                  }
                  className={formErrors.receiverPhone ? "border-red-500" : ""}
                />
                {formErrors.receiverPhone && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.receiverPhone}
                  </p>
                )}
              </div>
            </div>
            {/* Alamat Tujuan - diganti dropdown province/regency/district */}
            {receiverId && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="text-sm text-blue-700">
                  Menggunakan alamat tersimpan
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setReceiverId(null);
                    setProvinceSearch("");
                    setRegencySearch("");
                    setDistrictSearch("");
                    setSelectedDistrictName("");
                  }}
                >
                  Edit Alamat
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 gap-4 relative">
              {/* Province Dropdown */}
              <div className="relative">
                <Label htmlFor="province">
                  Provinsi <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="province"
                  placeholder="Cari provinsi..."
                  value={provinceSearch}
                  onChange={(e) => {
                    setProvinceSearch(e.target.value);
                    handleChange("province", "");
                    handleChange("regency", "");
                    handleChange("district", "");
                    // Clear receiverId when manually editing
                    if (receiverId) {
                      setReceiverId(null);
                    }
                  }}
                  autoComplete="off"
                  readOnly={!!receiverId} // Make read-only if using saved recipient
                  className={formErrors.province ? "border-red-500" : ""}
                />
                {formErrors.province && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.province}
                  </p>
                )}
                {!receiverId &&
                  provinceSearch.length >= 3 &&
                  !formData.province && (
                    <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                      {loadingProvince ? (
                        <div className="p-2 text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : provinceOptions.length > 0 ? (
                        provinceOptions.map((prov) => (
                          <div
                            key={prov.id}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => {
                              handleChange("province", String(prov.id));
                              setProvinceSearch(prov.name);
                              setRegencySearch("");
                              setDistrictSearch("");
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
              {/* Regency Dropdown */}
              <div className="relative">
                <Label htmlFor="regency">
                  Kota/Kabupaten <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="regency"
                  placeholder="Cari kota/kabupaten..."
                  value={regencySearch}
                  onChange={(e) => {
                    setRegencySearch(e.target.value);
                    handleChange("regency", "");
                    handleChange("district", "");
                    setSelectedDistrictName("");
                    // Clear receiverId when manually editing
                    if (receiverId) {
                      setReceiverId(null);
                    }
                  }}
                  disabled={!formData.province && !receiverId}
                  autoComplete="off"
                  readOnly={!!receiverId} // Make read-only if using saved recipient
                  className={formErrors.regency ? "border-red-500" : ""}
                />
                {formErrors.regency && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.regency}
                  </p>
                )}
                {!receiverId &&
                  formData.province &&
                  regencySearch.length >= 3 &&
                  !formData.regency && (
                    <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                      {loadingRegency ? (
                        <div className="p-2 text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : regencyOptions.length > 0 ? (
                        regencyOptions.map((reg) => (
                          <div
                            key={reg.id}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => {
                              handleChange("regency", String(reg.id));
                              setRegencySearch(reg.name);
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
              {/* District Dropdown */}
              <div className="relative">
                <Label htmlFor="district">
                  Kecamatan <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="district"
                  placeholder="Cari kecamatan..."
                  value={districtSearch}
                  onChange={(e) => {
                    setDistrictSearch(e.target.value);
                    handleChange("district", "");
                    setSelectedDistrictName("");
                    // Clear receiverId when manually editing
                    if (receiverId) {
                      setReceiverId(null);
                    }
                  }}
                  disabled={!formData.regency && !receiverId}
                  autoComplete="off"
                  readOnly={!!receiverId} // Make read-only if using saved recipient
                  className={formErrors.district ? "border-red-500" : ""}
                />
                {formErrors.district && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.district}
                  </p>
                )}
                {!receiverId &&
                  formData.regency &&
                  districtSearch.length >= 3 &&
                  !formData.district && (
                    <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                      {loadingDistrict ? (
                        <div className="p-2 text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : districtOptions.length > 0 ? (
                        districtOptions.map((dist) => (
                          <div
                            key={dist.id}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => {
                              handleChange("district", String(dist.id));
                              setDistrictSearch(dist.name);
                              setSelectedDistrictName(dist.name);
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

            {/* Detail Alamat Lengkap */}
            <div>
              <Label htmlFor="receiverAddress">
                Detail Alamat Lengkap <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="receiverAddress"
                placeholder="Masukkan alamat lengkap"
                value={formData.receiverAddress}
                onChange={(e) =>
                  handleChange("receiverAddress", e.target.value)
                }
                className={`min-h-[100px] ${formErrors.receiverAddress ? "border-red-500" : ""}`}
              />
              {formErrors.receiverAddress && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.receiverAddress}
                </p>
              )}
            </div>

            <Popover open={openRecipient} onOpenChange={setOpenRecipient}>
              <PopoverTrigger asChild>
                <Button className="w-full h-11 px-6 py-4 font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out">
                  <PenLine size={16} className="mr-2" /> Pilih List Penerima
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-96 p-4">
                <Label className="flex items-center gap-2 mb-2">
                  <Search className="w-4 h-4" />
                  Cari Penerima
                </Label>
                <Input
                  placeholder="Cari nama penerima..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="mb-3"
                />
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {filteredRecipients.length > 0 ? (
                    filteredRecipients.map((recipient) => (
                      <div
                        key={recipient.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          // Set receiver ID first to indicate this is from saved list
                          setReceiverId(String(recipient.id));

                          // Update form data directly without triggering receiverId reset
                          setFormData((prev) => ({
                            ...prev,
                            receiverName: recipient.name,
                            receiverPhone: recipient.phone || "",
                            receiverAddress: recipient.address || "",
                            // For saved recipients, we need to get the actual location data
                            // Since Receiver stores names, we'll use them directly
                            province: recipient.province || "",
                            regency: recipient.regency || "",
                            district: recipient.district || "",
                          }));

                          // Set the search fields to show the location names (auto-complete effect)
                          setProvinceSearch(recipient.province || "");
                          setRegencySearch(recipient.regency || "");
                          setDistrictSearch(recipient.district || "");

                          // Set district name for API (using the stored name)
                          setSelectedDistrictName(recipient.district || "");

                          // Close the popover
                          setOpenRecipient(false);
                        }}
                      >
                        <p className="font-medium">{recipient.name}</p>
                        <p className="text-sm text-gray-500">
                          {recipient.phone}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      Tidak ada hasil ditemukan
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </Card>
        {/* Section Detail Product */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
            <Package className="h-5 w-5" />
            Detail Paket
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemContent">
                  Isi Barang <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="itemContent"
                  placeholder="Contoh: Laptop"
                  value={formData.itemContent}
                  onChange={(e) => handleChange("itemContent", e.target.value)}
                  className={formErrors.itemContent ? "border-red-500" : ""}
                />
                {formErrors.itemContent && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.itemContent}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="itemType">
                  Jenis Barang <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.itemType}
                  onValueChange={(value) => handleChange("itemType", value)}
                >
                  <SelectTrigger
                    className={formErrors.itemType ? "border-red-500" : ""}
                  >
                    <SelectValue placeholder="Pilih Jenis Barang" />
                  </SelectTrigger>
                  <SelectContent>
                    {itemTypes.map((type) => (
                      <SelectItem key={type} value={type.toLowerCase()}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.itemType && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.itemType}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="itemValue">
                  Nilai Barang <span className="text-red-500">*</span>
                </Label>
                <CurrencyInput
                  id="itemValue"
                  value={formData.itemValue}
                  placeholder="Cth : 1.000.000"
                  onChange={(value) => handleChange("itemValue", value)}
                  className={formErrors.itemValue ? "border-red-500" : ""}
                />
                {formErrors.itemValue && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.itemValue}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="itemQuantity">
                  Jumlah Barang <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="itemQuantity"
                  type="number"
                  placeholder="Cth : 1"
                  value={formData.itemQuantity}
                  onChange={(e) => handleChange("itemQuantity", e.target.value)}
                  className={formErrors.itemQuantity ? "border-red-500" : ""}
                />
                {formErrors.itemQuantity && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.itemQuantity}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weight">
                  Berat <span className="text-red-500">*</span>
                </Label>
                <WeightInput
                  id="weight"
                  placeholder="Cth : 1.000"
                  value={formData.weight}
                  onChange={(value) => handleChange("weight", value)}
                  className={formErrors.weight ? "border-red-500" : ""}
                />
                {formErrors.weight && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.weight}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="length">
                  Panjang (cm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="length"
                  placeholder="Cth : 25"
                  type="number"
                  value={formData.length}
                  onChange={(e) => handleChange("length", e.target.value)}
                  className={formErrors.length ? "border-red-500" : ""}
                />
                {formErrors.length && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.length}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="width">
                  Lebar (cm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="width"
                  placeholder="Cth : 25"
                  type="number"
                  value={formData.width}
                  onChange={(e) => handleChange("width", e.target.value)}
                  className={formErrors.width ? "border-red-500" : ""}
                />
                {formErrors.width && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.width}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="height">
                  Tinggi (cm) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="height"
                  placeholder="Cth : 25"
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleChange("height", e.target.value)}
                  className={formErrors.height ? "border-red-500" : ""}
                />
                {formErrors.height && (
                  <p className="text-sm text-red-500 mt-1">
                    {formErrors.height}
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Catatan Tambahan</Label>
              <Textarea
                id="notes"
                placeholder="Catatan untuk kurir (opsional)"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
              />
            </div>

            <Button
              type="submit"
              className="w-full h-11 px-6 py-4 font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out"
            >
              <CircleChevronRight className="w-4 h-4" />
              Pilih Expedisi
            </Button>
          </div>
        </Card>
      </form>
      {/* Hasil cek ongkir dihandle parent */}
    </div>
  );
}
