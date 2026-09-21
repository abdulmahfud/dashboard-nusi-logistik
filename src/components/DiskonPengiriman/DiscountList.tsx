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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/redesign/status-badge";
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
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Percent,
  DollarSign,
  Plus,
} from "lucide-react";
import { ExpeditionDiscount } from "@/types/discount";
import { Skeleton } from "@/components/ui/skeleton";
import { getVendorBadgeClass } from "@/lib/pricingVendors";

const headCls = "h-11 text-xs font-semibold text-slate-500";

interface DiscountListProps {
  discounts: ExpeditionDiscount[];
  isLoading: boolean;
  onEdit: (discount: ExpeditionDiscount) => void;
  onDelete: (id: number) => Promise<void>;
  onToggleStatus: (id: number) => Promise<void>;
  /** Dipakai tombol "Tambah Diskon" pada tampilan kosong. */
  onCreate?: () => void;
}

export function DiscountList({
  discounts,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreate,
}: DiscountListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] =
    useState<ExpeditionDiscount | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getDiscountText = (discount: ExpeditionDiscount) => {
    if (discount.discount_type === "percentage") {
      return `${discount.discount_value}%`;
    } else {
      return formatCurrency(discount.discount_value);
    }
  };

  const USER_TYPE_LABEL: Record<string, string> = {
    personal: "Personal",
    corporate: "Corporate",
    agen: "Agen",
  };

  const handleDeleteClick = (discount: ExpeditionDiscount) => {
    setSelectedDiscount(discount);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedDiscount) {
      setDeletingId(selectedDiscount.id);
      try {
        await onDelete(selectedDiscount.id);
      } catch (error) {
        console.error("Delete error:", error);
      } finally {
        setDeletingId(null);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedDiscount(null);
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

  if (discounts.length === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-12 text-center">
        <span className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-blue-50">
          <Percent className="h-10 w-10 text-blue-300" aria-hidden />
        </span>
        <h3 className="text-lg font-semibold text-slate-900">
          Belum ada diskon
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Mulai dengan menambahkan diskon pertama untuk ekspedisi Anda.
        </p>
        {onCreate && (
          <Button
            onClick={onCreate}
            className="mt-6 h-10 gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Tambah Diskon
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className={headCls}>Vendor</TableHead>
              <TableHead className={headCls}>Diskon</TableHead>
              <TableHead className={headCls}>Min. Order</TableHead>
              <TableHead className={headCls}>Max. Potongan</TableHead>
              <TableHead className={headCls}>Tipe Akun</TableHead>
              <TableHead className={headCls}>Berlaku Sampai</TableHead>
              <TableHead className={headCls}>Status</TableHead>
              <TableHead className={`${headCls} text-right`}>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((discount) => (
              <TableRow
                key={discount.id}
                className="border-slate-100 hover:bg-slate-50/60"
              >
                <TableCell>
                  <Badge className={getVendorBadgeClass(discount.vendor)}>
                    {discount.vendor}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {discount.discount_type === "percentage" ? (
                      <Percent className="h-4 w-4 text-green-600" />
                    ) : (
                      <DollarSign className="h-4 w-4 text-green-600" />
                    )}
                    <span className="font-medium text-green-600">
                      {getDiscountText(discount)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {discount.minimum_order_value
                    ? formatCurrency(discount.minimum_order_value)
                    : "-"}
                </TableCell>
                <TableCell>
                  {discount.maximum_discount_amount
                    ? formatCurrency(discount.maximum_discount_amount)
                    : "-"}
                </TableCell>
                <TableCell>
                  {discount.user_type ? (
                    <Badge variant="secondary">
                      {USER_TYPE_LABEL[discount.user_type] ??
                        discount.user_type}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">Semua</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(discount.valid_until)}</TableCell>
                <TableCell>
                  {discount.is_active ? (
                    <StatusBadge status="success" label="Aktif" />
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                      Tidak Aktif
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        disabled={
                          deletingId === discount.id ||
                          togglingId === discount.id
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onEdit(discount)}
                        disabled={
                          deletingId === discount.id ||
                          togglingId === discount.id
                        }
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(discount.id)}
                        disabled={
                          deletingId === discount.id ||
                          togglingId === discount.id
                        }
                      >
                        {togglingId === discount.id ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                            {discount.is_active
                              ? "Menonaktifkan..."
                              : "Mengaktifkan..."}
                          </>
                        ) : discount.is_active ? (
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
                      <DropdownMenuItem
                        onClick={() => handleDeleteClick(discount)}
                        className="text-red-600"
                        disabled={
                          deletingId === discount.id ||
                          togglingId === discount.id
                        }
                      >
                        {deletingId === discount.id ? (
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
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Diskon</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus diskon &quot;
              {selectedDiscount?.description}&quot;? Tindakan ini tidak dapat
              dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
