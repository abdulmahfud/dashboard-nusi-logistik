"use client";

import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import Link from "next/link";

export function NavWallet({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    /** default true: aktif hanya jika pathname sama persis (hindari /dompet aktif di sub-route) */
    exact?: boolean;
    /** hanya dipakai di sidebar untuk filter; tidak dipakai di sini */
    permission?: string;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>Saldo</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            const exact = item.exact !== false;
            const isActive = exact
              ? pathname === item.url
              : pathname === item.url ||
                pathname.startsWith(`${item.url}/`);

            return (
              <SidebarMenuItem key={item.title}>
                <Link
                  href={item.url}
                  className={`flex items-center gap-2 rounded-md p-2 text-base font-semibold transition
                    ${
                      isActive
                        ? "bg-blue-100 text-blue-500"
                        : "text-slate-600 hover:bg-blue-300 hover:text-white"
                    }
                  `}
                >
                  {item.icon && <item.icon className="h-5 w-5" />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
