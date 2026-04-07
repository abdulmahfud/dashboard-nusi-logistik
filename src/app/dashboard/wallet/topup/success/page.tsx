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
import { CheckCircle, ClipboardList, Home, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { getCookie } from "cookies-next";
import { useEffect } from "react";

export default function WalletTopupSuccessPage() {
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (getCookie("token")) {
      void refreshUser();
    }
  }, [refreshUser]);

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
          <Card className="w-full max-w-lg border-green-100 shadow-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-800">
                Pembayaran sedang diproses
              </CardTitle>
              <CardDescription className="text-base text-slate-600">
                Jika Anda baru menyelesaikan pembayaran di Xendit, sistem sedang
                memverifikasi. Saldo dompet akan bertambah beberapa saat setelah
                pembayaran dikonfirmasi — bukan saat halaman ini dibuka.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-muted-foreground text-center text-sm">
                Silakan refresh halaman Dompet atau tunggu notifikasi dari
                aplikasi. Anda juga dapat memeriksa riwayat transaksi.
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <Button
                  asChild
                  className="gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Link href="/dashboard/wallet">
                    <RefreshCw className="h-4 w-4" />
                    Kembali ke Dompet
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/dashboard/wallet/riwayat">
                    <ClipboardList className="h-4 w-4" />
                    Riwayat wallet saya
                  </Link>
                </Button>
              </div>
              <Button asChild variant="ghost" className="gap-2 text-slate-600">
                <Link href="/dashboard">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
