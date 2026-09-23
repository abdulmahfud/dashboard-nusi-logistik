import { Boxes, Clock, HandCoins } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

const FEATURES = [
  {
    icon: Boxes,
    title: "Multi Ekspedisi",
    description: "Tersedia banyak pilihan ekspedisi terkemuka",
  },
  {
    icon: HandCoins,
    title: "Ongkir Terbaik",
    description: "Bandingkan harga dan pilih ongkir paling hemat",
  },
  {
    icon: Clock,
    title: "Tracking Real-time",
    description: "Pantau status pengiriman secara real-time",
  },
];

/**
 * Layout dua panel untuk halaman auth (login/register): branding di kiri
 * (desktop), kartu form di kanan. Lihat docs/redesain/dashboard.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/60 to-indigo-50 p-0 lg:p-4">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] overflow-hidden bg-white lg:min-h-[calc(100vh-2rem)] lg:grid-cols-[1.15fr_1fr] lg:rounded-3xl lg:shadow-xl lg:shadow-blue-900/5">
        {/* Panel kiri — branding (hanya desktop) */}
        <div className="relative hidden flex-col justify-between gap-6 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-10 lg:flex xl:p-14">
          <div className="space-y-8">
            <div>
              <Image
                src="/images/BhisaKirim_3.png"
                alt="Logo BhisaKirim"
                width={200}
                height={47}
                priority
                className="h-auto w-[200px]"
              />
              <p className="mt-1 text-sm text-slate-500">
                Agregator Pengiriman
              </p>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-slate-900 xl:text-5xl">
                Kelola semua pengiriman
                <br />
                dalam <span className="text-blue-600">satu platform</span>
              </h1>
              <p className="max-w-lg text-base text-slate-600">
                Integrasikan berbagai ekspedisi, bandingkan ongkir, lacak paket,
                dan kelola pengiriman dengan mudah.
              </p>
            </div>
          </div>

          <Image
            src="/images/login-e.jpg"
            alt="Ilustrasi dashboard BhisaKirim dengan truk, paket, dan ekspedisi"
            width={539}
            height={400}
            priority
            className="mx-auto h-auto w-full max-w-[600px] select-none"
          />

          <ul className="grid grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/70 text-blue-600">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Panel kanan — form */}
        <div className="flex items-center justify-center bg-white p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <Image
                src="/images/BhisaKirim_3.png"
                alt="Logo BhisaKirim"
                width={180}
                height={43}
                priority
                className="h-auto w-[180px]"
              />
              <p className="mt-1 text-xs text-slate-500">
                Agregator Pengiriman
              </p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-lg shadow-blue-900/5 md:p-8">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
