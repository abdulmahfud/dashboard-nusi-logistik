"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Plus,
  Search,
} from "lucide-react";
import { FlatRateForm } from "./FlatRateForm";
import { FlatRateList } from "./FlatRateList";
import {
  FlatShippingRate,
  FlatShippingRatePayload,
} from "@/types/flatShippingRate";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  getFlatShippingRates,
  createFlatShippingRate,
  updateFlatShippingRate,
  deleteFlatShippingRate,
  toggleFlatShippingRateStatus,
} from "@/lib/apiClient";
import { AxiosError } from "axios";

function getErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof AxiosError) {
    const data = err.response?.data as
      | { message?: string; errors?: Record<string, string[]> }
      | undefined;
    if (data?.errors) return Object.values(data.errors).flat()[0] || fallback;
    return data?.message || fallback;
  }
  return fallback;
}

export function FlatRateManagement() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("flat-shipping-rates.create");
  const canUpdate = hasPermission("flat-shipping-rates.update");
  const canDelete = hasPermission("flat-shipping-rates.delete");

  const [rates, setRates] = useState<FlatShippingRate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingRate, setEditingRate] = useState<FlatShippingRate | null>(
    null
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadRates = useCallback(
    async (searchQuery = "", targetPage = 1, perPageOverride = perPage) => {
      try {
        setIsLoading(true);
        const response = await getFlatShippingRates({
          search: searchQuery || undefined,
          page: targetPage,
          per_page: perPageOverride,
        });
        setRates(response.data.data);
        setPage(response.data.current_page);
        setLastPage(response.data.last_page || 1);
        setTotal(response.data.total);
      } catch (error) {
        console.error("Error loading flat shipping rates:", error);
        toast.error(getErrorMessage(error, "Gagal memuat program flat ongkir"));
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perPage]
  );

  useEffect(() => {
    loadRates(search, 1, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  const handleSearch = () => {
    loadRates(search, 1, perPage);
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
  };

  const handleCreateRate = () => {
    setEditingRate(null);
    setShowForm(true);
  };

  const handleEditRate = (rate: FlatShippingRate) => {
    setEditingRate(rate);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRate(null);
  };

  const handleSubmitForm = async (formData: FlatShippingRatePayload) => {
    try {
      if (editingRate) {
        await updateFlatShippingRate(editingRate.id, formData);
        toast.success("Program flat ongkir berhasil diupdate");
      } else {
        await createFlatShippingRate(formData);
        toast.success("Program flat ongkir berhasil dibuat");
      }
      handleCloseForm();
      loadRates(search, page, perPage);
    } catch (error) {
      console.error("Error saving flat shipping rate:", error);
      toast.error(getErrorMessage(error, "Gagal menyimpan program flat ongkir"));
    }
  };

  const handleDeleteRate = async (id: number) => {
    const originalRates = [...rates];
    setRates((prev) => prev.filter((r) => r.id !== id));

    try {
      await deleteFlatShippingRate(id);
      toast.success("Program flat ongkir berhasil dihapus");
    } catch (error) {
      setRates(originalRates);
      console.error("Error deleting flat shipping rate:", error);
      toast.error(getErrorMessage(error, "Gagal menghapus program flat ongkir"));
    }
  };

  const handleToggleStatus = async (id: number) => {
    const originalRates = [...rates];
    setRates((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_active: !r.is_active } : r))
    );

    try {
      await toggleFlatShippingRateStatus(id);
      toast.success("Status program berhasil diubah");
    } catch (error) {
      setRates(originalRates);
      console.error("Error toggling flat shipping rate status:", error);
      toast.error(getErrorMessage(error, "Gagal mengubah status program"));
    }
  };

  if (showForm) {
    return (
      <FlatRateForm
        rate={editingRate}
        onSubmit={handleSubmitForm}
        onCancel={handleCloseForm}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            Program Flat Ongkir
          </CardTitle>
          {canCreate && (
            <Button
              onClick={handleCreateRate}
              className="h-11 px-6 py-4 font-semibold bg-blue-500 text-white hover:bg-blue-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out"
            >
              <Plus className="h-4 w-4" />
              Tambah Program
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cari nama program…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-sm"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleSearch}
              disabled={isLoading}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <FlatRateList
            rates={rates}
            isLoading={isLoading}
            canUpdate={canUpdate}
            canDelete={canDelete}
            onEdit={handleEditRate}
            onDelete={handleDeleteRate}
            onToggleStatus={handleToggleStatus}
          />

          {!isLoading && rates.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-muted-foreground">
                Total {total} program
              </span>
              <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Baris per halaman</p>
                  <Select
                    value={`${perPage}`}
                    onValueChange={handlePerPageChange}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={perPage} />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                  Halaman {page} dari {lastPage}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => loadRates(search, 1, perPage)}
                    disabled={page <= 1 || isLoading}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => loadRates(search, page - 1, perPage)}
                    disabled={page <= 1 || isLoading}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => loadRates(search, page + 1, perPage)}
                    disabled={page >= lastPage || isLoading}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => loadRates(search, lastPage, perPage)}
                    disabled={page >= lastPage || isLoading}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
