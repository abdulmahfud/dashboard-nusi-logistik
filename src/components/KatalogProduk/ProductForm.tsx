"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Save } from "lucide-react";
import { Product, CreateProductPayload } from "@/types/product";
import { itemTypes } from "@/types/dataRegulerForm";
import { CurrencyInput } from "@/components/ui/currency-input";
import { WeightInput } from "@/components/ui/weight-input";

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-800";

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: CreateProductPayload) => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "none",
    weight: "",
    panjang: "",
    lebar: "",
    tinggi: "",
    is_active: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        price: product.price != null ? String(product.price) : "",
        category: product.category || "none",
        // API simpan/kembalikan kg — tampilkan sebagai gram di form, sama
        // seperti input berat di form Kirim Paket, biar linier.
        weight:
          product.weight != null
            ? String(Math.round(Number(product.weight) * 1000))
            : "",
        panjang: product.panjang != null ? String(product.panjang) : "",
        lebar: product.lebar != null ? String(product.lebar) : "",
        tinggi: product.tinggi != null ? String(product.tinggi) : "",
        is_active: product.is_active,
      });
    }
  }, [product]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Nama produk wajib diisi";
    }

    if (!formData.weight || parseInt(formData.weight) <= 0) {
      newErrors.weight = "Berat wajib diisi (lebih dari 0 gram)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitData: CreateProductPayload = {
      name: formData.name.trim(),
      // FE isi gram, API-nya minta kg.
      weight: parseInt(formData.weight) / 1000,
      is_active: formData.is_active,
    };
    if (formData.price) submitData.price = parseFloat(formData.price);
    if (formData.category !== "none") submitData.category = formData.category;
    if (formData.panjang) submitData.panjang = parseInt(formData.panjang);
    if (formData.lebar) submitData.lebar = parseInt(formData.lebar);
    if (formData.tinggi) submitData.tinggi = parseInt(formData.tinggi);

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
          {product ? "Edit Produk" : "Tambah Produk Baru"}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Name */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name" className={labelCls}>
              Nama Produk <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Contoh: Kaos Polos L"
              className={`${fieldCls} ${errors.name ? "border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category" className={labelCls}>
              Kategori
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleInputChange("category", value)}
            >
              <SelectTrigger id="category" className={fieldCls}>
                <SelectValue placeholder="Pilih kategori (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tanpa Kategori</SelectItem>
                {itemTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price" className={labelCls}>
              Harga
            </Label>
            <CurrencyInput
              value={formData.price}
              onChange={(value) => handleInputChange("price", value)}
              placeholder="75000"
              className={fieldCls}
            />
            <p className="text-xs text-slate-400">
              Dipakai sebagai nilai barang default saat buat order
            </p>
          </div>

          {/* Weight */}
          <div className="space-y-2">
            <Label htmlFor="weight" className={labelCls}>
              Berat (gram) <span className="text-red-500">*</span>
            </Label>
            <WeightInput
              id="weight"
              value={formData.weight}
              onChange={(value) => handleInputChange("weight", value)}
              placeholder="300"
              className={`${fieldCls} ${errors.weight ? "border-red-500" : ""}`}
            />
            {errors.weight && (
              <p className="text-sm text-red-500">{errors.weight}</p>
            )}
          </div>

          {/* Is Active */}
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
        </div>

        {/* Dimensions */}
        <div className="space-y-2">
          <Label className={labelCls}>Dimensi (cm, opsional)</Label>
          <div className="grid grid-cols-3 gap-4">
            <Input
              type="number"
              min="0"
              placeholder="Panjang"
              value={formData.panjang}
              onChange={(e) => handleInputChange("panjang", e.target.value)}
              className={fieldCls}
            />
            <Input
              type="number"
              min="0"
              placeholder="Lebar"
              value={formData.lebar}
              onChange={(e) => handleInputChange("lebar", e.target.value)}
              className={fieldCls}
            />
            <Input
              type="number"
              min="0"
              placeholder="Tinggi"
              value={formData.tinggi}
              onChange={(e) => handleInputChange("tinggi", e.target.value)}
              className={fieldCls}
            />
          </div>
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
            {product ? "Update Produk" : "Simpan Produk"}
          </Button>
        </div>
      </form>
    </div>
  );
}
