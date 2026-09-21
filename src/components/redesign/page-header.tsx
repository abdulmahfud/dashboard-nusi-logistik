import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type PageHeaderCrumb = { label: string; href?: string };

type PageHeaderProps = {
  breadcrumb?: PageHeaderCrumb[];
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Path gambar di /public, mis. "/images/wallet2.png". Disembunyikan di mobile. */
  illustration?: string;
};

export function PageHeader({
  breadcrumb,
  icon: Icon,
  title,
  description,
  illustration,
}: PageHeaderProps) {
  return (
    <div className="space-y-4">
      {breadcrumb && breadcrumb.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumb.map((crumb, i) => {
              const isLast = i === breadcrumb.length - 1;
              return (
                <React.Fragment key={`${crumb.label}-${i}`}>
                  <BreadcrumbItem>
                    {isLast || !crumb.href ? (
                      <BreadcrumbPage className="font-medium text-slate-900">
                        {crumb.label}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-4 ring-white shadow-sm">
            <Icon className="h-7 w-7" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>

        {illustration && (
          <Image
            src={illustration}
            alt=""
            width={200}
            height={114}
            priority
            className="pointer-events-none hidden h-auto w-[180px] shrink-0 select-none md:block"
          />
        )}
      </div>
    </div>
  );
}
