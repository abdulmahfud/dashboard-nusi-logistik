"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ArrowDownToLine, Home, XCircle } from "lucide-react";
import Link from "next/link";

export default function WalletTopupFailedPage() {
  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex w-full items-center justify-between">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col items-center justify-center bg-blue-50/80 p-4 md:p-8">
          <Card className="w-full max-w-lg border-red-100 shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <XCircle className="h-10 w-10 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-900">
                Pembayaran tidak selesai
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Pembayaran top-up dibatalkan, gagal, atau sudah kedaluwarsa.
                Saldo tidak berubah. Anda dapat mencoba top-up lagi dari menu
                Dompet.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Link href="/dashboard/wallet">
                    <ArrowDownToLine className="h-4 w-4" />
                    Coba top-up lagi
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/dashboard">
                    <Home className="h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
