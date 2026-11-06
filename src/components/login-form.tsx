"use client";

import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useEffect, useState } from "react";
import { ApiService } from "@/lib/ApiService";
import { GoogleLogin } from "@react-oauth/google";
import { deleteCookie } from "cookies-next";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Link from "next/link";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { clearAdminMeCache } from "@/lib/admin-me";
import { loginWithGoogle } from "@/lib/apiClient";
import { extractLoginPayload, persistLoginAndRedirect } from "@/lib/auth-session";

// Check if the environment is production or development
const isDev = process.env.NODE_ENV === "development";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"form">) {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  useEffect(() => {
    const prefEmail = searchParams.get("email");
    if (prefEmail) {
      setFormData((prev) => ({ ...prev, email: prefEmail }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    // Clear error when user types
    setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({ email: "", password: "" });

    try {
      const response = await ApiService.login(
        formData.email,
        formData.password
      );
      persistLoginAndRedirect(extractLoginPayload(response.data), {
        fallbackEmail: formData.email,
        callbackUrl: searchParams.get("callbackUrl") || undefined,
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorMessage = error.response?.data?.message;

        if (errorMessage?.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: "Email tidak ditemukan" }));
          toast.error("Email tidak ditemukan");
        } else if (
          errorMessage?.toLowerCase().includes("verif") ||
          errorMessage?.toLowerCase().includes("verified")
        ) {
          deleteCookie("token", {
            path: "/",
            ...(isDev ? {} : { domain: ".bhisakirim.com" }),
          });
          clearAdminMeCache();
          toast.error(
            "Email belum diverifikasi. Silakan cek email verifikasi yang dikirimkan saat pendaftaran."
          );
        } else if (errorMessage?.toLowerCase().includes("password")) {
          setErrors((prev) => ({ ...prev, password: "Password salah" }));
          toast.error("Password salah");
        } else {
          toast.error(errorMessage || "Login gagal. Silakan coba lagi.");
        }
      } else {
        toast.error("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleCredential = async (credential?: string) => {
    if (!credential) {
      toast.error("Login Google gagal. Silakan coba lagi.");
      return;
    }
    setIsGoogleLoading(true);
    try {
      const data = await loginWithGoogle(credential);
      persistLoginAndRedirect(extractLoginPayload(data), {
        callbackUrl: searchParams.get("callbackUrl") || undefined,
      });
    } catch (error) {
      const message =
        error instanceof AxiosError
          ? error.response?.data?.message
          : undefined;
      toast.error(message || "Login Google gagal. Silakan coba lagi.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Selamat Datang Kembali!
        </h1>
        <p className="text-sm text-slate-500 md:text-base">
          Masuk ke akun Bhisakirim Anda
        </p>
      </div>

      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="email" className="font-medium text-slate-800">
            Email
          </Label>
          <div className="relative">
            <Mail
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              id="email"
              type="email"
              placeholder="Masukkan email Anda"
              required
              value={formData.email}
              onChange={handleChange}
              className={cn(
                "h-12 rounded-xl border-slate-200 pl-11",
                errors.email && "border-red-500"
              )}
            />
          </div>
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="password" className="font-medium text-slate-800">
            Kata Sandi
          </Label>
          <div className="relative">
            <Lock
              className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan kata sandi Anda"
              required
              value={formData.password}
              onChange={handleChange}
              className={cn(
                "h-12 rounded-xl border-slate-200 pl-11 pr-11",
                errors.password && "border-red-500"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={
                showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
              }
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password}</p>
          )}
          <a
            href="#"
            className="ml-auto text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
          >
            Lupa kata sandi?
          </a>
        </div>

        <Button
          type="submit"
          className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-base font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-blue-600"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Memproses...
            </>
          ) : (
            "Masuk"
          )}
        </Button>
      </div>

      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        atau masuk dengan
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <div className={cn("flex justify-center", isGoogleLoading && "pointer-events-none opacity-60")}>
        <GoogleLogin
          onSuccess={(credentialResponse) =>
            void handleGoogleCredential(credentialResponse.credential)
          }
          onError={() => toast.error("Login Google gagal. Silakan coba lagi.")}
          theme="outline"
          size="large"
          text="continue_with"
          width="384"
        />
      </div>

      <p className="text-center text-sm text-slate-600 md:text-base">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-medium text-blue-600 underline-offset-4 hover:underline"
        >
          Daftar sekarang
        </Link>
      </p>
    </form>
  );
}
