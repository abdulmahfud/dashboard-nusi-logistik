"use client";

import {
  BellIcon,
  CreditCardIcon,
  LogOutIcon,
  UserCircleIcon,
} from "lucide-react";

import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { ApiService } from "@/lib/ApiService";
import { useAuth } from "@/context/AuthContext";
import { Skeleton } from "./ui/skeleton";
import Link from "next/link";

export function NavUserTop() {
  const { user, loading } = useAuth();
  const { isMobile } = useSidebar();

  const handleLogout = async () => {
    try {
      await ApiService.logout();
      toast.success("Logout berhasil");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Gagal logout. Silakan coba lagi.");
    }
  };

  if (loading) {
    return (
      <SidebarMenu className="sticky top-0 z-40">
        <SidebarMenuItem>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user)
    return (
      <div className="p-6 text-red-600 font-semibold">
        User tidak ditemukan.
      </div>
    );

  return (
    <SidebarMenu className="sticky top-0 z-40">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground px-8"
            >
              <div className="grid flex-1 text-right text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src="/images/user.png" alt={user.name} />
                <AvatarFallback className="rounded-lg">
                  {user.name ? user.name[0] : "U"}
                </AvatarFallback>
              </Avatar>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "bottom"}
            align="center"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="/images/user.png" alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name ? user.name[0] : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/akun/profil"
                  className="flex items-center gap-2"
                >
                  <UserCircleIcon />
                  Profile
                </Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <CreditCardIcon />
                Link Affiliasi
              </DropdownMenuItem> */}
              {/* <DropdownMenuItem>
                <BellIcon />
                Saldo & Komisi
              </DropdownMenuItem> */}
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/wallet"
                  className="flex items-center gap-2"
                >
                  <CreditCardIcon />
                  Withdraw
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/akun/rekening"
                  className="flex items-center gap-2"
                >
                  <BellIcon />
                  Rekening
                </Link>
              </DropdownMenuItem>
              {/* <DropdownMenuItem>
                <BellIcon />
                Pickup Point
              </DropdownMenuItem> */}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
