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

export function NavSupportTickets({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    /** pathname aktif jika sama dengan url atau sub-path (mis. /tickets/5) */
    matchPrefix?: boolean;
    /** hanya pathname sama persis */
    exact?: boolean;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel>Bantuan</SidebarGroupLabel>
        <SidebarMenu>
          {items.map((item) => {
            const usePrefix = item.matchPrefix === true;
            const exactOnly = item.exact === true;
            const isActive = exactOnly
              ? pathname === item.url
              : usePrefix
                ? pathname === item.url ||
                  pathname.startsWith(`${item.url}/`)
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
