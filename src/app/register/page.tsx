"use client";

import { RegisterForm } from "@/components/register-form";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const AuthHeroCarousel = dynamic(
  () =>
    import("@/components/auth-hero-carousel").then((m) => m.AuthHeroCarousel),
  {
    ssr: false,
    loading: () => (
      <div className="relative hidden min-h-[320px] flex-col items-center justify-center bg-blue-100 lg:flex bg-muted">
        <Skeleton className="h-64 w-full max-w-lg rounded-lg" />
      </div>
    ),
  }
);

export default function RegisterPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-center flex-1">
          <div className="w-full max-w-xl">
            <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
              <RegisterForm />
            </Suspense>
          </div>
        </div>
      </div>
      <AuthHeroCarousel />
    </div>
  );
}
