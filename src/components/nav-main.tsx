"use client";

import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    /** aktif juga untuk sub-path (mis. /dashboard/wallet/riwayat untuk url /dashboard/wallet) */
    matchPrefix?: boolean;
    /** diisi di app-sidebar, tidak dipakai di sini */
    permission?: string;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          {items.map((item) => {
            const isActive = item.matchPrefix
              ? pathname === item.url || pathname.startsWith(`${item.url}/`)
              : pathname === item.url;

            return (
              <SidebarMenuItem key={item.title}>
                <Link
                  href={item.url}
                  aria-current={isActive ? "page" : undefined}
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
