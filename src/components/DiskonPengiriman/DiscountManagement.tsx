"use client";

import { useCallback, useEffect, useState } from "react";
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
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { DiscountForm } from "./DiscountForm";
import { DiscountList } from "./DiscountList";
import { ExpeditionDiscount } from "@/types/discount";
import { toast } from "sonner";
import {
  getExpeditionDiscounts,
  createExpeditionDiscount,
  updateExpeditionDiscount,
  deleteExpeditionDiscount,
  toggleExpeditionDiscountStatus,
  getExpeditionDiscountStatistics,
} from "@/lib/apiClient";
import {
  fetchPricingEligibleVendors,
  type PricingVendorOption,
} from "@/lib/pricingVendors";

const USER_TYPE_FILTERS = [
  { value: "all", label: "Semua Tipe Akun" },
  { value: "personal", label: "Personal" },
  { value: "corporate", label: "Corporate" },
  { value: "agen", label: "Agen" },
];

interface DiscountStatistics {
  total_discounts: number;
  active_discounts: number;
  inactive_discounts: number;
  total_usage: number;
  vendors: Record<string, number>;
  discount_types: Record<string, number>;
}

export function DiscountManagement() {
  const [discounts, setDiscounts] = useState<ExpeditionDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDiscount, setEditingDiscount] =
    useState<ExpeditionDiscount | null>(null);

  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [vendorOptions, setVendorOptions] = useState<PricingVendorOption[]>(
    []
  );

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [stats, setStats] = useState<DiscountStatistics | null>(null);

  useEffect(() => {
    fetchPricingEligibleVendors()
      .then(setVendorOptions)
      .catch(() => {
        // vendor filter cuma nice-to-have, biarkan kosong kalau gagal
      });
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const response = await getExpeditionDiscountStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error loading discount statistics:", error);
    }
  }, []);

  const loadDiscounts = useCallback(
    async (targetPage = 1) => {
      try {
        setIsLoading(true);
        const response = await getExpeditionDiscounts({
          page: targetPage,
          search: search || undefined,
          vendor: vendorFilter === "all" ? undefined : vendorFilter,
          is_active:
            isActiveFilter === "all" ? undefined : isActiveFilter === "1" ? 1 : 0,
          user_type:
            userTypeFilter === "all"
              ? undefined
              : (userTypeFilter as "personal" | "corporate" | "agen"),
        });

        if (response.status === "success" || response.success) {
          setDiscounts(response.data.data);
          setPage(response.data.current_page);
          setLastPage(response.data.last_page);
          setTotal(response.data.total);
        } else {
          console.log("API returned error status:", response);
          toast.error("Gagal memuat data diskon");
        }
      } catch (error) {
        console.error("Error loading discounts:", error);
        toast.error("Gagal memuat data diskon");
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [search, vendorFilter, isActiveFilter, userTypeFilter]
  );

  useEffect(() => {
    loadDiscounts(1);
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorFilter, isActiveFilter, userTypeFilter]);

  const handleCreateDiscount = () => {
    setEditingDiscount(null);
    setShowForm(true);
  };

  const handleEditDiscount = (discount: ExpeditionDiscount) => {
    setEditingDiscount(discount);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingDiscount(null);
  };

  const handleSubmitForm = async (formData: ExpeditionDiscount) => {
    try {
      if (editingDiscount) {
        const response = await updateExpeditionDiscount(
          editingDiscount.id,
          formData
        );
        if (response.status === "success" || response.success) {
          toast.success("Diskon berhasil diupdate");
        } else {
          toast.error("Gagal mengupdate diskon");
          return;
        }
      } else {
        const response = await createExpeditionDiscount(formData);
        if (response.status === "success" || response.success) {
          toast.success("Diskon berhasil dibuat");
        } else {
          toast.error("Gagal membuat diskon");
          return;
        }
      }
      handleCloseForm();
      loadDiscounts(page);
      loadStats();
    } catch (error) {
      console.error("Error saving discount:", error);
      toast.error("Gagal menyimpan diskon");
    }
  };

  const handleDeleteDiscount = async (id: number) => {
    const originalDiscounts = [...discounts];
    setDiscounts((prev) => prev.filter((discount) => discount.id !== id));

    try {
      const response = await deleteExpeditionDiscount(id);
      if (response.status === "success" || response.success) {
        toast.success("Diskon berhasil dihapus");
        loadDiscounts(page);
        loadStats();
      } else {
        setDiscounts(originalDiscounts);
        toast.error("Gagal menghapus diskon");
      }
    } catch (error) {
      setDiscounts(originalDiscounts);
      console.error("Error deleting discount:", error);
      toast.error("Gagal menghapus diskon");
    }
  };

  const handleToggleStatus = async (id: number) => {
    const originalDiscounts = [...discounts];
    setDiscounts((prev) =>
      prev.map((discount) =>
        discount.id === id
          ? { ...discount, is_active: !discount.is_active }
          : discount
      )
    );

    try {
      const response = await toggleExpeditionDiscountStatus(id);
      if (response.status === "success" || response.success) {
        toast.success("Status diskon berhasil diubah");
        loadDiscounts(page);
        loadStats();
      } else {
        setDiscounts(originalDiscounts);
        toast.error("Gagal mengubah status diskon");
      }
    } catch (error) {
      setDiscounts(originalDiscounts);
      console.error("Error toggling discount status:", error);
      toast.error("Gagal mengubah status diskon");
    }
  };

  if (showForm) {
    return (
      <DiscountForm
        discount={editingDiscount}
        onSubmit={handleSubmitForm}
        onCancel={handleCloseForm}
      />
    );
  }

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Total Diskon</p>
              <p className="text-2xl font-semibold">{stats.total_discounts}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Aktif</p>
              <p className="text-2xl font-semibold text-green-600">
                {stats.active_discounts}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Tidak Aktif</p>
              <p className="text-2xl font-semibold text-muted-foreground">
                {stats.inactive_discounts}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-xs text-muted-foreground">Total Pemakaian</p>
              <p className="text-2xl font-semibold">{stats.total_usage}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            Daftar Diskon Ekspedisi
          </CardTitle>
          <Button
            onClick={handleCreateDiscount}
            className="h-11 px-6 py-4 font-semibold bg-blue-500 text-white hover:bg-blue-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out"
          >
            <Plus className="h-4 w-4" />
            Tambah Diskon
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 gap-2">
              <Input
                placeholder="Cari deskripsi diskon…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadDiscounts(1)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => loadDiscounts(1)}
                disabled={isLoading}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Vendor</SelectItem>
                {vendorOptions.map((vendor) => (
                  <SelectItem key={vendor.value} value={vendor.value}>
                    {vendor.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Tipe Akun" />
              </SelectTrigger>
              <SelectContent>
                {USER_TYPE_FILTERS.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="1">Aktif</SelectItem>
                <SelectItem value="0">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => {
                loadDiscounts(page);
                loadStats();
              }}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          <DiscountList
            discounts={discounts}
            isLoading={isLoading}
            onEdit={handleEditDiscount}
            onDelete={handleDeleteDiscount}
            onToggleStatus={handleToggleStatus}
          />

          {!isLoading && discounts.length > 0 && (
            <div className="flex items-center justify-between px-1 text-sm text-muted-foreground">
              <span>
                Halaman {page} dari {lastPage} · Total {total} diskon
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadDiscounts(page - 1)}
                  disabled={page <= 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadDiscounts(page + 1)}
                  disabled={page >= lastPage || isLoading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
