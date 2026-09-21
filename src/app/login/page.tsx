"use client";

import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<Skeleton className="h-[440px] w-full" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
