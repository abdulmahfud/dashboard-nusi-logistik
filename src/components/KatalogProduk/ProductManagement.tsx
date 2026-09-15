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

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-semibold">
            Katalog Produk Saya
          </CardTitle>
          {canCreate && (
            <Button
              onClick={handleCreateProduct}
              className="h-11 px-6 py-4 font-semibold bg-blue-500 text-white hover:bg-blue-600 text-sm flex items-center gap-2 rounded-full shadow-md transition duration-300 ease-in-out"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Cari nama produk…"
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
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-muted-foreground">
                Total {total} produk
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
                    onClick={() => loadProducts(search, 1, perPage)}
                    disabled={page <= 1 || isLoading}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => loadProducts(search, page - 1, perPage)}
                    disabled={page <= 1 || isLoading}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    onClick={() => loadProducts(search, page + 1, perPage)}
                    disabled={page >= lastPage || isLoading}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => loadProducts(search, lastPage, perPage)}
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
