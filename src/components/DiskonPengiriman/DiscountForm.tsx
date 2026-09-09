"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save } from "lucide-react";
import { ExpeditionDiscount } from "@/types/discount";
import { CurrencyInput } from "@/components/ui/currency-input";

interface DiscountFormProps {
  discount?: ExpeditionDiscount | null;
  onSubmit: (data: ExpeditionDiscount) => void;
  onCancel: () => void;
}

const VENDORS = [
  { value: "JNTEXPRESS", label: "JNT Express" },
  { value: "PAXEL", label: "Paxel" },
  { value: "SAP", label: "SAP Express" },
  { value: "LION", label: "Lion Parcel" },
  { value: "SICEPAT", label: "SiCepat" },
  { value: "TIKI", label: "TIKI" },
  { value: "POS", label: "Pos Indonesia" },
];

const SERVICE_TYPES = [
  { value: "all", label: "Semua Layanan" },
  { value: "REGULER", label: "Reguler" },
  { value: "COD", label: "COD (Cash on Delivery)" },
  { value: "EXPRESS", label: "Express" },
  { value: "INSTANT", label: "Instant" },
];

const USER_TYPES = [
  { value: "all", label: "Semua Tipe Akun" },
  { value: "personal", label: "Personal" },
  { value: "corporate", label: "Corporate" },
];

