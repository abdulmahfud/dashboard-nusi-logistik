"use client";

import { cn } from "@/lib/utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { loginWithGoogle, registerCorporate } from "@/lib/apiClient";
import { GoogleLogin } from "@react-oauth/google";
import { AxiosError } from "axios";
import { extractLoginPayload, persistLoginAndRedirect } from "@/lib/auth-session";
import { RegisterFormData, RegisterError, FormErrors } from "@/types/register";
import {
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Lock,
  Mail,
  MapPin,
  Phone,
  User,
  type LucideIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const INPUT_CLASS = "h-12 rounded-xl border-slate-200 pl-11";
const ICON_CLASS =
  "pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400";

const JENIS_USAHA_OPTIONS: { value: string; label: string }[] = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "retail", label: "Retail" },
  { value: "distributor", label: "Distributor" },
  { value: "manufaktur", label: "Manufaktur" },
  { value: "logistik", label: "Logistik" },
  { value: "umkm", label: "UMKM" },
  { value: "lainnya", label: "Lainnya" },
];

const CORPORATE_DOC_ACCEPT = "image/jpeg,image/jpg,image/png,application/pdf";
const CORPORATE_DOC_MAX_BYTES = 5120 * 1024;

type CorporateFormData = {
  company_name: string;
  jenis_usaha: string;
  npwp: string;
  nib: string;
  billing_address: string;
  pic_name: string;
  email: string;
  whatsapp: string;
  password: string;
  password_confirmation: string;
};

type CorporateErrors = Partial<Record<keyof CorporateFormData, string>> & {
  npwp_document?: string;
  nib_document?: string;
  pic_ktp_document?: string;
};

type CorporateDocKey = "npwp_document" | "nib_document" | "pic_ktp_document";

interface FieldProps {
  id: string;
  label: string;
  icon: LucideIcon;
  type: string;
  placeholder: string;
  value: string;
  error?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  autoComplete?: string;
  /** Untuk field password: tampilkan tombol lihat/sembunyikan. */
  reveal?: { visible: boolean; onToggle: () => void };
}

