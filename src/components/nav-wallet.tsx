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
import {
  SIDEBAR_LABEL_CLASS,
  sidebarLinkClass,
} from "@/components/sidebar-nav-styles";

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
        <SidebarGroupLabel className={SIDEBAR_LABEL_CLASS}>Saldo</SidebarGroupLabel>
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
                  aria-current={isActive ? "page" : undefined}
                  className={sidebarLinkClass(isActive)}
                >
                  {item.icon && <item.icon />}
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
