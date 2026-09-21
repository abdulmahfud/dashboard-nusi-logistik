import * as React from "react";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";

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
  /** Ikon lucide di tile bulat. Abaikan jika memakai `iconSrc`. */
  icon?: LucideIcon;
  /** Gambar di /public untuk tile bulat (mis. "/images/wallet3.png"); menggantikan `icon`. */
  iconSrc?: string;
  /** Tombol kembali persegi menggantikan tile ikon (halaman form/detail). */
  back?: { href: string; label?: string };
  /** Slot aksi di kanan judul (mis. tombol Refresh), sebelum ilustrasi. */
  action?: React.ReactNode;
  title: string;
  description?: string;
  /** Path gambar di /public, mis. "/images/wallet2.png". Disembunyikan di mobile. */
  illustration?: string;
  /** Kelas tambahan untuk gambar ilustrasi (mis. lebar). Default lebar 180px. */
  illustrationClassName?: string;
};

export function PageHeader({
  breadcrumb,
  icon: Icon,
  iconSrc,
  back,
  action,
  title,
  description,
  illustration,
  illustrationClassName,
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
          {back ? (
            <Link
              href={back.href}
              aria-label={back.label ?? "Kembali"}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              <ChevronLeft className="h-6 w-6" aria-hidden />
            </Link>
          ) : Icon || iconSrc ? (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 ring-4 ring-white shadow-sm">
            {iconSrc ? (
              <Image
                src={iconSrc}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 select-none"
              />
            ) : Icon ? (
              <Icon className="h-7 w-7" aria-hidden />
            ) : null}
          </span>
          ) : null}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}

        {illustration && (
          <Image
            src={illustration}
            alt=""
            width={200}
            height={114}
            priority
            className={cn(
              "pointer-events-none hidden h-auto w-[180px] shrink-0 select-none md:block",
              illustrationClassName
            )}
          />
        )}
      </div>
    </div>
  );
}