function Field({
  id,
  label,
  icon: Icon,
  type,
  placeholder,
  value,
  error,
  onChange,
  autoComplete,
  reveal,
}: FieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="font-medium text-slate-800">
        {label}
      </Label>
      <div className="relative">
        <Icon className={ICON_CLASS} aria-hidden />
        <Input
          id={id}
          type={reveal ? (reveal.visible ? "text" : "password") : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          value={value}
          onChange={onChange}
          className={cn(INPUT_CLASS, reveal && "pr-11", error && "border-red-500")}
        />
        {reveal && (
          <button
            type="button"
            onClick={reveal.onToggle}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={
              reveal.visible ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
            }
          >
            {reveal.visible ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

function FileField({
  id,
  label,
  file,
  error,
  onChange,
}: {
  id: string;
  label: string;
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="font-medium text-slate-800">
        {label}
      </Label>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-3 transition-colors hover:border-blue-300 hover:bg-blue-50/40",
          error && "border-red-400"
        )}
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <FileText className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-slate-700">
            {file ? file.name : "Pilih atau drag file"}
          </p>
          <p className="text-xs text-slate-400">Format JPG, PNG, PDF (Maks. 5MB)</p>
        </div>
        <Input
          id={id}
          type="file"
          accept={CORPORATE_DOC_ACCEPT}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 rounded-lg border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
          onClick={() => document.getElementById(id)?.click()}
        >
          Pilih
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [tab, setTab] = useState<"personal" | "corporate">("personal");
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [successIsCorporate, setSuccessIsCorporate] = useState(false);

  // ---- Personal ----
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    whatsapp: "",
  });
  const [errors, setErrors] = useState<FormErrors>({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
    whatsapp: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      name: "",
      email: "",
      password: "",
      password_confirmation: "",
      whatsapp: "",
    };

    if (!formData.name.trim()) newErrors.name = "Nama wajib diisi";

    if (!formData.email.trim()) newErrors.email = "Email wajib diisi";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Format email tidak valid";

    if (!formData.password) newErrors.password = "Password wajib diisi";
    else if (formData.password.length < 8)
      newErrors.password = "Password minimal 8 karakter";

    if (!formData.password_confirmation)
      newErrors.password_confirmation = "Konfirmasi password wajib diisi";
    else if (formData.password !== formData.password_confirmation)
      newErrors.password_confirmation = "Password tidak sama";

    if (!formData.whatsapp.trim()) newErrors.whatsapp = "WhatsApp wajib diisi";
    else if (!/^[0-9+\-\s()]+$/.test(formData.whatsapp))
      newErrors.whatsapp = "Format WhatsApp tidak valid";

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Silakan perbaiki kesalahan pada form");
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiClient.post("/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        password_confirmation: formData.password_confirmation,
        whatsapp: formData.whatsapp.trim(),
      });

      if (response.data.success) {
        setRegisteredEmail(formData.email.trim());
        setSuccessIsCorporate(false);
        setSuccessDialogOpen(true);
        toast.success("Registrasi berhasil. Silakan cek email verifikasi Anda.");
      } else {
        toast.error(response.data.message || "Registrasi gagal");
      }
    } catch (error) {
      const registerError = error as RegisterError;
      const errorData = registerError.response?.data;

      if (errorData?.errors) {
        const validationErrors = errorData.errors;
        const newErrors = { ...errors };
        Object.keys(validationErrors).forEach((key) => {
          if (key in newErrors) {
            newErrors[key as keyof FormErrors] = validationErrors[key][0];
          }
        });
        setErrors(newErrors);
        toast.error("Silakan perbaiki kesalahan pada form");
      } else {
        toast.error(errorData?.message || "Registrasi gagal");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleCredential = async (credential?: string) => {
    if (!credential) {
      toast.error("Daftar dengan Google gagal. Silakan coba lagi.");
      return;
    }
    setIsGoogleLoading(true);
    try {
      const data = await loginWithGoogle(credential);
      persistLoginAndRedirect(extractLoginPayload(data));
    } catch (error) {
      const message =
        error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Daftar dengan Google gagal. Silakan coba lagi.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // ---- Corporate ----
  const [corpData, setCorpData] = useState<CorporateFormData>({
    company_name: "",
    jenis_usaha: "",
    npwp: "",
    nib: "",
    billing_address: "",
    pic_name: "",
    email: "",
    whatsapp: "",
    password: "",
    password_confirmation: "",
  });
  const [corpErrors, setCorpErrors] = useState<CorporateErrors>({});
  const [corpFiles, setCorpFiles] = useState<Record<CorporateDocKey, File | null>>({
    npwp_document: null,
    nib_document: null,
    pic_ktp_document: null,
  });
  const [corpShowPassword, setCorpShowPassword] = useState(false);
  const [corpShowPasswordConfirmation, setCorpShowPasswordConfirmation] =
    useState(false);
  const [isCorpLoading, setIsCorpLoading] = useState(false);

  const handleCorpChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setCorpData((prev) => ({ ...prev, [id]: value }));
    setCorpErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const handleCorpFileChange = (key: CorporateDocKey, file: File | null) => {
    if (file) {
      const allowed = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
      if (!allowed.includes(file.type)) {
        toast.error(`"${file.name}": gunakan JPG, PNG, atau PDF.`);
        return;
      }
      if (file.size > CORPORATE_DOC_MAX_BYTES) {
        toast.error(`"${file.name}": ukuran maksimal 5MB.`);
        return;
      }
    }
    setCorpFiles((prev) => ({ ...prev, [key]: file }));
    setCorpErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validateCorpForm = (): boolean => {
    const newErrors: CorporateErrors = {};

    if (!corpData.company_name.trim())
      newErrors.company_name = "Nama perusahaan wajib diisi";
    if (!corpData.jenis_usaha) newErrors.jenis_usaha = "Jenis usaha wajib dipilih";
    if (!corpData.npwp.trim()) newErrors.npwp = "NPWP wajib diisi";
    if (!corpData.nib.trim()) newErrors.nib = "NIB wajib diisi";
    if (!corpData.billing_address.trim())
      newErrors.billing_address = "Alamat perusahaan wajib diisi";
    if (!corpData.pic_name.trim())
      newErrors.pic_name = "Nama penanggung jawab wajib diisi";

    if (!corpData.email.trim()) newErrors.email = "Email wajib diisi";
    else if (!/\S+@\S+\.\S+/.test(corpData.email))
      newErrors.email = "Format email tidak valid";

    if (!corpData.whatsapp.trim()) newErrors.whatsapp = "WhatsApp wajib diisi";
    else if (!/^[0-9+\-\s()]+$/.test(corpData.whatsapp))
      newErrors.whatsapp = "Format WhatsApp tidak valid";

    if (!corpData.password) newErrors.password = "Password wajib diisi";
    else if (corpData.password.length < 8)
      newErrors.password = "Password minimal 8 karakter";

    if (!corpData.password_confirmation)
      newErrors.password_confirmation = "Konfirmasi password wajib diisi";
    else if (corpData.password !== corpData.password_confirmation)
      newErrors.password_confirmation = "Password tidak sama";

    if (!corpFiles.npwp_document) newErrors.npwp_document = "Dokumen NPWP wajib diunggah";
    if (!corpFiles.nib_document) newErrors.nib_document = "Dokumen NIB wajib diunggah";
    if (!corpFiles.pic_ktp_document)
      newErrors.pic_ktp_document = "Dokumen KTP penanggung jawab wajib diunggah";

    setCorpErrors(newErrors);
    return Object.values(newErrors).every((v) => !v);
  };

  const handleCorpSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateCorpForm()) {
      toast.error("Silakan perbaiki kesalahan pada form");
      return;
    }

    setIsCorpLoading(true);

    try {
      const fd = new FormData();
      fd.append("company_name", corpData.company_name.trim());
      fd.append("jenis_usaha", corpData.jenis_usaha);
      fd.append("npwp", corpData.npwp.trim());
      fd.append("nib", corpData.nib.trim());
      fd.append("billing_address", corpData.billing_address.trim());
      fd.append("pic_name", corpData.pic_name.trim());
      fd.append("email", corpData.email.trim());
      fd.append("whatsapp", corpData.whatsapp.trim());
      fd.append("password", corpData.password);
      fd.append("password_confirmation", corpData.password_confirmation);
      fd.append("npwp_document", corpFiles.npwp_document as File);
      fd.append("nib_document", corpFiles.nib_document as File);
      fd.append("pic_ktp_document", corpFiles.pic_ktp_document as File);

      await registerCorporate(fd);

      setRegisteredEmail(corpData.email.trim());
      setSuccessIsCorporate(true);
      setSuccessDialogOpen(true);
      toast.success("Pendaftaran berhasil. Menunggu verifikasi email & persetujuan admin.");
    } catch (error) {
      const registerError = error as RegisterError;
      const errorData = registerError.response?.data;

      if (errorData?.errors) {
        const validationErrors = errorData.errors;
        const newErrors: CorporateErrors = { ...corpErrors };
        Object.keys(validationErrors).forEach((key) => {
          (newErrors as Record<string, string>)[key] = validationErrors[key][0];
        });
        setCorpErrors(newErrors);
        toast.error("Silakan perbaiki kesalahan pada form");
      } else {
        toast.error(errorData?.message || "Pendaftaran gagal");
      }
    } finally {
      setIsCorpLoading(false);
    }
  };

  return (
    <>
      <div className={cn("flex flex-col gap-6", className)} {...props}>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Bergabung dengan BhisaKirim!
          </h1>
          <p className="text-sm text-slate-500 md:text-base">
            Daftarkan akun Anda untuk mulai menggunakan layanan ekspedisi terbaik
          </p>
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "personal" | "corporate")}>
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
            <TabsTrigger
              value="personal"
              className="gap-1.5 rounded-lg py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <User className="h-4 w-4" aria-hidden />
              Pendaftaran Perorangan
            </TabsTrigger>
            <TabsTrigger
              value="corporate"
              className="gap-1.5 rounded-lg py-2.5 text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Building2 className="h-4 w-4" aria-hidden />
              Pendaftaran Perusahaan
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="mt-5">
            <div
              className={cn(
                "mb-5 flex justify-center",
                isGoogleLoading && "pointer-events-none opacity-60"
              )}
            >
              <GoogleLogin
                onSuccess={(credentialResponse) =>
                  void handleGoogleCredential(credentialResponse.credential)
                }
                onError={() =>
                  toast.error("Daftar dengan Google gagal. Silakan coba lagi.")
                }
                theme="outline"
                size="large"
                text="signup_with"
                width="384"
              />
            </div>
            <div className="mb-5 flex items-center gap-3 text-sm text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              atau daftar dengan email
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleSubmit} className="grid gap-5">
              <Field
                id="name"
                label="Nama Lengkap"
                icon={User}
                type="text"
                placeholder="Masukkan nama lengkap"
                autoComplete="name"
                value={formData.name}
                error={errors.name}
                onChange={handleChange}
              />
              <Field
                id="email"
                label="Email"
                icon={Mail}
                type="email"
                placeholder="Masukkan email Anda"
                autoComplete="email"
                value={formData.email}
                error={errors.email}
                onChange={handleChange}
              />
              <Field
                id="whatsapp"
                label="WhatsApp"
                icon={Phone}
                type="tel"
                placeholder="081234567890"
                autoComplete="tel"
                value={formData.whatsapp}
                error={errors.whatsapp}
                onChange={handleChange}
              />
              <Field
                id="password"
                label="Kata Sandi"
                icon={Lock}
                type="password"
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                value={formData.password}
                error={errors.password}
                onChange={handleChange}
                reveal={{
                  visible: showPassword,
                  onToggle: () => setShowPassword((v) => !v),
                }}
              />
              <Field
                id="password_confirmation"
                label="Konfirmasi Kata Sandi"
                icon={Lock}
                type="password"
                placeholder="Ulangi kata sandi"
                autoComplete="new-password"
                value={formData.password_confirmation}
                error={errors.password_confirmation}
                onChange={handleChange}
                reveal={{
                  visible: showPasswordConfirmation,
                  onToggle: () => setShowPasswordConfirmation((v) => !v),
                }}
              />

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-base font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-blue-600"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  "Daftar sebagai Perorangan"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="corporate" className="mt-5">
            <form onSubmit={handleCorpSubmit} className="grid gap-5">
              <Field
                id="company_name"
                label="Nama Perusahaan"
                icon={Building2}
                type="text"
                placeholder="Masukkan nama perusahaan"
                value={corpData.company_name}
                error={corpErrors.company_name}
                onChange={handleCorpChange}
              />

              <div className="grid gap-2">
                <Label htmlFor="jenis_usaha" className="font-medium text-slate-800">
                  Jenis Usaha
                </Label>
                <Select
                  value={corpData.jenis_usaha}
                  onValueChange={(v) => {
                    setCorpData((prev) => ({ ...prev, jenis_usaha: v }));
                    setCorpErrors((prev) => ({ ...prev, jenis_usaha: undefined }));
                  }}
                >
                  <SelectTrigger
                    id="jenis_usaha"
                    className={cn(
                      "h-12 rounded-xl border-slate-200",
                      corpErrors.jenis_usaha && "border-red-500"
                    )}
                  >
                    <SelectValue placeholder="Pilih jenis usaha" />
                  </SelectTrigger>
                  <SelectContent>
                    {JENIS_USAHA_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {corpErrors.jenis_usaha && (
                  <p className="text-sm text-red-500">{corpErrors.jenis_usaha}</p>
                )}
              </div>

              <Field
                id="npwp"
                label="NPWP"
                icon={FileText}
                type="text"
                placeholder="Masukkan NPWP perusahaan"
                value={corpData.npwp}
                error={corpErrors.npwp}
                onChange={handleCorpChange}
              />
              <Field
                id="nib"
                label="NIB"
                icon={FileText}
                type="text"
                placeholder="Masukkan NIB perusahaan"
                value={corpData.nib}
                error={corpErrors.nib}
                onChange={handleCorpChange}
              />

              <div className="grid gap-2">
                <Label htmlFor="billing_address" className="font-medium text-slate-800">
                  Alamat Perusahaan
                </Label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
                  <Textarea
                    id="billing_address"
                    placeholder="Masukkan alamat lengkap perusahaan"
                    value={corpData.billing_address}
                    onChange={handleCorpChange}
                    rows={3}
                    className={cn(
                      "resize-y rounded-xl border-slate-200 pl-11",
                      corpErrors.billing_address && "border-red-500"
                    )}
                  />
                </div>
                {corpErrors.billing_address && (
                  <p className="text-sm text-red-500">{corpErrors.billing_address}</p>
                )}
              </div>

              <FileField
                id="npwp_document"
                label="Upload NPWP"
                file={corpFiles.npwp_document}
                error={corpErrors.npwp_document}
                onChange={(f) => handleCorpFileChange("npwp_document", f)}
              />
              <FileField
                id="nib_document"
                label="Upload NIB"
                file={corpFiles.nib_document}
                error={corpErrors.nib_document}
                onChange={(f) => handleCorpFileChange("nib_document", f)}
              />

              <div className="border-t border-slate-100 pt-1" />

              <Field
                id="pic_name"
                label="Nama Penanggung Jawab"
                icon={User}
                type="text"
                placeholder="Masukkan nama penanggung jawab"
                value={corpData.pic_name}
                error={corpErrors.pic_name}
                onChange={handleCorpChange}
              />
              <Field
                id="email"
                label="Email Perusahaan"
                icon={Mail}
                type="email"
                placeholder="Masukkan email perusahaan"
                autoComplete="email"
                value={corpData.email}
                error={corpErrors.email}
                onChange={handleCorpChange}
              />
              <Field
                id="whatsapp"
                label="WhatsApp"
                icon={Phone}
                type="tel"
                placeholder="081234567890"
                autoComplete="tel"
                value={corpData.whatsapp}
                error={corpErrors.whatsapp}
                onChange={handleCorpChange}
              />
              <FileField
                id="pic_ktp_document"
                label="Upload KTP Penanggung Jawab"
                file={corpFiles.pic_ktp_document}
                error={corpErrors.pic_ktp_document}
                onChange={(f) => handleCorpFileChange("pic_ktp_document", f)}
              />

              <Field
                id="password"
                label="Kata Sandi"
                icon={Lock}
                type="password"
                placeholder="Minimal 8 karakter"
                autoComplete="new-password"
                value={corpData.password}
                error={corpErrors.password}
                onChange={handleCorpChange}
                reveal={{
                  visible: corpShowPassword,
                  onToggle: () => setCorpShowPassword((v) => !v),
                }}
              />
              <Field
                id="password_confirmation"
                label="Konfirmasi Kata Sandi"
                icon={Lock}
                type="password"
                placeholder="Ulangi kata sandi"
                autoComplete="new-password"
                value={corpData.password_confirmation}
                error={corpErrors.password_confirmation}
                onChange={handleCorpChange}
                reveal={{
                  visible: corpShowPasswordConfirmation,
                  onToggle: () => setCorpShowPasswordConfirmation((v) => !v),
                }}
              />

              <Button
                type="submit"
                className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-base font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-blue-600"
                disabled={isCorpLoading}
              >
                {isCorpLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Mendaftar...
                  </>
                ) : (
                  "Daftar sebagai Perusahaan"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-slate-600 md:text-base">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 underline-offset-4 hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader className="items-center text-center sm:text-center">
            <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </span>
            <DialogTitle>Pendaftaran berhasil</DialogTitle>
            <DialogDescription>
              {successIsCorporate
                ? "Link verifikasi email sudah dikirim. Setelah email terverifikasi, akun perusahaan Anda masih perlu disetujui admin sebelum dapat digunakan."
                : "Link verifikasi email sudah dikirim. Cek inbox/spam pada email di bawah ini, lalu verifikasi sebelum login."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-medium text-slate-700">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="break-all">{registeredEmail}</span>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="blueGradientOutline"
              onClick={() => setSuccessDialogOpen(false)}
            >
              Tutup
            </Button>
            <Button
              type="button"
              variant="blueGradient"
              onClick={() => {
                window.location.href = `/login?email=${encodeURIComponent(registeredEmail)}`;
              }}
            >
              Ke halaman login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
