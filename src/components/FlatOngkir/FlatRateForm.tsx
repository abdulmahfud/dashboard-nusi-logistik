"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import {
  FlatShippingRate,
  FlatShippingRatePayload,
  FLAT_RATE_VENDORS,
} from "@/types/flatShippingRate";
import type { Province } from "@/types/dataRegulerForm";
import { CurrencyInput } from "@/components/ui/currency-input";
import { getProvinces } from "@/lib/apiClient";
import { toast } from "sonner";

interface FlatRateFormProps {
  rate?: FlatShippingRate | null;
  onSubmit: (data: FlatShippingRatePayload) => void;
  onCancel: () => void;
}

export function FlatRateForm({ rate, onSubmit, onCancel }: FlatRateFormProps) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    vendor: "all",
    flat_price: "",
    max_weight: "",
    max_length: "",
    max_width: "",
    max_height: "",
    is_active: true,
    valid_from: "",
    valid_until: "",
    priority: "0",
    description: "",
  });
  const [coveredProvinces, setCoveredProvinces] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    getProvinces()
      .then((res) => setProvinces(res.data))
      .catch(() => toast.error("Gagal memuat daftar provinsi"))
      .finally(() => setLoadingProvinces(false));
  }, []);

  useEffect(() => {
    if (rate) {
      setFormData({
        name: rate.name || "",
        vendor: rate.vendor || "all",
        flat_price: String(rate.flat_price ?? ""),
        max_weight: String(rate.max_weight ?? ""),
        max_length: rate.max_length != null ? String(rate.max_length) : "",
        max_width: rate.max_width != null ? String(rate.max_width) : "",
        max_height: rate.max_height != null ? String(rate.max_height) : "",
        is_active: rate.is_active,
        valid_from: rate.valid_from || "",
        valid_until: rate.valid_until || "",
        priority: String(rate.priority ?? 0),
        description: rate.description || "",
      });
      setCoveredProvinces(rate.covered_provinces || []);
    }
  }, [rate]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const toggleProvince = (name: string) => {
    setCoveredProvinces((prev) =>
      prev.includes(name) ? prev.filter((p) => p !== name) : [...prev, name]
    );
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama program wajib diisi";
    }
    if (!formData.flat_price || parseFloat(formData.flat_price) < 0) {
      newErrors.flat_price = "Harga flat wajib diisi (angka ≥ 0)";
    }
    if (coveredProvinces.length === 0) {
      newErrors.covered_provinces = "Pilih minimal 1 provinsi cakupan";
    }
    if (!formData.max_weight || parseFloat(formData.max_weight) <= 0) {
      newErrors.max_weight = "Berat maksimum wajib diisi (lebih dari 0 kg)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: FlatShippingRatePayload = {
      name: formData.name.trim(),
      vendor: formData.vendor === "all" ? null : formData.vendor,
      flat_price: parseFloat(formData.flat_price),
      covered_provinces: coveredProvinces,
      max_weight: parseFloat(formData.max_weight),
      is_active: formData.is_active,
      priority: parseInt(formData.priority) || 0,
      // BE selalu paksa jadi null sekarang — "jenis layanan" tidak dipakai
      // lagi, jadi field ini sengaja tidak dikirim.
    };
    if (formData.max_length) submitData.max_length = parseInt(formData.max_length);
    if (formData.max_width) submitData.max_width = parseInt(formData.max_width);
    if (formData.max_height) submitData.max_height = parseInt(formData.max_height);
    if (formData.valid_from) submitData.valid_from = formData.valid_from;
    if (formData.valid_until) submitData.valid_until = formData.valid_until;
    if (formData.description) submitData.description = formData.description;

    onSubmit(submitData);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <Button variant="ghost" size="sm" onClick={onCancel} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-xl font-semibold">
          {rate ? "Edit Program Flat Ongkir" : "Tambah Program Flat Ongkir"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">
                Nama Program <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Contoh: Flat Ongkir Jawa & Bali"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">Vendor</Label>
              <Select
                value={formData.vendor}
                onValueChange={(value) => handleInputChange("vendor", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Vendor</SelectItem>
                  {FLAT_RATE_VENDORS.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                GoSend tidak tersedia — ongkirnya dihitung dari koordinat,
                bukan provinsi.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="flat_price">
                Harga Flat (Rp) <span className="text-red-500">*</span>
              </Label>
              <CurrencyInput
                value={formData.flat_price}
                onChange={(value) => handleInputChange("flat_price", value)}
                placeholder="15000"
              />
              {errors.flat_price && (
                <p className="text-sm text-red-500">{errors.flat_price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_weight">
                Berat Maksimum (kg) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="max_weight"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.max_weight}
                onChange={(e) => handleInputChange("max_weight", e.target.value)}
                placeholder="5"
                className={errors.max_weight ? "border-red-500" : ""}
              />
              {errors.max_weight && (
                <p className="text-sm text-red-500">{errors.max_weight}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioritas</Label>
              <Input
                id="priority"
                type="number"
                min="0"
                value={formData.priority}
                onChange={(e) => handleInputChange("priority", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Kalau ada 2 program match sekaligus, prioritas lebih tinggi
                yang dipakai
              </p>
            </div>

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

            <div className="space-y-2">
              <Label htmlFor="valid_from">Berlaku Dari</Label>
              <Input
                id="valid_from"
                type="date"
                value={formData.valid_from}
                onChange={(e) => handleInputChange("valid_from", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk berlaku sejak sekarang
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="valid_until">Berlaku Sampai</Label>
              <Input
                id="valid_until"
                type="date"
                value={formData.valid_until}
                onChange={(e) => handleInputChange("valid_until", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk berlaku selamanya
              </p>
            </div>
          </div>

          {/* Dimensions */}
          <div className="space-y-2">
            <Label>Dimensi Maksimum (cm, opsional)</Label>
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                min="0"
                placeholder="Panjang"
                value={formData.max_length}
                onChange={(e) => handleInputChange("max_length", e.target.value)}
              />
              <Input
                type="number"
                min="0"
                placeholder="Lebar"
                value={formData.max_width}
                onChange={(e) => handleInputChange("max_width", e.target.value)}
              />
              <Input
                type="number"
                min="0"
                placeholder="Tinggi"
                value={formData.max_height}
                onChange={(e) => handleInputChange("max_height", e.target.value)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Limit dimensi baru benar-benar aktif menyaring kalau payload
              cek ongkir membawa dimensi — saat ini belum, jadi hanya limit
              berat yang praktiknya aktif.
            </p>
          </div>

          {/* Covered Provinces */}
          <div className="space-y-2">
            <Label>
              Cakupan Provinsi <span className="text-red-500">*</span>
            </Label>
            {loadingProvinces ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat daftar provinsi…
              </div>
            ) : (
              <div
                className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-60 overflow-y-auto border rounded-md p-3 ${
                  errors.covered_provinces ? "border-red-500" : ""
                }`}
              >
                {provinces.map((province) => (
                  <label
                    key={province.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <Checkbox
                      checked={coveredProvinces.includes(
                        province.name.toUpperCase()
                      )}
                      onCheckedChange={() =>
                        toggleProvince(province.name.toUpperCase())
                      }
                    />
                    {province.name}
                  </label>
                ))}
              </div>
            )}
            {errors.covered_provinces && (
              <p className="text-sm text-red-500">
                {errors.covered_provinces}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {coveredProvinces.length} provinsi dipilih. Nama akan
              di-uppercase otomatis di server.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Contoh: Promo flat ongkir seluruh Jawa & Bali"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button
              type="submit"
              className="h-11 px-6 py-4 font-semibold bg-blue-500 text-white hover:bg-blue-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out"
            >
              <Save className="h-4 w-4" />
              {rate ? "Update Program" : "Simpan Program"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
