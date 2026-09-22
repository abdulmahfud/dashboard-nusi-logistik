"use client";

import { useState, useEffect } from "react";
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
import { ChevronLeft, Save, Loader2 } from "lucide-react";
import {
  FlatShippingRate,
  FlatShippingRatePayload,
} from "@/types/flatShippingRate";
import type { Province } from "@/types/dataRegulerForm";
import { CurrencyInput } from "@/components/ui/currency-input";
import { getProvinces } from "@/lib/apiClient";
import {
  fetchPricingEligibleVendors,
  type PricingVendorOption,
} from "@/lib/pricingVendors";
import { PRIORITY_OPTIONS, DEFAULT_PRIORITY } from "@/lib/priorityScale";
import { toast } from "sonner";

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-800";

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
    priority: DEFAULT_PRIORITY,
    description: "",
  });
  const [coveredProvinces, setCoveredProvinces] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vendorOptions, setVendorOptions] = useState<PricingVendorOption[]>(
    []
  );
  const [loadingVendors, setLoadingVendors] = useState(true);

  useEffect(() => {
    getProvinces()
      .then((res) => setProvinces(res.data))
      .catch(() => toast.error("Gagal memuat daftar provinsi"))
      .finally(() => setLoadingProvinces(false));
  }, []);

  useEffect(() => {
    fetchPricingEligibleVendors()
      .then(setVendorOptions)
      .catch(() => toast.error("Gagal memuat daftar vendor"))
      .finally(() => setLoadingVendors(false));
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
        priority: rate.priority != null ? String(rate.priority) : DEFAULT_PRIORITY,
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
      priority: parseInt(formData.priority) || Number(DEFAULT_PRIORITY),
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
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Kembali"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <h2 className="text-lg font-semibold text-slate-900">
          {rate ? "Edit Program Flat Ongkir" : "Tambah Program Flat Ongkir"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name" className={labelCls}>
              Nama Program <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Contoh: Flat Ongkir Jawa & Bali"
              className={`${fieldCls} ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="vendor" className={labelCls}>
              Vendor
            </Label>
            <Select
              value={formData.vendor}
              onValueChange={(value) => handleInputChange("vendor", value)}
              disabled={loadingVendors}
            >
              <SelectTrigger id="vendor" className={fieldCls}>
                <SelectValue
                  placeholder={
                    loadingVendors ? "Memuat daftar vendor..." : "Pilih vendor"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Vendor</SelectItem>
                {vendorOptions.map((v) => (
                  <SelectItem key={v.value} value={v.value}>
                    {v.label}
                    {!v.is_active ? " (Nonaktif)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              GoSend tidak tersedia — ongkirnya dihitung dari koordinat,
              bukan provinsi.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flat_price" className={labelCls}>
              Harga Flat (Rp) <span className="text-red-500">*</span>
            </Label>
            <CurrencyInput
              value={formData.flat_price}
              onChange={(value) => handleInputChange("flat_price", value)}
              placeholder="15000"
              className={fieldCls}
            />
            {errors.flat_price && (
              <p className="text-sm text-red-500">{errors.flat_price}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="max_weight" className={labelCls}>
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
              className={`${fieldCls} ${
                errors.max_weight ? "border-red-500" : ""
              }`}
            />
            {errors.max_weight && (
              <p className="text-sm text-red-500">{errors.max_weight}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className={labelCls}>
              Prioritas
            </Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange("priority", value)}
            >
              <SelectTrigger id="priority" className={fieldCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-400">
              Kalau ada 2 program match sekaligus, angka prioritas lebih
              kecil yang dipakai
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="is_active" className={labelCls}>
              Status
            </Label>
            <div className="flex h-11 items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  handleInputChange("is_active", checked)
                }
              />
              <Label htmlFor="is_active" className="text-sm text-slate-700">
                {formData.is_active ? "Aktif" : "Tidak Aktif"}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valid_from" className={labelCls}>
              Berlaku Dari
            </Label>
            <Input
              id="valid_from"
              type="date"
              value={formData.valid_from}
              onChange={(e) => handleInputChange("valid_from", e.target.value)}
              className={fieldCls}
            />
            <p className="text-xs text-slate-400">
              Kosongkan untuk berlaku sejak sekarang
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valid_until" className={labelCls}>
              Berlaku Sampai
            </Label>
            <Input
              id="valid_until"
              type="date"
              value={formData.valid_until}
              onChange={(e) => handleInputChange("valid_until", e.target.value)}
              className={fieldCls}
            />
            <p className="text-xs text-slate-400">
              Kosongkan untuk berlaku selamanya
            </p>
          </div>
        </div>

        {/* Dimensions */}
        <div className="space-y-2">
          <Label className={labelCls}>Dimensi Maksimum (cm, opsional)</Label>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              min="0"
              placeholder="Panjang"
              value={formData.max_length}
              onChange={(e) => handleInputChange("max_length", e.target.value)}
              className={fieldCls}
            />
            <Input
              type="number"
              min="0"
              placeholder="Lebar"
              value={formData.max_width}
              onChange={(e) => handleInputChange("max_width", e.target.value)}
              className={fieldCls}
            />
            <Input
              type="number"
              min="0"
              placeholder="Tinggi"
              value={formData.max_height}
              onChange={(e) => handleInputChange("max_height", e.target.value)}
              className={fieldCls}
            />
          </div>
          <p className="text-xs text-slate-400">
            Limit dimensi baru benar-benar aktif menyaring kalau payload cek
            ongkir membawa dimensi — saat ini belum, jadi hanya limit berat
            yang praktiknya aktif.
          </p>
        </div>

        {/* Covered Provinces */}
        <div className="space-y-2">
          <Label className={labelCls}>
            Cakupan Provinsi <span className="text-red-500">*</span>
          </Label>
          {loadingProvinces ? (
            <div className="flex items-center gap-2 py-4 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat daftar provinsi…
            </div>
          ) : (
            <div
              className={`grid max-h-60 grid-cols-2 gap-2 overflow-y-auto rounded-lg border p-3 sm:grid-cols-3 md:grid-cols-4 ${
                errors.covered_provinces
                  ? "border-red-500"
                  : "border-slate-200"
              }`}
            >
              {provinces.map((province) => (
                <label
                  key={province.id}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
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
          <p className="text-xs text-slate-400">
            {coveredProvinces.length} provinsi dipilih. Nama akan
            di-uppercase otomatis di server.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description" className={labelCls}>
            Deskripsi
          </Label>
          <Textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Contoh: Promo flat ongkir seluruh Jawa & Bali"
            rows={3}
          />
        </div>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-lg border-slate-200"
            onClick={onCancel}
          >
            Batal
          </Button>
          <Button
            type="submit"
            className="h-11 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4" aria-hidden />
            {rate ? "Update Program" : "Simpan Program"}
          </Button>
        </div>
      </form>
    </div>
  );
}
