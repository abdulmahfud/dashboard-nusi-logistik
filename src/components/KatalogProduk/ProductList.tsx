"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertTriangle,
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Boxes,
} from "lucide-react";
import { Product } from "@/types/product";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/currency";

const headCls = "h-11 text-xs font-semibold text-slate-500";

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => Promise<void>;
  onToggleStatus: (id: number) => Promise<void>;
}

export function ProductList({
  products,
  isLoading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onToggleStatus,
}: ProductListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const formatDimensions = (product: Product) => {
    if (!product.panjang && !product.lebar && !product.tinggi) return "-";
    return `${product.panjang ?? "-"} x ${product.lebar ?? "-"} x ${
      product.tinggi ?? "-"
    } cm`;
  };

  // Disimpan di API sebagai kg — tampilkan sebagai gram biar linier dengan
  // form Kirim Paket.
  const formatWeightGram = (product: Product) => {
    const grams = Math.round(Number(product.weight) * 1000);
    if (!Number.isFinite(grams)) return "-";
    return `${grams.toLocaleString("id-ID")} gram`;
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedProduct) {
      setDeletingId(selectedProduct.id);
      try {
        await onDelete(selectedProduct.id);
      } catch (error) {
        console.error("Delete error:", error);
      } finally {
        setDeletingId(null);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedProduct(null);
  };

  const handleToggleStatus = async (id: number) => {
    setTogglingId(id);
    try {
      await onToggleStatus(id);
    } catch (error) {
      console.error("Toggle status error:", error);
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex space-x-4">
            <Skeleton className="h-12 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
          <Boxes className="h-9 w-9 text-blue-300" aria-hidden />
        </span>
        <p className="font-semibold text-slate-900">Belum ada produk</p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          Tambahkan produk agar bisa dipilih cepat saat membuat order.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-100">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className={headCls}>Nama Produk</TableHead>
              <TableHead className={headCls}>Kategori</TableHead>
              <TableHead className={headCls}>Berat</TableHead>
              <TableHead className={headCls}>Dimensi</TableHead>
              <TableHead className={headCls}>Harga</TableHead>
              <TableHead className={headCls}>Status</TableHead>
              <TableHead className={`${headCls} text-right`}>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow
                key={product.id}
                className="border-slate-100 hover:bg-slate-50/60"
              >
                <TableCell className="py-4 font-medium text-slate-900">
                  {product.name}
                </TableCell>
                <TableCell className="py-4">
                  {product.category ? (
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {product.category}
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </TableCell>
                <TableCell className="py-4 text-sm text-slate-700">
                  {formatWeightGram(product)}
                </TableCell>
                <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                  {formatDimensions(product)}
                </TableCell>
                <TableCell className="py-4 text-sm text-slate-700">
                  {product.price ? formatRupiah(product.price) : "-"}
                </TableCell>
                <TableCell className="py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      product.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {product.is_active ? "Aktif" : "Tidak Aktif"}
                  </span>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-9 w-9 rounded-lg p-0"
                        disabled={
                          deletingId === product.id ||
                          togglingId === product.id
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdate && (
                        <DropdownMenuItem
                          onClick={() => onEdit(product)}
                          disabled={
                            deletingId === product.id ||
                            togglingId === product.id
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canUpdate && (
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(product.id)}
                          disabled={
                            deletingId === product.id ||
                            togglingId === product.id
                          }
                        >
                          {togglingId === product.id ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                              {product.is_active
                                ? "Menonaktifkan..."
                                : "Mengaktifkan..."}
                            </>
                          ) : product.is_active ? (
                            <>
                              <PowerOff className="mr-2 h-4 w-4" />
                              Nonaktifkan
                            </>
                          ) : (
                            <>
                              <Power className="mr-2 h-4 w-4" />
                              Aktifkan
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                      {canDelete && (
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(product)}
                          className="text-red-600"
                          disabled={
                            deletingId === product.id ||
                            togglingId === product.id
                          }
                        >
                          {deletingId === product.id ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                              Menghapus...
                            </>
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </>
                          )}
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-slate-100">
          <AlertDialogHeader className="items-center text-center sm:text-center">
            <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AlertTriangle className="h-7 w-7" aria-hidden />
            </span>
            <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus produk &quot;
              {selectedProduct?.name}&quot;? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogCancel className="h-10 rounded-lg border-slate-200">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="h-10 rounded-lg bg-rose-600 hover:bg-rose-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
