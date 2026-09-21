"use client";

import { useState, useEffect } from "react";
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
import { ChevronLeft, Loader2, Save } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ExpeditionDiscount } from "@/types/discount";
import { CurrencyInput } from "@/components/ui/currency-input";
import {
  fetchPricingEligibleVendors,
  type PricingVendorOption,
} from "@/lib/pricingVendors";
import { PRIORITY_OPTIONS, DEFAULT_PRIORITY } from "@/lib/priorityScale";
import { getExpeditionDiscounts } from "@/lib/apiClient";
import { toast } from "sonner";

interface DiscountFormProps {
  discount?: ExpeditionDiscount | null;
  onSubmit: (data: ExpeditionDiscount) => void;
  onCancel: () => void;
}

const USER_TYPES = [
  { value: "all", label: "Semua Tipe Akun" },
  { value: "personal", label: "Personal" },
  { value: "corporate", label: "Corporate" },
  { value: "agen", label: "Agen" },
];

const fieldCls = "h-11 rounded-lg border-slate-200 bg-white";
const labelCls = "text-sm font-medium text-slate-800";
const hintCls = "text-xs text-slate-500";

/** Satu isian form: label, kontrol, pesan error, dan petunjuk. */
function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className={labelCls}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      {children}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {hint && <p className={hintCls}>{hint}</p>}
    </div>
  );
}