export function DiscountForm({
  discount,
  onSubmit,
  onCancel,
}: DiscountFormProps) {
  const [formData, setFormData] = useState({
    vendor: "",
    service_type: "all",
    discount_type: "percentage" as "percentage" | "fixed_amount",
    discount_value: "",
    minimum_order_value: "",
    maximum_discount_amount: "",
    user_type: "all",
    is_active: true,
    valid_from: "",
    valid_until: "",
    description: "",
    usage_limit: "",
    priority: "1",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (discount) {
      setFormData({
        vendor: discount.vendor || "",
        service_type: discount.service_type || "all",
        discount_type: discount.discount_type,
        discount_value: discount.discount_value.toString(),
        minimum_order_value: discount.minimum_order_value?.toString() || "",
        maximum_discount_amount:
          discount.maximum_discount_amount?.toString() || "",
        user_type: discount.user_type || "all",
        is_active: discount.is_active,
        valid_from: discount.valid_from || "",
        valid_until: discount.valid_until || "",
        description: discount.description || "",
        usage_limit: discount.usage_limit?.toString() || "",
        priority: discount.priority?.toString() || "1",
      });
    }
  }, [discount]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.vendor) {
      newErrors.vendor = "Vendor wajib dipilih";
    }

    if (!formData.discount_value || parseFloat(formData.discount_value) <= 0) {
      newErrors.discount_value = "Nilai diskon harus lebih dari 0";
    }

    if (
      formData.discount_type === "percentage" &&
      parseFloat(formData.discount_value) > 100
    ) {
      newErrors.discount_value =
        "Persentase diskon tidak boleh lebih dari 100%";
    }

    if (
      formData.minimum_order_value &&
      parseFloat(formData.minimum_order_value) < 0
    ) {
      newErrors.minimum_order_value = "Nilai minimum order tidak boleh negatif";
    }

    if (
      formData.maximum_discount_amount &&
      parseFloat(formData.maximum_discount_amount) < 0
    ) {
      newErrors.maximum_discount_amount = "Maksimal diskon tidak boleh negatif";
    }

    if (formData.usage_limit && parseInt(formData.usage_limit) <= 0) {
      newErrors.usage_limit = "Batas penggunaan harus lebih dari 0";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Deskripsi wajib diisi";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Convert string values to appropriate types
    const submitData = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      minimum_order_value: formData.minimum_order_value
        ? parseFloat(formData.minimum_order_value)
        : null,
      maximum_discount_amount: formData.maximum_discount_amount
        ? parseFloat(formData.maximum_discount_amount)
        : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      priority: parseInt(formData.priority),
      service_type:
        formData.service_type === "all" ? null : formData.service_type || null,
      user_type:
        formData.user_type === "all" ? null : formData.user_type || null,
    };

    onSubmit(submitData as ExpeditionDiscount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <Button variant="ghost" size="sm" onClick={onCancel} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-xl font-semibold">
          {discount ? "Edit Diskon" : "Tambah Diskon Baru"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Vendor */}
            <div className="space-y-2">
              <Label htmlFor="vendor">
                Vendor Ekspedisi <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.vendor}
                onValueChange={(value) => handleInputChange("vendor", value)}
              >
                <SelectTrigger
                  className={errors.vendor ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Pilih vendor ekspedisi" />
                </SelectTrigger>
                <SelectContent>
                  {VENDORS.map((vendor) => (
                    <SelectItem key={vendor.value} value={vendor.value}>
                      {vendor.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vendor && (
                <p className="text-sm text-red-500">{errors.vendor}</p>
              )}
            </div>

            {/* Service Type */}
            <div className="space-y-2">
              <Label htmlFor="service_type">Jenis Layanan</Label>
              <Select
                value={formData.service_type}
                onValueChange={(value) =>
                  handleInputChange("service_type", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis layanan (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((service) => (
                    <SelectItem key={service.value} value={service.value}>
                      {service.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk berlaku pada semua jenis layanan
              </p>
            </div>

            {/* Discount Type */}
            <div className="space-y-2">
              <Label htmlFor="discount_type">Jenis Diskon</Label>
              <Select
                value={formData.discount_type}
                onValueChange={(value) =>
                  handleInputChange(
                    "discount_type",
                    value as "percentage" | "fixed_amount"
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Persentase (%)</SelectItem>
                  <SelectItem value="fixed_amount">Nilai Tetap (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Discount Value */}
            <div className="space-y-2">
              <Label htmlFor="discount_value">
                Nilai Diskon <span className="text-red-500">*</span>
              </Label>
              {formData.discount_type === "percentage" ? (
                <div className="relative">
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      handleInputChange("discount_value", e.target.value)
                    }
                    placeholder="10"
                    min="0"
                    max="100"
                    step="0.01"
                    className={errors.discount_value ? "border-red-500" : ""}
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              ) : (
                <CurrencyInput
                  value={formData.discount_value}
                  onChange={(value) =>
                    handleInputChange("discount_value", value)
                  }
                  placeholder="50000"
                  className={errors.discount_value ? "border-red-500" : ""}
                />
              )}
              {errors.discount_value && (
                <p className="text-sm text-red-500">{errors.discount_value}</p>
              )}
            </div>

            {/* Minimum Order Value */}
            <div className="space-y-2">
              <Label htmlFor="minimum_order_value">Minimum Nilai Order</Label>
              <CurrencyInput
                value={formData.minimum_order_value}
                onChange={(value) =>
                  handleInputChange("minimum_order_value", value)
                }
                placeholder="100000"
                className={errors.minimum_order_value ? "border-red-500" : ""}
              />
              {errors.minimum_order_value && (
                <p className="text-sm text-red-500">
                  {errors.minimum_order_value}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Kosongkan jika tidak ada minimum
              </p>
            </div>

            {/* Maximum Discount Amount */}
            <div className="space-y-2">
              <Label htmlFor="maximum_discount_amount">Maksimal Potongan</Label>
              <CurrencyInput
                value={formData.maximum_discount_amount}
                onChange={(value) =>
                  handleInputChange("maximum_discount_amount", value)
                }
                placeholder="50000"
                className={
                  errors.maximum_discount_amount ? "border-red-500" : ""
                }
              />
              {errors.maximum_discount_amount && (
                <p className="text-sm text-red-500">
                  {errors.maximum_discount_amount}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Untuk diskon persentase, batasi potongan maksimal
              </p>
            </div>

            {/* User Type */}
            <div className="space-y-2">
              <Label htmlFor="user_type">Tipe Akun</Label>
              <Select
                value={formData.user_type}
                onValueChange={(value) => handleInputChange("user_type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe akun" />
                </SelectTrigger>
                <SelectContent>
                  {USER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Beda tarif untuk customer personal vs corporate (identitas
                akun). Kosongkan untuk berlaku ke semua tipe akun.
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange("priority", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (Tertinggi)</SelectItem>
                  <SelectItem value="2">2 (Tinggi)</SelectItem>
                  <SelectItem value="3">3 (Sedang)</SelectItem>
                  <SelectItem value="4">4 (Rendah)</SelectItem>
                  <SelectItem value="5">5 (Terendah)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Diskon dengan prioritas tinggi akan diprioritaskan
              </p>
            </div>

            {/* Valid From */}
            <div className="space-y-2">
              <Label htmlFor="valid_from">Berlaku Dari</Label>
              <Input
                type="datetime-local"
                value={formData.valid_from}
                onChange={(e) =>
                  handleInputChange("valid_from", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk berlaku sejak sekarang
              </p>
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <Label htmlFor="valid_until">Berlaku Sampai</Label>
              <Input
                type="datetime-local"
                value={formData.valid_until}
                onChange={(e) =>
                  handleInputChange("valid_until", e.target.value)
                }
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk berlaku selamanya
              </p>
            </div>

            {/* Usage Limit */}
            <div className="space-y-2">
              <Label htmlFor="usage_limit">Batas Penggunaan</Label>
              <Input
                type="number"
                value={formData.usage_limit}
                onChange={(e) =>
                  handleInputChange("usage_limit", e.target.value)
                }
                placeholder="1000"
                min="1"
                className={errors.usage_limit ? "border-red-500" : ""}
              />
              {errors.usage_limit && (
                <p className="text-sm text-red-500">{errors.usage_limit}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk tanpa batas
              </p>
            </div>

            {/* Is Active */}
            <div className="space-y-2">
              <Label htmlFor="is_active">Status</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    handleInputChange("is_active", checked)
                  }
                />
                <Label htmlFor="is_active" className="text-sm">
                  {formData.is_active ? "Aktif" : "Tidak Aktif"}
                </Label>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Deskripsi <span className="text-red-500">*</span>
            </Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Contoh: Diskon 10% untuk semua pengiriman JNT Express"
              rows={3}
              className={errors.description ? "border-red-500" : ""}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" className="h-11 px-6 py-4 font-semibold bg-blue-500 text-white hover:bg-blue-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out">
              <Save className="h-4 w-4" />
              {discount ? "Update Diskon" : "Simpan Diskon"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
