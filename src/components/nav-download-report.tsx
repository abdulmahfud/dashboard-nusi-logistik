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

export function NavDownloadReport({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    matchPrefix?: boolean;
  }[];
}) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarGroupLabel className={SIDEBAR_LABEL_CLASS}>
          Download Report
        </SidebarGroupLabel>
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
