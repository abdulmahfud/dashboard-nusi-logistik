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
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { clearAdminMeCache } from "@/lib/admin-me";
import { setPendingVerificationEmail } from "@/lib/pending-verification-email";

// Check if the environment is production or development
const isDev = process.env.NODE_ENV === "development";

/** Normalisasi bentuk respons login (flat vs nested `data`, token vs access_token). */
function extractLoginPayload(data: unknown): {
  token: string | undefined;
  emailVerifiedAt: string | null | undefined;
} {
  if (!data || typeof data !== "object") {
    return { token: undefined, emailVerifiedAt: undefined };
  }
  const d = data as Record<string, unknown>;
  const tokenFrom = (obj: Record<string, unknown>): string | undefined => {
    const t = obj.token;
    const a = obj.access_token;
    if (typeof t === "string" && t) return t;
    if (typeof a === "string" && a) return a;
    return undefined;
  };

  let token = tokenFrom(d);
  let userRaw: unknown = d.user;

  const inner = d.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const innerObj = inner as Record<string, unknown>;
    token = token || tokenFrom(innerObj);
    if (userRaw == null) userRaw = innerObj.user;
  }

  let emailVerifiedAt: string | null | undefined;
  if (userRaw && typeof userRaw === "object" && !Array.isArray(userRaw)) {
    const ev = (userRaw as Record<string, unknown>).email_verified_at;
    if (ev === null) emailVerifiedAt = null;
    else if (typeof ev === "string") emailVerifiedAt = ev;
  }

  return { token, emailVerifiedAt };
}

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
      const { token, emailVerifiedAt } = extractLoginPayload(response.data);
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

      const isVerified =
        emailVerifiedAt != null && String(emailVerifiedAt).trim() !== "";
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

  // Placeholder: belum ada endpoint BE untuk login Google.
  const handleGoogleLogin = () => {
    toast.info("Login dengan Google segera hadir.");
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

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        className="h-12 w-full gap-3 rounded-xl border-slate-200 text-base font-medium text-slate-800 hover:bg-slate-50"
      >
        <GoogleIcon />
        Google
      </Button>

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

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
