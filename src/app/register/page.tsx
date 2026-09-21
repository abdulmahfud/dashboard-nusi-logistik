"use client";

import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "@/components/register-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <AuthShell>
      <Suspense fallback={<Skeleton className="h-[560px] w-full" />}>
        <RegisterForm />
      </Suspense>
    </AuthShell>
  );
}
