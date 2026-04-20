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
  Loader2,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import GoogleMapPicker, { GoogleMapPickerRef } from "@/components/GoogleMapPicker";
import {
  getShippers,
  getReceivers,
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
  searchAddressNew,
} from "@/lib/apiClient";
import { notifyShipmentCost422Rejections } from "@/lib/shipment-cost-errors";
import { deliveryTypeToPickup, type DeliveryType } from "@/lib/utils";
import type {
  Shipper,
  Receiver,
} from "@/types/dataRegulerForm";
import { itemTypes } from "@/types/dataRegulerForm";

type VendorKey =
  | "jntexpress"
  | "paxel"
  | "lion"
  | "sap"
  | "posindonesia"
  | "jne"
  | "idexpress"
  | "anteraja"
  | "ninja";

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
  deliveryType?: "pickup" | "dropoff"; // Frontend format: "pickup" or "dropoff"
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
      deliveryType: DeliveryType; // "pickup" or "dropoff"
      paymentMethod: string;
    };
    businessData?: Business | null;
    receiverId?: string | null;
    senderLatitude?: number | null;
    senderLongitude?: number | null;
  }) => void;
}

export default function RegularPackageForm({
  onResult,
  setIsSearching,
  onFormDataChange,
}: RegularPackageFormProps) {
  const [businessData, setBusinessData] = useState<Business[]>([]);
  const [open, setOpen] = useState(false);
  const [openRecipient, setOpenRecipient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [businessRecipients, setBusinessRecipients] = useState<Receiver[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiverId, setReceiverId] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Receiver address search state
  const [receiverAddressQuery, setReceiverAddressQuery] = useState("");
  const [receiverAddressResults, setReceiverAddressResults] = useState<AddressResult[]>([]);
  const [loadingReceiverAddress, setLoadingReceiverAddress] = useState(false);
  const [showReceiverAddressResults, setShowReceiverAddressResults] = useState(false);
  const [selectedReceiverAddress, setSelectedReceiverAddress] = useState<AddressResult | null>(null);
  const receiverAddressInputRef = useRef<HTMLDivElement>(null);

  // Sender address search state
  const [senderAddressQuery, setSenderAddressQuery] = useState("");
  const [senderAddressResults, setSenderAddressResults] = useState<AddressResult[]>([]);
  const [loadingSenderAddress, setLoadingSenderAddress] = useState(false);
  const [showSenderAddressResults, setShowSenderAddressResults] = useState(false);
  const [selectedSenderAddress, setSelectedSenderAddress] = useState<AddressResult | null>(null);
  const senderAddressInputRef = useRef<HTMLDivElement>(null);
  const mapPickerRef = useRef<GoogleMapPickerRef>(null);

  // Sender location (latitude and longitude)
  const [senderLatitude, setSenderLatitude] = useState<number | null>(null);
  const [senderLongitude, setSenderLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Address untuk geocoding di map
  const [senderAddressForGeocode, setSenderAddressForGeocode] = useState<string>("");

  const normalizeVendorKey = (vendor: string): string =>
    vendor.toLowerCase().replace(/[\s_-]/g, "");

  // Sender data state - langsung editable, default kosong
  const [senderData, setSenderData] = useState({
    businessName: "",
    senderName: "",
    contact: "",
    address: "",
    province: "",
    regency: "",
    district: "",
  });

  const [formData, setFormData] = useState<{
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
    deliveryType: DeliveryType;
    paymentMethod: string;
  }>({
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
      // Tidak auto-select business pertama, biarkan kosong
    });

    getReceivers().then((res) => {
      setBusinessRecipients(res.data.data);
    });
  }, []);

  // Notify parent of initial form data
  useEffect(() => {
    if (onFormDataChange) {
      // Buat businessData dari senderData
      const businessDataForParent = {
        id: 0, // Temporary ID
        businessName: senderData.businessName,
        senderName: senderData.senderName,
        contact: senderData.contact,
        province: senderData.province,
        regency: senderData.regency,
        district: senderData.district,
        address: senderData.address,
      };

      // Use selectedReceiverAddress if available, otherwise use formData
      // This ensures province, regency, and district are always set when address is selected
      const receiverProvince = selectedReceiverAddress?.province || formData.province;
      const receiverRegency = selectedReceiverAddress?.regency || formData.regency;
      const receiverDistrict = selectedReceiverAddress?.district || formData.district;
      const receiverPostalCode = selectedReceiverAddress?.code 
        ? String(selectedReceiverAddress.code) 
        : "";

      // Get sender postal code from selectedSenderAddress
      const senderPostalCode = selectedSenderAddress?.code 
        ? String(selectedSenderAddress.code) 
        : "";

      const notificationData = {
        itemValue: formData.itemValue,
        paymentMethod: formData.paymentMethod,
        formData: {
          ...formData,
          // Override with selectedReceiverAddress data if available
          province: receiverProvince,
          regency: receiverRegency,
          district: receiverDistrict,
          postal_code: receiverPostalCode, // Add postal_code from selectedReceiverAddress
        },
        businessData: {
          ...businessDataForParent,
          postal_code: senderPostalCode, // Add postal_code to businessData
        },
        receiverId: receiverId,
        senderLatitude: senderLatitude,
        senderLongitude: senderLongitude,
      };

      onFormDataChange(notificationData);
    }
  }, [
    formData,
    receiverId,
    senderLatitude,
    senderLongitude,
    senderData,
    selectedReceiverAddress, // Add selectedReceiverAddress to dependencies
    selectedSenderAddress, // Add selectedSenderAddress to dependencies for postal_code
    onFormDataChange,
  ]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        receiverAddressInputRef.current &&
        !receiverAddressInputRef.current.contains(event.target as Node)
      ) {
        setShowReceiverAddressResults(false);
      }
      if (
        senderAddressInputRef.current &&
        !senderAddressInputRef.current.contains(event.target as Node)
      ) {
        setShowSenderAddressResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Receiver address search
  useEffect(() => {
    if (receiverAddressQuery.length >= 3 && !receiverId) {
      setLoadingReceiverAddress(true);
      const timeoutId = setTimeout(() => {
        searchAddressNew(receiverAddressQuery)
          .then((response) => {
            setReceiverAddressResults(response.results);
            setShowReceiverAddressResults(true);
          })
          .catch((error) => {
            console.error("Error searching address:", error);
            setReceiverAddressResults([]);
          })
          .finally(() => {
            setLoadingReceiverAddress(false);
          });
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setReceiverAddressResults([]);
      setShowReceiverAddressResults(false);
    }
  }, [receiverAddressQuery, receiverId]);

  // Sender address search
  useEffect(() => {
    if (senderAddressQuery.length >= 3) {
      setLoadingSenderAddress(true);
      const timeoutId = setTimeout(() => {
        searchAddressNew(senderAddressQuery)
          .then((response) => {
            setSenderAddressResults(response.results);
            setShowSenderAddressResults(true);
          })
          .catch((error) => {
            console.error("Error searching address:", error);
            setSenderAddressResults([]);
          })
          .finally(() => {
            setLoadingSenderAddress(false);
          });
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setSenderAddressResults([]);
      setShowSenderAddressResults(false);
    }
  }, [senderAddressQuery]);

  const handleSelectReceiverAddress = (result: AddressResult) => {
    setSelectedReceiverAddress(result);
    setReceiverAddressQuery(result.full_address);
    setShowReceiverAddressResults(false);
    
    // Update formData with selected address
    handleChange("province", result.province);
    handleChange("regency", result.regency);
    handleChange("district", result.district);
    
    // Clear receiverId when manually editing
    if (receiverId) {
      setReceiverId(null);
    }
  };

  const handleSelectSenderAddress = (result: AddressResult) => {
    setSelectedSenderAddress(result);
    setSenderAddressQuery(result.full_address);
    setShowSenderAddressResults(false);
    
    // Update senderData dengan area yang dipilih
    setSenderData({
      ...senderData,
      province: result.province,
      regency: result.regency,
      district: result.district,
    });
    
    // Trigger geocoding di GoogleMapPicker dengan full_address
    // Gabungkan detail address jika ada untuk hasil lebih akurat
    const addressForGeocode = senderData.address 
      ? `${senderData.address}, ${result.full_address}`
      : result.full_address;
    setSenderAddressForGeocode(addressForGeocode);
  };

  const handleSelectAddress = (business: Business) => {
    setOpen(false);
    
    // Isi senderData dengan data dari business yang dipilih
    setSenderData({
      businessName: business.businessName,
      senderName: business.senderName,
      contact: business.contact,
      address: business.address,
      province: business.province || "",
      regency: business.regency || "",
      district: business.district || "",
    });
    
    // Set sender address query to show the location
    const fullAddress = `${business.district || ""}, ${business.regency || ""}, ${business.province || ""}`;
    setSenderAddressQuery(fullAddress.trim());
    
    // Create AddressResult-like object for selected business
    const addressResult: AddressResult = {
      type: "subdistrict",
      id: 0,
      name: business.district || "",
      full_address: fullAddress.trim(),
      code: null,
      province: business.province || "",
      regency: business.regency || "",
      district: business.district || "",
      subdistrict: business.district || "",
      province_id: 0,
      regency_id: 0,
      district_id: 0,
      subdistrict_id: 0,
    };
    setSelectedSenderAddress(addressResult);
    
    // Trigger geocoding dengan full address untuk center map
    // Gabungkan detail address dengan area untuk hasil lebih akurat
    const addressForGeocode = business.address 
      ? `${business.address}, ${fullAddress.trim()}`
      : fullAddress.trim();
    setSenderAddressForGeocode(addressForGeocode);
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
      if (!selectedReceiverAddress) {
        newErrors.province = "Area tujuan wajib dipilih";
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

    // Validasi sender data
    if (!senderData.senderName || !senderData.contact) {
      hasErrors = true;
      newErrors.sender = "Data pengirim tidak lengkap";
    }
    if (!senderData.province || !senderData.regency || !senderData.district) {
      hasErrors = true;
      newErrors.sender = "Area asal pengirim wajib dipilih";
    }
    if (!senderData.address) {
      hasErrors = true;
      newErrors.sender = "Detail alamat pengirim wajib diisi";
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
      // Buat businessData dari senderData
      const businessDataForParent = {
        id: 0,
        businessName: senderData.businessName,
        senderName: senderData.senderName,
        contact: senderData.contact,
        province: senderData.province,
        regency: senderData.regency,
        district: senderData.district,
        address: senderData.address,
      };

      const changeData = {
        itemValue: newData.itemValue,
        paymentMethod: newData.paymentMethod,
        formData: newData,
        businessData: businessDataForParent,
        receiverId: receiverId,
        senderLatitude: senderLatitude,
        senderLongitude: senderLongitude,
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

    setIsSubmitting(true);
    if (setIsSearching) setIsSearching(true);

    // Siapkan payload
    let payload: RegularPackagePayload = {
      ...formData,
    };

    // Set servicetype sesuai deliveryType - use utility function for consistency
    // servicetype: 1 = Pickup, 6 = Drop Off
    payload.servicetype = deliveryTypeToPickup(formData.deliveryType) ? 1 : 6;

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
      // Use selectedReceiverAddress if available, otherwise use formData
      const province = selectedReceiverAddress?.province || formData.province;
      const regency = selectedReceiverAddress?.regency || formData.regency;
      const district = selectedReceiverAddress?.district || formData.district;
      
      payload = {
        ...payload,
        receiver: {
          name: formData.receiverName,
          phone: formData.receiverPhone,
          address: formData.receiverAddress,
          province: province,
          regency: regency,
          district: district,
        },
      };
    }

    // Ambil data untuk ongkir
    // Konversi dari gram ke kilogram sebelum dikirim ke API
    const weightInGrams = formData.weight.replace(/\./g, ""); // Hapus titik pemisah ribuan jika ada
    const weightInKg = (Number(weightInGrams) / 1000).toString();

    // Get origin data from senderData
    const originProvince = senderData.province || "";
    const originRegency = senderData.regency || "";
    const originDistrict = senderData.district || "";

    // Get destination data based on receiverId or formData
    let destProvince = "";
    let destRegency = "";
    let destDistrict = "";

    if (receiverId) {
      const selectedRecipient = businessRecipients.find(
        (r) => String(r.id) === receiverId
      );
      if (selectedRecipient) {
        destProvince = selectedRecipient.province || "";
        destRegency = selectedRecipient.regency || "";
        destDistrict = selectedRecipient.district || "";
      }
    } else {
      // Use selectedReceiverAddress if available
      if (selectedReceiverAddress) {
        destProvince = selectedReceiverAddress.province;
        destRegency = selectedReceiverAddress.regency;
        destDistrict = selectedReceiverAddress.district;
      } else {
        destProvince = formData.province;
        destRegency = formData.regency;
        destDistrict = formData.district;
      }
    }

    // Validate required parameters
    if (
      !weightInKg ||
      !originProvince ||
      !originRegency ||
      !originDistrict ||
      !destProvince ||
      !destRegency ||
      !destDistrict
    ) {
      const missingFields = [];
      if (!weightInKg) missingFields.push("berat");
      if (!originProvince || !originRegency || !originDistrict)
        missingFields.push("data alamat pengirim tidak lengkap");
      if (!destProvince || !destRegency || !destDistrict)
        missingFields.push("data alamat tujuan tidak lengkap");

      const errorMessage = `Data tidak lengkap: ${missingFields.join(", ")} wajib diisi`;

      onResult?.({
        error: true,
        message: errorMessage,
      });
      setIsSubmitting(false);
      if (setIsSearching) setIsSearching(false);
      return;
    }

    try {
      const vendorSettingsResponse = await getExpeditionVendorSettings();
      const vendorSettings = Array.isArray(vendorSettingsResponse.data)
        ? vendorSettingsResponse.data
        : [];
      const isCodOrder = formData.paymentMethod === "cod";

      const allowedVendors = new Set<VendorKey>(
        vendorSettings
          .filter(
            (item) => item.is_active && (!isCodOrder || item.is_cod_active)
          )
          .map((item) => normalizeVendorKey(item.vendor))
          .filter(
            (key): key is VendorKey =>
              key === "jntexpress" ||
              key === "paxel" ||
              key === "lion" ||
              key === "sap" ||
              key === "posindonesia" ||
              key === "jne" ||
              key === "idexpress" ||
              key === "anteraja" ||
              key === "ninja"
          )
      );

      if (isCodOrder && allowedVendors.size === 0) {
        onResult?.({
          error: true,
          message: "Saat ini tidak ada ekspedisi yang mendukung COD.",
        });
        return;
      }

      if (!isCodOrder && allowedVendors.size === 0) {
        onResult?.({
          error: true,
          message: "Saat ini tidak ada ekspedisi yang aktif.",
        });
        return;
      }

      // Prepare common payload for all APIs
      const shipmentPayload = {
        origin_province: originProvince.toUpperCase(),
        origin_regencie: originRegency.toUpperCase(),
        origin_district: originDistrict.toUpperCase(),
        destination_province: destProvince.toUpperCase(),
        destination_regencie: destRegency.toUpperCase(),
        destination_district: destDistrict.toUpperCase(),
        weight: weightInKg,
      };

      // Call all vendor APIs in parallel - same as ShippingForm.tsx for consistency
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
      ]);

      // Combine results from all APIs - same format as ShippingForm.tsx
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
      setIsSubmitting(false);
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
                  <PenLine size={16} /> Pilih List Pengirim
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
                      className="p-3 border rounded-lg cursor-pointer border-gray-300 hover:border-primary"
                      onClick={() => handleSelectAddress(business)}
                    >
                      <p className="font-medium">{business.businessName}</p>
                      <p className="text-sm text-gray-500">
                        {business.address}
                      </p>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {/* Error display */}
            {formErrors.sender && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {formErrors.sender}
              </div>
            )}
            
            {/* Semua field langsung editable */}
            <div>
              <Label htmlFor="senderName">
                Nama Pengirim <span className="text-red-500">*</span>
              </Label>
              <Input
                id="senderName"
                placeholder="Nama lengkap pengirim"
                value={senderData.senderName}
                onChange={(e) =>
                  setSenderData({
                    ...senderData,
                    senderName: e.target.value,
                  })
                }
                className={formErrors.sender ? "border-red-500" : ""}
              />
            </div>
            <div>
              <Label htmlFor="senderContact">
                Kontak <span className="text-red-500">*</span>
              </Label>
              <Input
                id="senderContact"
                placeholder="08XXXXXXXXXX"
                value={senderData.contact}
                onChange={(e) =>
                  setSenderData({
                    ...senderData,
                    contact: e.target.value,
                  })
                }
                className={formErrors.sender ? "border-red-500" : ""}
              />
            </div>
            {/* Area Asal - Single Search Input */}
            <div className="relative" ref={senderAddressInputRef}>
              <Label htmlFor="senderAddressSearch">
                Alamat <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="senderAddressSearch"
                  placeholder="Cari area asal (minimal 3 huruf)..."
                  value={senderAddressQuery}
                  onChange={(e) => {
                    setSenderAddressQuery(e.target.value);
                    setSelectedSenderAddress(null);
                    setSenderData({
                      ...senderData,
                      province: "",
                      regency: "",
                      district: "",
                    });
                  }}
                  autoComplete="off"
                  className={
                    !senderData.province &&
                    senderAddressQuery.length >= 3 &&
                    !selectedSenderAddress
                      ? "border-yellow-500"
                      : formErrors.sender
                      ? "border-red-500"
                      : ""
                  }
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {loadingSenderAddress ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : (
                    <Search className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              {!senderData.province &&
                senderAddressQuery.length >= 3 &&
                !selectedSenderAddress && (
                  <p className="text-sm text-yellow-600 mt-1">
                    Silakan pilih area asal dari hasil pencarian
                  </p>
                )}
              {/* Dropdown hasil pencarian */}
              {showSenderAddressResults && senderAddressQuery.length >= 3 && (
                <div className="absolute w-full bg-white border border-gray-300 mt-2 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {loadingSenderAddress ? (
                    <div className="p-3 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                        <span className="text-gray-500">Mencari...</span>
                      </div>
                    </div>
                  ) : senderAddressResults.length > 0 ? (
                    <ul>
                      {senderAddressResults.map((result, index) => (
                        <li
                          key={`${result.type}-${result.id}-${index}`}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleSelectSenderAddress(result)}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {result.full_address}
                          </div>
                          {result.code && (
                            <div className="text-xs text-blue-600 mt-1 font-semibold">
                              Kode Pos: {result.code}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Tidak ada hasil
                    </div>
                  )}
                </div>
              )}
              {/* Tombol Ambil Lokasi Saya */}
              <div className="mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (mapPickerRef.current) {
                      mapPickerRef.current.getCurrentLocation();
                    }
                  }}
                  disabled={isGettingLocation}
                  className="text-xs w-full sm:w-auto"
                >
                  {isGettingLocation ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Mengambil lokasi...
                    </>
                  ) : (
                    "📍 Ambil Lokasi Saya"
                  )}
                </Button>
              </div>
            </div>
            <div>
              <Label htmlFor="senderAddress">
                Detail Alamat <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="senderAddress"
                className={`min-h-[100px] ${formErrors.sender ? "border-red-500" : ""}`}
                placeholder="Masukkan alamat lengkap"
                value={senderData.address}
                onChange={(e) =>
                  setSenderData({
                    ...senderData,
                    address: e.target.value,
                  })
                }
              />
            </div>
            {/* Google Maps Picker for Sender Location */}
            <div>
              <GoogleMapPicker
                ref={mapPickerRef}
                onLocationChange={(lat, lng) => {
                  setSenderLatitude(lat);
                  setSenderLongitude(lng);
                  // The useEffect will automatically notify parent when senderLatitude/senderLongitude changes
                }}
                initialLat={senderLatitude || undefined}
                initialLng={senderLongitude || undefined}
                height="400px"
                addressToGeocode={senderAddressForGeocode}
                onGettingLocationChange={setIsGettingLocation}
              />
            </div>
          </div>
        </Card>
        {/* Section List Penerima */}
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <User className="h-5 w-5" />
              Penerima
            </h2>
            {/* Button untuk membuka popup list penerima */}
            <Popover open={openRecipient} onOpenChange={setOpenRecipient}>
              <PopoverTrigger asChild>
                <Button className="h-11 px-6 py-4 font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out">
                  <PenLine size={16} /> Pilih List Penerima
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

                          // Set receiver address query to show the location
                          const fullAddress = `${recipient.district || ""}, ${recipient.regency || ""}, ${recipient.province || ""}`;
                          setReceiverAddressQuery(fullAddress.trim());
                          
                          // Create AddressResult-like object for saved recipient
                          const addressResult: AddressResult = {
                            type: "subdistrict",
                            id: 0,
                            name: recipient.district || "",
                            full_address: fullAddress.trim(),
                            province: recipient.province || "",
                            regency: recipient.regency || "",
                            district: recipient.district || "",
                            subdistrict: "",
                            province_id: 0,
                            regency_id: 0,
                            district_id: 0,
                            subdistrict_id: 0,
                          };
                          setSelectedReceiverAddress(addressResult);
                          
                          setOpenRecipient(false);
                        }}
                      >
                        <p className="font-medium">{recipient.name}</p>
                        <p className="text-sm text-gray-500">
                          {recipient.phone || "No phone"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {recipient.address || "No address"}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Tidak ada penerima ditemukan
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>

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
                    setReceiverAddressQuery("");
                    setSelectedReceiverAddress(null);
                  }}
                >
                  Edit Alamat
                </Button>
              </div>
            )}
            {/* Area Tujuan - Single Search Input */}
            <div className="relative" ref={receiverAddressInputRef}>
              <Label htmlFor="receiverAddressSearch">
                Alamat <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="receiverAddressSearch"
                  placeholder="Cari area tujuan (minimal 3 huruf)..."
                  value={receiverAddressQuery}
                  onChange={(e) => {
                    setReceiverAddressQuery(e.target.value);
                    setSelectedReceiverAddress(null);
                    handleChange("province", "");
                    handleChange("regency", "");
                    handleChange("district", "");
                    // Clear receiverId when manually editing
                    if (receiverId) {
                      setReceiverId(null);
                    }
                  }}
                  autoComplete="off"
                  readOnly={!!receiverId}
                  className={formErrors.province ? "border-red-500" : ""}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {loadingReceiverAddress ? (
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  ) : (
                    <Search className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              {formErrors.province && (
                <p className="text-sm text-red-500 mt-1">
                  {formErrors.province}
                </p>
              )}
              {/* Dropdown hasil pencarian */}
              {showReceiverAddressResults && receiverAddressQuery.length >= 3 && !receiverId && (
                <div className="absolute w-full bg-white border border-gray-300 mt-2 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {loadingReceiverAddress ? (
                    <div className="p-3 text-center">
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                        <span className="text-gray-500">Mencari...</span>
                      </div>
                    </div>
                  ) : receiverAddressResults.length > 0 ? (
                    <ul>
                      {receiverAddressResults.map((result, index) => (
                        <li
                          key={`${result.type}-${result.id}-${index}`}
                          className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => handleSelectReceiverAddress(result)}
                        >
                          <div className="text-sm font-medium text-gray-900">
                            {result.full_address}
                          </div>
                          {result.code && (
                            <div className="text-xs text-blue-600 mt-1 font-semibold">
                              Kode Pos: {result.code}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="p-3 text-sm text-gray-500 text-center">
                      Tidak ada hasil
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Detail Alamat Lengkap */}
            <div>
              <Label htmlFor="receiverAddress">
                Detail Alamat <span className="text-red-500">*</span>
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
              className="w-full h-11 px-6 py-4 font-semibold bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menunggu list harga pengiriman...
                </>
              ) : (
                <>
                  <CircleChevronRight className="w-4 h-4" />
                  Pilih Expedisi
                </>
              )}
            </Button>
          </div>
        </Card>
      </form>
      {/* Hasil cek ongkir dihandle parent */}
    </div>
  );
}
