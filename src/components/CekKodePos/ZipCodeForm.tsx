import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Info, RotateCcw } from "lucide-react";
import { searchAddressNew } from "@/lib/apiClient";
import { Button } from "../ui/button";

type ZipCode = {
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  postalCode: string;
};

type ZipCodeFormProps = {
  onSelectZip: (zip: ZipCode) => void;
};

interface AddressResult {
  type: "postal_code" | "subdistrict";
  id: number;
  name: string | number;
  full_address: string;
  code?: number | null;
  province: string;
  regency: string;
  district: string;
  subdistrict: string;
  province_id: number;
  regency_id: number;
  district_id: number;
  subdistrict_id: number;
}

export default function ZipCodeForm({ onSelectZip }: ZipCodeFormProps) {
  const [query, setQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search address
  useEffect(() => {
    if (query.length >= 3) {
      setIsLoading(true);
      const timeoutId = setTimeout(() => {
        searchAddressNew(query)
          .then((response) => {
            setFilteredResults(response.results);
            setShowResults(true);
          })
          .catch((error) => {
            console.error("Error searching address:", error);
            setFilteredResults([]);
          })
          .finally(() => {
            setIsLoading(false);
          });
      }, 300); // Debounce 300ms

      return () => clearTimeout(timeoutId);
    } else {
      setFilteredResults([]);
      setShowResults(false);
    }
  }, [query]);

  const handleSelect = (result: AddressResult) => {
    // Extract postal code from full_address if available
    // Format: "BONGKOT, PURWODADI, PURWOREJO, JAWA TENGAH - 54173"
    let postalCode = "";
    if (result.code) {
      postalCode = result.code.toString();
    } else if (result.full_address.includes(" - ")) {
      postalCode = result.full_address.split(" - ")[1] || "";
    }

    const zipCode: ZipCode = {
      desa: result.subdistrict,
      kecamatan: result.district,
      kabupaten: result.regency,
      provinsi: result.province,
      postalCode: postalCode,
    };

    onSelectZip(zipCode);
    setQuery(result.full_address);
    setShowResults(false);
  };

  return (
    <section className="flex flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
      <div className="flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Search className="h-6 w-6" aria-hidden />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-blue-600">
            Pencarian Kode Pos
          </h2>
          <p className="text-sm text-slate-500">
            Cari kode pos berdasarkan alamat tujuan.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <label
          htmlFor="zip-query"
          className="block text-sm font-semibold text-slate-900"
        >
          Alamat Tujuan
        </label>
        <p className="mb-2 text-sm text-slate-500">Minimal 3 karakter</p>

        <div className="relative" ref={inputRef}>
          <div className="relative">
            <input
              id="zip-query"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 pr-11 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              placeholder="Masukkan desa, kecamatan, atau kota"
              autoComplete="off"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
              ) : (
                <Search className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </div>

          {/* Dropdown hasil pencarian */}
          {showResults && query.length >= 3 && (
            <div className="absolute z-10 mt-2 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
              {isLoading ? (
                <div className="p-3 text-center">
                  <div className="flex items-center justify-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-slate-500">Mencari...</span>
                  </div>
                </div>
              ) : filteredResults.length > 0 ? (
                <ul>
                  {filteredResults.map((result, index) => (
                    <li
                      key={`${result.type}-${result.id}-${index}`}
                      className="cursor-pointer border-b border-slate-100 p-3 last:border-b-0 hover:bg-blue-50"
                      onClick={() => handleSelect(result)}
                    >
                      <div className="text-sm font-medium text-slate-900">
                        {result.full_address}
                      </div>
                      {result.code && (
                        <div className="mt-1 text-xs font-semibold text-blue-600">
                          Kode Pos: {result.code}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-3 text-center text-sm text-slate-500">
                  Tidak ada hasil
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
        <p className="flex items-center gap-2 text-sm text-slate-500">
          <Info className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
          <span>
            <span className="font-medium text-blue-600">Contoh:</span> Jakarta,
            Bandung, Sleman
          </span>
        </p>

        {/* Tombol Reset */}
        <Button
          onClick={() => {
            setQuery("");
            setFilteredResults([]);
            onSelectZip({
              desa: "",
              kecamatan: "",
              kabupaten: "",
              provinsi: "",
              postalCode: "",
            });
          }}
          variant="outline"
          className="h-10 gap-2 rounded-lg border-blue-200 px-5 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
        >
          <RotateCcw className="h-4 w-4" aria-hidden />
          Reset
        </Button>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl bg-blue-50 p-4 text-sm text-slate-600">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden />
        <p>
          <span className="font-semibold text-blue-600">Tips:</span> Masukkan
          nama kota atau kecamatan untuk hasil yang lebih akurat.
        </p>
      </div>
    </section>
  );
}
