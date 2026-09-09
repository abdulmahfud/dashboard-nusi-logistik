"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ArrowLeft, Save } from "lucide-react";
import { Product, CreateProductPayload } from "@/types/product";
import { itemTypes } from "@/types/dataRegulerForm";
import { CurrencyInput } from "@/components/ui/currency-input";
import { WeightInput } from "@/components/ui/weight-input";

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
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <Button variant="ghost" size="sm" onClick={onCancel} className="mr-4">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle className="text-xl font-semibold">
          {product ? "Edit Produk" : "Tambah Produk Baru"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="name">
                Nama Produk <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Contoh: Kaos Polos L"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange("category", value)}
              >
                <SelectTrigger>
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
              <Label htmlFor="price">Harga</Label>
              <CurrencyInput
                value={formData.price}
                onChange={(value) => handleInputChange("price", value)}
                placeholder="75000"
              />
              <p className="text-xs text-muted-foreground">
                Dipakai sebagai nilai barang default saat buat order
              </p>
            </div>

            {/* Weight */}
            <div className="space-y-2">
              <Label htmlFor="weight">
                Berat (gram) <span className="text-red-500">*</span>
              </Label>
              <WeightInput
                id="weight"
                value={formData.weight}
                onChange={(value) => handleInputChange("weight", value)}
                placeholder="300"
                className={errors.weight ? "border-red-500" : ""}
              />
              {errors.weight && (
                <p className="text-sm text-red-500">{errors.weight}</p>
              )}
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

          {/* Dimensions */}
          <div className="space-y-2">
            <Label>Dimensi (cm, opsional)</Label>
            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                min="0"
                placeholder="Panjang"
                value={formData.panjang}
                onChange={(e) => handleInputChange("panjang", e.target.value)}
              />
              <Input
                type="number"
                min="0"
                placeholder="Lebar"
                value={formData.lebar}
                onChange={(e) => handleInputChange("lebar", e.target.value)}
              />
              <Input
                type="number"
                min="0"
                placeholder="Tinggi"
                value={formData.tinggi}
                onChange={(e) => handleInputChange("tinggi", e.target.value)}
              />
            </div>
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
              {product ? "Update Produk" : "Simpan Produk"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
