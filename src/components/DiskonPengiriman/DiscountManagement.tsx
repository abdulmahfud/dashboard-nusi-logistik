"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { StatCard } from "@/components/redesign/stat-card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Plus,
  PowerOff,
  RefreshCw,
  RotateCcw,
  Search,
  Tag,
  TicketPercent,
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
  const [perPage, setPerPage] = useState(20);
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
    async (targetPage = 1, overrides?: { search?: string }) => {
      try {
        setIsLoading(true);
        const searchValue = overrides?.search ?? search;
        const response = await getExpeditionDiscounts({
          page: targetPage,
          per_page: perPage,
          search: searchValue || undefined,
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
    [search, vendorFilter, isActiveFilter, userTypeFilter, perPage]
  );

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
  };

  const resetFilters = () => {
    setSearch("");
    setVendorFilter("all");
    setIsActiveFilter("all");
    setUserTypeFilter("all");
    void loadDiscounts(1, { search: "" });
  };

  useEffect(() => {
    loadDiscounts(1);
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorFilter, isActiveFilter, userTypeFilter, perPage]);

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

  const filterActive = (value: string) => isActiveFilter === value;

  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={Tag}
            tone="violet"
            title="Total Diskon Aktif"
            value={String(stats.active_discounts)}
            hint="Diskon yang sedang aktif"
            active={filterActive("1")}
            onClick={() => setIsActiveFilter("1")}
          />
          <StatCard
            icon={PowerOff}
            tone="slate"
            title="Total Diskon Nonaktif"
            value={String(stats.inactive_discounts)}
            hint="Diskon yang dinonaktifkan"
            active={filterActive("0")}
            onClick={() => setIsActiveFilter("0")}
          />
          <StatCard
            icon={Building2}
            tone="orange"
            title="Total Vendor"
            value={String(Object.keys(stats.vendors ?? {}).length)}
            hint="Vendor dengan diskon"
          />
          <StatCard
            icon={TicketPercent}
            tone="blue"
            title="Total Pemakaian"
            value={String(stats.total_usage)}
            hint="Pemakaian seluruh diskon"
          />
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="flex flex-1 gap-2 lg:max-w-md">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              placeholder="Cari deskripsi diskon…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadDiscounts(1)}
              className="h-11 rounded-lg border-slate-200 bg-white pl-9"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => loadDiscounts(1)}
            disabled={isLoading}
            className="h-11 gap-2 rounded-lg border-slate-200"
          >
            <Search className="h-4 w-4" aria-hidden />
            Cari
          </Button>
        </div>
        <Select value={vendorFilter} onValueChange={setVendorFilter}>
          <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white w-full lg:w-[170px]">
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
          <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white w-full lg:w-[170px]">
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
          <SelectTrigger className="h-11 rounded-lg border-slate-200 bg-white w-full lg:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="1">Aktif</SelectItem>
            <SelectItem value="0">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2 lg:ml-auto">
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-lg border-slate-200"
            onClick={resetFilters}
            disabled={isLoading}
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            Reset
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11 gap-2 rounded-lg border-slate-200"
            onClick={() => {
              loadDiscounts(page);
              loadStats();
            }}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </Button>
          <Button
            onClick={handleCreateDiscount}
            className="h-11 gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tambah Diskon
          </Button>
        </div>
      </div>

      {/* Daftar */}
      <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-900">
            Daftar Diskon Ekspedisi
          </h2>
          {total > 0 && (
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
              {total} diskon
            </span>
          )}
        </div>

        <DiscountList
          discounts={discounts}
          isLoading={isLoading}
          onEdit={handleEditDiscount}
          onDelete={handleDeleteDiscount}
          onToggleStatus={handleToggleStatus}
          onCreate={handleCreateDiscount}
        />

        {!isLoading && discounts.length > 0 && (
          <NumberedPagination
            className="mt-2"
            page={page}
            lastPage={lastPage}
            total={total}
            perPage={perPage}
            disabled={isLoading}
            onPageChange={(p) => loadDiscounts(p)}
            onPerPageChange={handlePerPageChange}
          />
        )}
      </section>
    </div>
  );
}
