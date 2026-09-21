import { CheckCircle2, MapPin } from "lucide-react";

type ZipCode = {
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  postalCode: string;
};

type ZipResultsProps = {
  selectedZip: ZipCode | null;
};

const FIELDS: { label: string; key: keyof Omit<ZipCode, "postalCode"> }[] = [
  { label: "Provinsi", key: "provinsi" },
  { label: "Kabupaten / Kota", key: "kabupaten" },
  { label: "Kecamatan / Distrik", key: "kecamatan" },
  { label: "Kelurahan / Desa", key: "desa" },
];

export default function ZipResults({ selectedZip }: ZipResultsProps) {
  if (!selectedZip || !selectedZip.postalCode) {
    return (
      <div className="rounded-xl bg-blue-50 p-6 text-center">
        <p className="text-slate-500">
          Silakan cari dan pilih alamat untuk melihat kode pos.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-5 w-5" aria-hidden />
        </span>
        <h2 className="text-xl font-semibold text-slate-900">Data Kode Pos</h2>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-2xl bg-blue-50 px-5 py-4">
        <MapPin className="h-6 w-6 shrink-0 text-blue-600" aria-hidden />
        <div>
          <p className="text-sm text-slate-500">Kode Pos</p>
          <p className="text-3xl font-bold tabular-nums tracking-wide text-blue-700">
            {selectedZip.postalCode}
          </p>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        {FIELDS.map(({ label, key }) => (
          <div key={key} className="border-b border-slate-100 pb-3">
            <dt className="text-sm text-slate-500">{label}</dt>
            <dd className="mt-0.5 font-semibold text-slate-900">
              {selectedZip[key] || "N/A"}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
