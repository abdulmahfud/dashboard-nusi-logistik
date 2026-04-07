"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldOff } from "lucide-react";
import Link from "next/link";

type Props = {
  title?: string;
  description?: string;
  permissionHint?: string;
};

export function AccessDeniedCard({
  title = "Akses ditolak",
  description = "Anda tidak memiliki izin untuk membuka halaman ini.",
  permissionHint,
}: Props) {
  return (
    <Card className="mx-auto max-w-lg border-amber-200 bg-amber-50/80">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
          <ShieldOff className="h-8 w-8 text-amber-800" />
        </div>
        <CardTitle className="text-lg text-amber-950">{title}</CardTitle>
        <CardDescription className="text-amber-950/90">
          {description}
          {permissionHint && (
            <span className="mt-2 block font-mono text-xs">
              Izin: {permissionHint}
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button asChild variant="default" className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/wallet">Kembali ke Dompet</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