export function DiscountForm({
  discount,
  onSubmit,
  onCancel,
}: DiscountFormProps) {
  const [formData, setFormData] = useState({
    vendor: "",
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
    priority: DEFAULT_PRIORITY,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vendorOptions, setVendorOptions] = useState<PricingVendorOption[]>(
    []
  );
  const [loadingVendors, setLoadingVendors] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPricingEligibleVendors()
      .then(setVendorOptions)
      .catch(() => toast.error("Gagal memuat daftar vendor"))
      .finally(() => setLoadingVendors(false));
  }, []);

  useEffect(() => {
    if (discount) {
      setFormData({
        vendor: discount.vendor || "",
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
        priority: discount.priority?.toString() || DEFAULT_PRIORITY,
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

    if (!formData.discount_value || parseFloat(formData.discount_value) < 0) {
      newErrors.discount_value = "Nilai diskon tidak boleh negatif";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const submitUserType =
      formData.user_type === "all" ? null : formData.user_type || null;

    setSubmitting(true);
    try {
      // Cek dulu ke list yang ada supaya tidak nabrak constraint unik
      // (vendor, user_type, discount_type) dan dapat pesan 500 mentah dari BE.
      const existing = await getExpeditionDiscounts({
        vendor: formData.vendor,
        user_type: (submitUserType ?? undefined) as
          | "personal"
          | "corporate"
          | "agen"
          | undefined,
      });
      const conflict = existing.data.data.find(
        (d) =>
          d.id !== discount?.id && d.discount_type === formData.discount_type
      );
      if (conflict) {
        toast.error(
          `Sudah ada diskon ${formData.discount_type === "percentage" ? "persentase" : "nilai tetap"} untuk vendor & tipe akun ini ("${conflict.description || "tanpa deskripsi"}"). Edit aturan yang ada, atau ubah vendor/tipe akun/jenis diskon.`
        );
        return;
      }
    } catch (error) {
      console.error("Gagal memeriksa duplikasi diskon:", error);
      // Tidak blocking — kalau pengecekan gagal, biarkan submit lanjut dan BE yang validasi.
    } finally {
      setSubmitting(false);
    }

    // Convert string values to appropriate types
    const submitData = {
      ...formData,
      discount_value: parseFloat(formData.discount_value),
      minimum_order_value: formData.minimum_order_value
        ? parseFloat(formData.minimum_order_value)
        : null,
      maximum_discount_amount:
        formData.discount_type === "percentage" &&
        formData.maximum_discount_amount
          ? parseFloat(formData.maximum_discount_amount)
          : null,
      usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
      priority: parseInt(formData.priority),
      // BE selalu paksa jadi null sekarang — "jenis layanan" tidak dipakai lagi.
      service_type: null,
      user_type: submitUserType,
    };

    onSubmit(submitData as ExpeditionDiscount);
  };

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <header className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-5">
        <button
          type="button"
          onClick={onCancel}
          aria-label="Kembali ke daftar diskon"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {discount ? "Edit Diskon" : "Tambah Diskon Baru"}
          </h2>
          <p className="text-sm text-slate-500">
            {discount
              ? "Ubah aturan diskon ekspedisi."
              : "Buat aturan diskon baru untuk vendor ekspedisi."}
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          {/* Vendor */}
          <Field
            label="Vendor Ekspedisi"
            htmlFor="vendor"
            required
            error={errors.vendor}
          >
            <Select
              value={formData.vendor}
              onValueChange={(value) => handleInputChange("vendor", value)}
              disabled={loadingVendors}
            >
              <SelectTrigger
                id="vendor"
                className={cn(fieldCls, errors.vendor && "border-red-500")}
              >
                <SelectValue
                  placeholder={
                    loadingVendors
                      ? "Memuat daftar vendor..."
                      : "Pilih vendor ekspedisi"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {vendorOptions.map((vendor) => (
                  <SelectItem key={vendor.value} value={vendor.value}>
                    {vendor.label}
                    {!vendor.is_active ? " (Nonaktif)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {/* Discount Type */}
          <Field label="Jenis Diskon" htmlFor="discount_type">
            <Select
              value={formData.discount_type}
              onValueChange={(value) =>
                handleInputChange(
                  "discount_type",
                  value as "percentage" | "fixed_amount"
                )
              }
            >
              <SelectTrigger id="discount_type" className={fieldCls}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Persentase (%)</SelectItem>
                <SelectItem value="fixed_amount">Nilai Tetap (Rp)</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {/* Discount Value */}
          <Field
            label="Nilai Diskon"
            htmlFor="discount_value"
            required
            error={errors.discount_value}
          >
            {formData.discount_type === "percentage" ? (
              <div className="relative">
                <Input
                  id="discount_value"
                  type="number"
                  value={formData.discount_value}
                  onChange={(e) =>
                    handleInputChange("discount_value", e.target.value)
                  }
                  placeholder="10"
                  min="0"
                  max="100"
                  step="0.01"
                  className={cn(
                    fieldCls,
                    "pr-9",
                    errors.discount_value && "border-red-500"
                  )}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                  %
                </span>
              </div>
            ) : (
              <CurrencyInput
                id="discount_value"
                value={formData.discount_value}
                onChange={(value) => handleInputChange("discount_value", value)}
                placeholder="50000"
                className={cn(
                  fieldCls,
                  errors.discount_value && "border-red-500"
                )}
              />
            )}
          </Field>

          {/* Minimum Order Value */}
          <Field
            label="Minimum Nilai Order"
            htmlFor="minimum_order_value"
            error={errors.minimum_order_value}
            hint="Kosongkan jika tidak ada minimum"
          >
            <CurrencyInput
              id="minimum_order_value"
              value={formData.minimum_order_value}
              onChange={(value) =>
                handleInputChange("minimum_order_value", value)
              }
              placeholder="100000"
              className={cn(
                fieldCls,
                errors.minimum_order_value && "border-red-500"
              )}
            />
          </Field>

          {/* Maximum Discount Amount — hanya berlaku untuk diskon persentase */}
          {formData.discount_type === "percentage" && (
            <Field
              label="Maksimal Potongan"
              htmlFor="maximum_discount_amount"
              error={errors.maximum_discount_amount}
              hint="Batasi potongan maksimal untuk diskon persentase. Kosongkan untuk tanpa batas."
            >
              <CurrencyInput
                id="maximum_discount_amount"
                value={formData.maximum_discount_amount}
                onChange={(value) =>
                  handleInputChange("maximum_discount_amount", value)
                }
                placeholder="50000"
                className={cn(
                  fieldCls,
                  errors.maximum_discount_amount && "border-red-500"
                )}
              />
            </Field>
          )}

          {/* User Type */}
          <Field
            label="Tipe Akun"
            htmlFor="user_type"
            hint="Beda tarif untuk customer personal vs corporate (identitas akun). Kosongkan untuk berlaku ke semua tipe akun."
          >
            <Select
              value={formData.user_type}
              onValueChange={(value) => handleInputChange("user_type", value)}
            >
              <SelectTrigger id="user_type" className={fieldCls}>
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
          </Field>

          {/* Priority */}
          <Field
            label="Prioritas"
            htmlFor="priority"
            hint="Pemenang utama tetap potongan terbesar buat customer — prioritas cuma tiebreaker kalau 2 diskon menghasilkan potongan yang persis sama."
          >
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
          </Field>

          {/* Valid From */}
          <Field
            label="Berlaku Dari"
            htmlFor="valid_from"
            hint="Kosongkan untuk berlaku sejak sekarang"
          >
            <Input
              id="valid_from"
              type="datetime-local"
              value={formData.valid_from}
              onChange={(e) => handleInputChange("valid_from", e.target.value)}
              className={fieldCls}
            />
          </Field>

          {/* Valid Until */}
          <Field
            label="Berlaku Sampai"
            htmlFor="valid_until"
            hint="Kosongkan untuk berlaku selamanya"
          >
            <Input
              id="valid_until"
              type="datetime-local"
              value={formData.valid_until}
              onChange={(e) => handleInputChange("valid_until", e.target.value)}
              className={fieldCls}
            />
          </Field>

          {/* Usage Limit */}
          <Field
            label="Batas Penggunaan"
            htmlFor="usage_limit"
            error={errors.usage_limit}
            hint="Kuota GLOBAL — total pemakaian gabungan semua user, bukan per-user. Kosongkan untuk tanpa batas."
          >
            <Input
              id="usage_limit"
              type="number"
              value={formData.usage_limit}
              onChange={(e) => handleInputChange("usage_limit", e.target.value)}
              placeholder="1000"
              min="1"
              className={cn(fieldCls, errors.usage_limit && "border-red-500")}
            />
          </Field>

          {/* Is Active */}
          <Field label="Status" htmlFor="is_active">
            <div className="flex h-11 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) =>
                  handleInputChange("is_active", checked)
                }
              />
              <Label
                htmlFor="is_active"
                className="cursor-pointer text-sm text-slate-700"
              >
                {formData.is_active ? "Aktif" : "Tidak Aktif"}
              </Label>
            </div>
          </Field>
        </div>

        {/* Description */}
        <Field
          label="Deskripsi"
          htmlFor="description"
          error={errors.description}
        >
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Contoh: Diskon 10% untuk semua pengiriman JNT Express"
            rows={3}
            className={cn(
              "rounded-lg border-slate-200 bg-white",
              errors.description && "border-red-500"
            )}
          />
        </Field>

        {/* Submit Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="h-11 rounded-lg border-slate-200 px-6"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="h-11 gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Save className="h-4 w-4" aria-hidden />
            )}
            {submitting
              ? "Memeriksa..."
              : discount
              ? "Update Diskon"
              : "Simpan Diskon"}
          </Button>
        </div>
      </form>
    </section>
  );
}
