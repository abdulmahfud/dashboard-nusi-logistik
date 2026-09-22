import { Landmark } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

/** Logo untuk bank yang sudah tersedia di public/images; sisanya pakai ikon bank umum. */
const BANK_LOGOS: { match: RegExp; src: string }[] = [
  { match: /\bBCA\b/i, src: "/images/bca.png" },
  { match: /\bBRI\b/i, src: "/images/bri.png" },
  { match: /\bBNI\b/i, src: "/images/bni.png" },
  { match: /\bMandiri\b/i, src: "/images/mandiri.png" },
];

export function bankLogoSrc(bankName: string): string | null {
  const found = BANK_LOGOS.find((b) => b.match.test(bankName));
  return found?.src ?? null;
}

/** Tile logo bank; bank tanpa logo di public/images memakai ikon bank umum. */
export function BankLogo({
  bankName,
  className,
}: {
  bankName: string;
  className?: string;
}) {
  const src = bankLogoSrc(bankName);
  return (
    <span
      className={cn(
        "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white p-2",
        className
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={bankName}
          width={64}
          height={64}
          className="h-full w-full object-contain"
        />
      ) : (
        <Landmark className="h-6 w-6 text-slate-400" aria-hidden />
      )}
    </span>
  );
}
