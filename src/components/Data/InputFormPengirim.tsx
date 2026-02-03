"use client";

import { useState, useEffect, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";
import {
  createShipper,
  updateShipper,
  searchAddressNew,
} from "@/lib/apiClient";
import type {
  Shipper,
  ShipperFormData,
  ShipperFormErrors,
} from "@/types/dataPengirim";
import { useAuth } from "@/context/AuthContext";
import GoogleMapPicker, { GoogleMapPickerRef } from "@/components/GoogleMapPicker";

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

interface InputFormPengirimProps {
  onShipperCreated?: () => void;
  editingShipper?: Shipper | null;
  onCancelEdit?: () => void;
}

export default function InputFormPengirim({
  onShipperCreated,
  editingShipper,
  onCancelEdit,
}: InputFormPengirimProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Address search state
  const [addressQuery, setAddressQuery] = useState("");
  const [addressResults, setAddressResults] = useState<AddressResult[]>([]);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [showAddressResults, setShowAddressResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<AddressResult | null>(null);
  const addressInputRef = useRef<HTMLDivElement>(null);
  
  // Location state (latitude and longitude)
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  
  // Address for geocoding on the map
  const [addressForGeocode, setAddressForGeocode] = useState<string>("");
  
  // Map picker ref
  const mapPickerRef = useRef<GoogleMapPickerRef>(null);
  
  // Store selected location names for form submission
  const [selectedProvinceName, setSelectedProvinceName] = useState("");
  const [selectedRegencyName, setSelectedRegencyName] = useState("");
  const [selectedDistrictName, setSelectedDistrictName] = useState("");

  const [formData, setFormData] = useState<ShipperFormData>({
    name: "",
    phone: "",
    contact: "",
    email: "",
    address: "",
    province_id: "",
    regency_id: "",
    district_id: "",
    postal_code: "",
  });

  const [errors, setErrors] = useState<ShipperFormErrors>({});

  // Load editing shipper data when editingShipper changes
  useEffect(() => {
    if (editingShipper) {
      // Set form data with existing values
      setFormData({
        name: editingShipper.name || "",
        phone: editingShipper.phone || "",
        contact: editingShipper.contact || "",
        email: editingShipper.email || "",
        address: editingShipper.address || "",
        province_id: "",
        regency_id: "",
        district_id: "",
        postal_code: editingShipper.postal_code || "",
      });

      // Set location names for form submission
      setSelectedProvinceName(editingShipper.province || "");
      setSelectedRegencyName(editingShipper.regency || "");
      setSelectedDistrictName(editingShipper.district || "");

      // Set latitude and longitude if available
      setLatitude(editingShipper.latitude);
      setLongitude(editingShipper.longitude);

      // Create AddressResult-like object for existing location
      if (editingShipper.province && editingShipper.regency && editingShipper.district) {
        const fullAddress = `${editingShipper.district}, ${editingShipper.regency}, ${editingShipper.province}`;
        setAddressQuery(fullAddress);
        
        const addressResult: AddressResult = {
          type: "subdistrict",
          id: 0,
          name: editingShipper.district || "",
          full_address: fullAddress,
          code: editingShipper.postal_code ? Number(editingShipper.postal_code) : null,
          province: editingShipper.province || "",
          regency: editingShipper.regency || "",
          district: editingShipper.district || "",
          subdistrict: editingShipper.district || "",
          province_id: 0,
          regency_id: 0,
          district_id: 0,
          subdistrict_id: 0,
        };
        setSelectedAddress(addressResult);
        
        // Trigger geocoding dengan full address untuk center map
        const addressForGeocode = editingShipper.address
          ? `${editingShipper.address}, ${fullAddress}`
          : fullAddress;
        setAddressForGeocode(addressForGeocode);
      } else {
        setAddressQuery("");
        setSelectedAddress(null);
        setAddressForGeocode("");
      }

      setErrors({});
    } else {
      // Reset form when not editing
      setFormData({
        name: "",
        phone: "",
        contact: "",
        email: "",
        address: "",
        province_id: "",
        regency_id: "",
        district_id: "",
        postal_code: "",
      });
      setErrors({});
      setAddressQuery("");
      setSelectedAddress(null);
      setSelectedProvinceName("");
      setSelectedRegencyName("");
      setSelectedDistrictName("");
      setLatitude(null);
      setLongitude(null);
      setAddressForGeocode("");
    }
  }, [editingShipper]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addressInputRef.current &&
        !addressInputRef.current.contains(event.target as Node)
      ) {
        setShowAddressResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Address search
  useEffect(() => {
    if (addressQuery.length >= 3) {
      setLoadingAddress(true);
      const timeoutId = setTimeout(() => {
        searchAddressNew(addressQuery)
          .then((response) => {
            setAddressResults(response.results);
            setShowAddressResults(true);
          })
          .catch((error) => {
            console.error("Error searching address:", error);
            setAddressResults([]);
          })
          .finally(() => {
            setLoadingAddress(false);
          });
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setAddressResults([]);
      setShowAddressResults(false);
    }
  }, [addressQuery]);

  const handleSelectAddress = (result: AddressResult) => {
    setSelectedAddress(result);
    setAddressQuery(result.full_address);
    setShowAddressResults(false);
    
    // Update formData with selected address IDs
    setFormData((prev) => ({
      ...prev,
      province_id: String(result.province_id),
      regency_id: String(result.regency_id),
      district_id: String(result.district_id),
      postal_code: result.code ? String(result.code) : "",
    }));
    
    // Store location names for form submission
    setSelectedProvinceName(result.province);
    setSelectedRegencyName(result.regency);
    setSelectedDistrictName(result.district);
    
    // Trigger geocoding di GoogleMapPicker dengan full_address
    // Hanya set sekali saat alamat area dipilih, tidak update saat detail alamat berubah
    // Gabungkan detail alamat yang ada saat ini (jika ada) dengan area yang dipilih
    const addressForGeocode = formData.address
      ? `${formData.address}, ${result.full_address}`
      : result.full_address;
    setAddressForGeocode(addressForGeocode);
  };

  const handleChange = (field: keyof ShipperFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ShipperFormErrors = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = "Nama pengirim wajib diisi";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Nomor telepon wajib diisi";
    } else if (!/^\d+$/.test(formData.phone) || formData.phone.length < 10) {
      newErrors.phone = "Nomor telepon harus berupa angka minimal 10 digit";
    }

    if (formData.email.trim()) {
      // Hanya cek format jika ada isi
      if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = "Format email tidak valid";
      }
    }

    if (!formData.address.trim()) {
      newErrors.address = "Alamat wajib diisi";
    }

    if (!selectedAddress) {
      newErrors.province_id = "Area alamat wajib dipilih";
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = "Kode pos wajib diisi";
    } else if (!/^\d{5}$/.test(formData.postal_code)) {
      newErrors.postal_code = "Kode pos harus 5 digit angka";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Mohon lengkapi semua field yang wajib diisi");
      return;
    }

    try {
      setIsLoading(true);

      // Get user ID from AuthContext
      if (!user || !user.id) {
        toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
        return;
      }

      const shipperData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        contact: formData.name.trim(), // contact sama dengan name sesuai requirement
        email: formData.email.trim(),
        address: formData.address.trim(),
        province: selectedProvinceName || "",
        regency: selectedRegencyName || "",
        district: selectedDistrictName || "",
        postal_code: formData.postal_code.trim(),
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
      };

      let response;
      if (editingShipper) {
        // Update existing shipper
        response = await updateShipper(editingShipper.id, shipperData);
      } else {
        // Create new shipper
        if (!user || !user.id) {
          toast.error("Sesi Anda telah berakhir. Silakan login kembali.");
          return;
        }
        response = await createShipper({
          ...shipperData,
          user_id: user.id,
        });
      }

      if (response.success) {
        toast.success(
          editingShipper
            ? "Data pengirim berhasil diperbarui!"
            : "Data pengirim berhasil disimpan!"
        );

        // Reset form
        setFormData({
          name: "",
          phone: "",
          contact: "",
          email: "",
          address: "",
          province_id: "",
          regency_id: "",
          district_id: "",
          postal_code: "",
        });
        setErrors({});

        // Reset location searches
        setAddressQuery("");
        setSelectedAddress(null);
        setSelectedProvinceName("");
        setSelectedRegencyName("");
        setSelectedDistrictName("");
        setLatitude(null);
        setLongitude(null);
        setAddressForGeocode("");

        // Notify parent component
        if (onShipperCreated) {
          onShipperCreated();
        }
        
        // Clear editing state
        if (onCancelEdit) {
          onCancelEdit();
        }
      } else {
        toast.error(
          response.message ||
            (editingShipper
              ? "Gagal memperbarui data pengirim"
              : "Gagal menyimpan data pengirim")
        );
      }
    } catch (error: unknown) {
      console.error("Error creating shipper:", error);
      toast.error("Terjadi kesalahan saat menyimpan data");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="animate-slide-down">
      <Card className="shadow-sm">
        <CardHeader className="p-3 mt-3 ml-3">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">
              {editingShipper
                ? "Edit Alamat Asal Pengiriman"
                : "Tambah Alamat Asal Pengiriman"}
            </CardTitle>
            {editingShipper && onCancelEdit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelEdit}
              >
                Batal Edit
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Nama Pengirim */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-shipping-label">
              Nama Pengirim<span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              placeholder="Nama pengirim / nama perusahaan"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={`bg-white ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm">{errors.name}</p>
            )}
          </div>

          {/* Phone & Email */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-shipping-label">
                Nomor Telepon<span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                type="number"
                maxLength={15}
                placeholder="08XXXXXXXXXX"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className={`bg-white ${errors.phone ? "border-red-500" : ""}`}
              />
              {errors.phone && (
                <p className="text-red-500 text-sm">{errors.phone}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-shipping-label">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className={`bg-white ${errors.email ? "border-red-500" : ""}`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
          </div>

          {/* Address Search */}
          <div className="relative" ref={addressInputRef}>
            <Label htmlFor="addressSearch" className="text-shipping-label">
              Alamat <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="addressSearch"
                placeholder="Cari area alamat (minimal 3 huruf)..."
                value={addressQuery}
                onChange={(e) => {
                  setAddressQuery(e.target.value);
                  setSelectedAddress(null);
                  handleChange("province_id", "");
                  handleChange("regency_id", "");
                  handleChange("district_id", "");
                  handleChange("postal_code", "");
                  setSelectedProvinceName("");
                  setSelectedRegencyName("");
                  setSelectedDistrictName("");
                }}
                autoComplete="off"
                className={`bg-white ${
                  !selectedAddress &&
                  addressQuery.length >= 3
                    ? "border-yellow-500"
                    : errors.province_id
                    ? "border-red-500"
                    : ""
                }`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {loadingAddress ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <Search className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
            {!selectedAddress && addressQuery.length >= 3 && (
              <p className="text-sm text-yellow-600 mt-1">
                Silakan pilih area alamat dari hasil pencarian
              </p>
            )}
            {errors.province_id && (
              <p className="text-red-500 text-sm">{errors.province_id}</p>
            )}
            {showAddressResults && addressQuery.length >= 3 && (
              <div className="absolute w-full bg-white border border-gray-300 mt-2 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {loadingAddress ? (
                  <div className="p-3 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                      <span className="text-gray-500">Mencari...</span>
                    </div>
                  </div>
                ) : addressResults.length > 0 ? (
                  <ul>
                    {addressResults.map((result, index) => (
                      <li
                        key={`${result.type}-${result.id}-${index}`}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSelectAddress(result)}
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

          {/* Postal Code */}
          <div className="space-y-1.5">
            <Label htmlFor="postal_code" className="text-shipping-label">
              Kode Pos<span className="text-red-500">*</span>
            </Label>
            <Input
              id="postal_code"
              type="text"
              maxLength={5}
              placeholder="12345"
              value={formData.postal_code}
              onChange={(e) => handleChange("postal_code", e.target.value)}
              className={`bg-white ${errors.postal_code ? "border-red-500" : ""}`}
              readOnly={!!selectedAddress}
            />
            {errors.postal_code && (
              <p className="text-red-500 text-sm">{errors.postal_code}</p>
            )}
          </div>

          {/* Complete Address */}
          <div className="space-y-1.5">
            <Label htmlFor="address" className="text-shipping-label">
              Detail Alamat<span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="address"
              placeholder="Alamat lengkap seperti Jl. atau RT/RW"
              value={formData.address}
              onChange={(e) => {
                handleChange("address", e.target.value);
                // Jangan update addressForGeocode saat user mengetik detail alamat
                // Map hanya akan reload sekali saat alamat area dipilih
              }}
              className={`bg-white placeholder:text-shipping-placeholder min-h-[100px] ${errors.address ? "border-red-500" : ""}`}
            />
            {errors.address && (
              <p className="text-red-500 text-sm">{errors.address}</p>
            )}
          </div>

          {/* Google Maps Picker */}
          <div>
            <GoogleMapPicker
              ref={mapPickerRef}
              onLocationChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              initialLat={latitude || undefined}
              initialLng={longitude || undefined}
              height="400px"
              addressToGeocode={addressForGeocode}
              onGettingLocationChange={setIsGettingLocation}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-700 text-white transition-all duration-300"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {editingShipper ? "Memperbarui..." : "Menyimpan..."}
              </>
            ) : (
              editingShipper ? "Perbarui Data Pengirim" : "Simpan Data Pengirim"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
