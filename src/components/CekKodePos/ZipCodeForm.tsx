import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { Card, CardContent, CardTitle } from "../ui/card";
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
    <Card className="border border-muted rounded-xl shadow-sm mx-2 h-80">
      <CardContent className="h-full flex p-12">
        <div className="relative space-y-6">
          <CardTitle className="text-2xl font-bold text-blue-500">
            Pencarian Kode Pos
          </CardTitle>
          <label className="block font-semibold mb-2">
            Cari kode pos alamat tujuan, isi minimal 3 karakter
          </label>
          <div className="relative" ref={inputRef}>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-2 px-4 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan desa, kecamatan, atau kota (minimal 3 huruf)..."
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                ) : (
                  <Search className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Dropdown hasil pencarian */}
            {showResults && query.length >= 3 && (
              <div className="absolute w-full bg-white border border-gray-300 mt-2 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                {isLoading ? (
                  <div className="p-3 text-center">
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500 mr-2" />
                      <span className="text-gray-500">Mencari...</span>
                    </div>
                  </div>
                ) : filteredResults.length > 0 ? (
                  <ul>
                    {filteredResults.map((result, index) => (
                      <li
                        key={`${result.type}-${result.id}-${index}`}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                        onClick={() => handleSelect(result)}
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {result.full_address}
                        </div>
                        {result.code && (
                          <div className="text-xs text-blue-600 mt-1 font-semibold">
                            Kode Pos: {result.code}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-3 text-sm text-gray-500 text-center">
                    Tidak ada hasil
                  </div>
                )}
              </div>
            )}
          </div>

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
            variant="blueGradient"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
