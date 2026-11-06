"use client";

import { AuthShell } from "@/components/auth-shell";
import { ResetPasswordForm } from "@/components/reset-password-form";
import { Skeleton } from "@/components/ui/skeleton";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<Skeleton className="h-[440px] w-full" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
