"use client";

import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useState } from "react";
import { resetPassword } from "@/lib/apiClient";
import { toast } from "sonner";
import { AxiosError } from "axios";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";

export function ResetPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!email || !token) {
    return (
      <div className={cn("flex flex-col items-center gap-4 text-center", className)} {...props}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldAlert className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Link Tidak Valid</h1>
        <p className="text-sm text-slate-500">
          Link reset kata sandi tidak lengkap atau rusak. Silakan minta link baru.
        </p>
        <Link
          href="/forgot-password"
          className="mt-2 text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
        >
          Minta Link Baru
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className={cn("flex flex-col items-center gap-4 text-center", className)} {...props}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Kata Sandi Berhasil Diubah</h1>
        <p className="text-sm text-slate-500">
          Silakan masuk kembali menggunakan kata sandi baru Anda.
        </p>
        <Button
          className="mt-2 h-11 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 font-semibold text-white"
          onClick={() => router.push("/login")}
        >
          Ke Halaman Masuk
        </Button>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      toast.error("Konfirmasi kata sandi tidak cocok.");
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword({
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      });
      setDone(true);
    } catch (error) {
      const message =
        error instanceof AxiosError ? error.response?.data?.message : undefined;
      toast.error(message || "Gagal mereset kata sandi. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Buat Kata Sandi Baru
        </h1>
        <p className="text-sm text-slate-500 md:text-base">
          Untuk akun <span className="font-medium text-slate-700">{email}</span>
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password" className="font-medium text-slate-800">
          Kata Sandi Baru
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimal 8 karakter"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 rounded-xl border-slate-200 pl-11 pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
            aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password_confirmation" className="font-medium text-slate-800">
          Konfirmasi Kata Sandi
        </Label>
        <div className="relative">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            id="password_confirmation"
            type={showPassword ? "text" : "password"}
            placeholder="Ulangi kata sandi baru"
            required
            minLength={8}
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            className="h-12 rounded-xl border-slate-200 pl-11"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-base font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-blue-600"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Menyimpan...
          </>
        ) : (
          "Simpan Kata Sandi Baru"
        )}
      </Button>
    </form>
  );
}
