"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionCard } from "@/components/redesign/section-card";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { Plus, Search } from "lucide-react";
import { ProductForm } from "./ProductForm";
import { ProductList } from "./ProductList";
import { Product, CreateProductPayload } from "@/types/product";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductActive,
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

export function ProductManagement() {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("products.store");
  const canUpdate = hasPermission("products.update");
  const canDelete = hasPermission("products.destroy");

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadProducts = useCallback(
    async (searchQuery = "", targetPage = 1, perPageOverride = perPage) => {
      try {
        setIsLoading(true);
        const response = await getProducts({
          search: searchQuery || undefined,
          page: targetPage,
          per_page: perPageOverride,
        });
        setProducts(response.data.data);
        setPage(response.data.current_page);
        setLastPage(response.data.last_page || 1);
        setTotal(response.data.total);
      } catch (error) {
        console.error("Error loading products:", error);
        toast.error(getErrorMessage(error, "Gagal memuat katalog produk"));
      } finally {
        setIsLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [perPage]
  );

  useEffect(() => {
    loadProducts(search, 1, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  const handleSearch = () => {
    loadProducts(search, 1, perPage);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
  };

  const handleCreateProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleSubmitForm = async (formData: CreateProductPayload) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        toast.success("Produk berhasil diupdate");
      } else {
        await createProduct(formData);
        toast.success("Produk berhasil dibuat");
      }
      handleCloseForm();
      loadProducts(search, page, perPage);
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error(getErrorMessage(error, "Gagal menyimpan produk"));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    const originalProducts = [...products];
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      await deleteProduct(id);
      toast.success("Produk berhasil dihapus");
    } catch (error) {
      setProducts(originalProducts);
      console.error("Error deleting product:", error);
      toast.error(getErrorMessage(error, "Gagal menghapus produk"));
    }
  };

  const handleToggleStatus = async (id: number) => {
    const originalProducts = [...products];
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !p.is_active } : p))
    );

    try {
      await toggleProductActive(id);
      toast.success("Status produk berhasil diubah");
    } catch (error) {
      setProducts(originalProducts);
      console.error("Error toggling product status:", error);
      toast.error(getErrorMessage(error, "Gagal mengubah status produk"));
    }
  };

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onSubmit={handleSubmitForm}
        onCancel={handleCloseForm}
      />
    );
  }

  return (
    <SectionCard
      icon={Search}
      title="Katalog Produk Saya"
      action={
        canCreate ? (
          <Button
            onClick={handleCreateProduct}
            className="h-10 gap-2 rounded-lg bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tambah Produk
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
            placeholder="Cari nama produk…"
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

      <ProductList
        products={products}
        isLoading={isLoading}
        canUpdate={canUpdate}
        canDelete={canDelete}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onToggleStatus={handleToggleStatus}
      />

      {!isLoading && products.length > 0 && (
        <div className="mt-4">
          <NumberedPagination
            page={page}
            lastPage={lastPage}
            total={total}
            perPage={perPage}
            disabled={isLoading}
            onPageChange={(p) => void loadProducts(search, p, perPage)}
            onPerPageChange={handlePerPageChange}
          />
        </div>
      )}
    </SectionCard>
  );
}
