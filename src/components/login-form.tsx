"use client";

import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useEffect, useState } from "react";
import { ApiService } from "@/lib/ApiService";
import { setCookie, deleteCookie } from "cookies-next";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { clearAdminMeCache } from "@/lib/admin-me";
import { setPendingVerificationEmail } from "@/lib/pending-verification-email";

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
      const token = response.data?.token;
      if (!token) {
        throw new Error("Token tidak ditemukan di respons");
      }

      setCookie("token", token, {
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        secure: !isDev,
        sameSite: isDev ? "lax" : "strict",
        ...(isDev ? {} : { domain: ".bhisakirim.com" }),
      });
      // Hindari memakai cache /admin/me milik sesi sebelumnya (bisa memicu redirect salah).
      clearAdminMeCache();

      const isVerified = Boolean(response.data?.user?.email_verified_at);
      if (!isVerified) {
        setPendingVerificationEmail(formData.email);
        toast.error(
          "Email belum diverifikasi. Silakan cek email verifikasi yang dikirimkan saat pendaftaran."
        );
        window.location.href = "/dashboard/verifikasi";
        return;
      }

      // Redirect to dashboard or callback URL
      const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
      // router.push(callbackUrl);
      window.location.href = callbackUrl;

      toast.success("Login berhasil!");
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

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-bold text-blue-500">
          Halo Sahabat BhisaKirim!
        </h1>
        <p className="text-xl text-muted-foreground">
          Silakan masukkan email dan password untuk login ke akun Anda untuk
          segera melakukan hal besar
        </p>
      </div>
      <div className="grid gap-6">
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
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="#"
              className="ml-auto text-sm underline-offset-4 hover:underline"
            >
              Lupa kata sandi?
            </a>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? "border-red-500 pr-10" : "pr-10"}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
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
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-500 text-white rounded-full h-12 font-semibold text-xl hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Login"}
        </Button>
      </div>
      <div className="text-center text-lg font-semibold text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline underline-offset-4">
          Sign up
        </Link>
      </div>
    </form>
  );
}
