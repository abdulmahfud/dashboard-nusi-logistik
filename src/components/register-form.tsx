"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import apiClient from "@/lib/apiClient";
import { RegisterFormData, RegisterError, FormErrors } from "@/types/register";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
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

interface FieldProps {
  id: keyof RegisterFormData;
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

export function RegisterForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
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
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error when user types
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

    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!formData.password) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    }

    if (!formData.password_confirmation) {
      newErrors.password_confirmation = "Konfirmasi password wajib diisi";
    } else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = "Password tidak sama";
    }

    if (!formData.whatsapp.trim()) {
      newErrors.whatsapp = "WhatsApp wajib diisi";
    } else if (!/^[0-9+\-\s()]+$/.test(formData.whatsapp)) {
      newErrors.whatsapp = "Format WhatsApp tidak valid";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
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
        setSuccessDialogOpen(true);
        toast.success("Registrasi berhasil. Silakan cek email verifikasi Anda.");
      } else {
        toast.error(response.data.message || "Registrasi gagal");
      }
    } catch (error) {
      const registerError = error as RegisterError;
      const errorData = registerError.response?.data;

      if (errorData?.errors) {
        // Handle validation errors
        const validationErrors = errorData.errors;
        const newErrors = { ...errors };

        Object.keys(validationErrors).forEach(key => {
          if (key in newErrors) {
            newErrors[key as keyof FormErrors] = validationErrors[key][0];
          }
        });

        setErrors(newErrors);
        toast.error("Silakan perbaiki kesalahan pada form");
      } else {
        const errorMessage = errorData?.message || "Registrasi gagal";
        toast.error(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className={cn("flex flex-col gap-6", className)}
        {...props}
      >
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Bergabung dengan BhisaKirim!
          </h1>
          <p className="text-sm text-slate-500 md:text-base">
            Daftarkan akun Anda untuk mulai menggunakan layanan ekspedisi terbaik
          </p>
        </div>

        <div className="grid gap-5">
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
              "Daftar Sekarang"
            )}
          </Button>
        </div>

        <p className="text-center text-sm text-slate-600 md:text-base">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-600 underline-offset-4 hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </form>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-md">
          <DialogHeader className="items-center text-center sm:text-center">
            <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" aria-hidden />
            </span>
            <DialogTitle>Pendaftaran berhasil</DialogTitle>
            <DialogDescription>
              Link verifikasi email sudah dikirim. Cek inbox/spam pada email di
              bawah ini, lalu verifikasi sebelum login.
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
