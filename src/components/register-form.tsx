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
import { Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


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
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-3xl font-bold text-blue-500">
            Bergabung dengan BhisaKirim!
          </h1>
          <p className="text-xl text-muted-foreground">
            Daftarkan akun Anda untuk mulai menggunakan layanan ekspedisi terbaik
          </p>
        </div>
        <div className="grid gap-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              type="text"
              placeholder="Masukkan nama lengkap"
              required
              value={formData.name}
              onChange={handleChange}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              type="tel"
              placeholder="081234567890"
              required
              value={formData.whatsapp}
              onChange={handleChange}
              className={errors.whatsapp ? "border-red-500" : ""}
            />
            {errors.whatsapp && (
              <p className="text-sm text-red-500">{errors.whatsapp}</p>
            )}
          </div>

          <div className="grid gap-2 relative">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 8 karakter"
                required
                value={formData.password}
                onChange={handleChange}
                className={`pr-10 ${errors.password ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
          </div>

          <div className="grid gap-2 relative">
            <Label htmlFor="password_confirmation">Konfirmasi Password</Label>
            <div className="relative">
              <Input
                id="password_confirmation"
                type={showPasswordConfirmation ? "text" : "password"}
                placeholder="Ulangi password"
                required
                value={formData.password_confirmation}
                onChange={handleChange}
                className={`pr-10 ${errors.password_confirmation ? "border-red-500" : ""}`}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                tabIndex={-1}
              >
                {showPasswordConfirmation ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password_confirmation && (
              <p className="text-sm text-red-500">{errors.password_confirmation}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-500 text-white rounded-full h-12 font-semibold text-xl hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? "Mendaftar..." : "Daftar Sekarang"}
          </Button>
        </div>
        <div className="text-center text-lg font-semibold text-muted-foreground">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="underline underline-offset-4 text-blue-500"
          >
            Login di sini
          </Link>
        </div>
      </form>

      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pendaftaran berhasil</DialogTitle>
            <DialogDescription>
              Link verifikasi email sudah dikirim. Cek inbox/spam pada email di
              bawah ini, lalu verifikasi sebelum login.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {registeredEmail}
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
