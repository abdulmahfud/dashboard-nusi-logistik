"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormEvent, useState } from "react";
import { requestPasswordReset } from "@/lib/apiClient";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail, MailCheck } from "lucide-react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch {
      toast.error("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <div className={cn("flex flex-col items-center gap-4 text-center", className)} {...props}>
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <MailCheck className="h-7 w-7" aria-hidden />
        </span>
        <h1 className="text-2xl font-bold text-slate-900">Cek Email Anda</h1>
        <p className="text-sm text-slate-500">
          Jika <span className="font-medium text-slate-700">{email}</span> terdaftar,
          kami telah mengirim link reset kata sandi. Tautan berlaku selama{" "}
          <span className="font-medium">10 menit</span>.
        </p>
        <Link
          href="/login"
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Kembali ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn("flex flex-col gap-6", className)}
    >
      <div className="flex flex-col items-center gap-1.5 text-center">
        <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
          Lupa Kata Sandi?
        </h1>
        <p className="text-sm text-slate-500 md:text-base">
          Masukkan email akun Anda, kami akan mengirimkan link untuk reset kata sandi.
        </p>
      </div>

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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            Mengirim...
          </>
        ) : (
          "Kirim Link Reset"
        )}
      </Button>

      <p className="text-center text-sm text-slate-600 md:text-base">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-medium text-blue-600 underline-offset-4 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Kembali ke halaman masuk
        </Link>
      </p>
    </form>
  );
}
