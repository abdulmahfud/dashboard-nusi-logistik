"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const loadRates = useCallback(async (searchQuery = "") => {
    try {
      setIsLoading(true);
      const response = await getFlatShippingRates({
        search: searchQuery || undefined,
        per_page: 50,
      });
      setRates(response.data.data);
    } catch (error) {
      console.error("Error loading flat shipping rates:", error);
      toast.error(getErrorMessage(error, "Gagal memuat program flat ongkir"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const handleSearch = () => {
    loadRates(search);
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
      loadRates(search);
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
        </CardContent>
      </Card>
    </div>
  );
}
