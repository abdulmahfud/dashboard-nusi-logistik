"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/redesign/section-card";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { Plus, Search } from "lucide-react";
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

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
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
    <SectionCard
      icon={Search}
      title="Program Flat Ongkir"
      action={
        canCreate ? (
          <Button
            onClick={handleCreateRate}
            className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tambah Program
          </Button>
        ) : undefined
      }
    >
      <div className="mb-4 flex gap-2">
        <div className="relative max-w-sm flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            placeholder="Cari nama program…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="h-11 rounded-lg border-slate-200 bg-white pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleSearch}
          disabled={isLoading}
          className="h-11 w-11 shrink-0 rounded-lg border-slate-200 p-0"
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
        <div className="mt-4">
          <NumberedPagination
            page={page}
            lastPage={lastPage}
            total={total}
            perPage={perPage}
            disabled={isLoading}
            onPageChange={(p) => void loadRates(search, p, perPage)}
            onPerPageChange={handlePerPageChange}
          />
        </div>
      )}
    </SectionCard>
  );
}
