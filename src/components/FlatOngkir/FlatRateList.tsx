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
  Tag,
} from "lucide-react";
import { FlatShippingRate } from "@/types/flatShippingRate";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/currency";
import { getVendorBadgeClass } from "@/lib/pricingVendors";

const headCls = "h-11 text-xs font-semibold text-slate-500";

interface FlatRateListProps {
  rates: FlatShippingRate[];
  isLoading: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  onEdit: (rate: FlatShippingRate) => void;
  onDelete: (id: number) => Promise<void>;
  onToggleStatus: (id: number) => Promise<void>;
}

export function FlatRateList({
  rates,
  isLoading,
  canUpdate,
  canDelete,
  onEdit,
  onDelete,
  onToggleStatus,
}: FlatRateListProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRate, setSelectedRate] = useState<FlatShippingRate | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const formatProvinces = (rate: FlatShippingRate) => {
    if (!rate.covered_provinces || rate.covered_provinces.length === 0)
      return "-";
    if (rate.covered_provinces.length <= 2)
      return rate.covered_provinces.join(", ");
    return `${rate.covered_provinces.slice(0, 2).join(", ")} +${
      rate.covered_provinces.length - 2
    } lainnya`;
  };

  const handleDeleteClick = (rate: FlatShippingRate) => {
    setSelectedRate(rate);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedRate) {
      setDeletingId(selectedRate.id);
      try {
        await onDelete(selectedRate.id);
      } catch (error) {
        console.error("Delete error:", error);
      } finally {
        setDeletingId(null);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedRate(null);
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

  if (rates.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
          <Tag className="h-9 w-9 text-blue-300" aria-hidden />
        </span>
        <p className="font-semibold text-slate-900">
          Belum ada program flat ongkir
        </p>
        <p className="mt-1 max-w-xs text-sm text-slate-500">
          Buat program baru untuk memberi harga tetap di rute tertentu.
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
              <TableHead className={headCls}>Nama Program</TableHead>
              <TableHead className={headCls}>Vendor</TableHead>
              <TableHead className={headCls}>Harga Flat</TableHead>
              <TableHead className={headCls}>Cakupan Provinsi</TableHead>
              <TableHead className={headCls}>Maks. Berat</TableHead>
              <TableHead className={headCls}>Prioritas</TableHead>
              <TableHead className={headCls}>Status</TableHead>
              <TableHead className={`${headCls} text-right`}>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => (
              <TableRow
                key={rate.id}
                className="border-slate-100 hover:bg-slate-50/60"
              >
                <TableCell className="py-4 font-medium text-slate-900">
                  {rate.name}
                </TableCell>
                <TableCell className="py-4">
                  {rate.vendor ? (
                    <Badge className={getVendorBadgeClass(rate.vendor)}>
                      {rate.vendor}
                    </Badge>
                  ) : (
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                      Semua
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-4 text-sm font-medium text-emerald-700">
                  {formatRupiah(rate.flat_price)}
                </TableCell>
                <TableCell
                  className="max-w-[220px] truncate py-4 text-sm text-slate-700"
                  title={rate.covered_provinces?.join(", ")}
                >
                  {formatProvinces(rate)}
                </TableCell>
                <TableCell className="py-4 text-sm text-slate-700">
                  {rate.max_weight} kg
                </TableCell>
                <TableCell className="py-4 text-sm text-slate-700">
                  {rate.priority}
                </TableCell>
                <TableCell className="py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                      rate.is_active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {rate.is_active ? "Aktif" : "Tidak Aktif"}
                  </span>
                </TableCell>
                <TableCell className="py-4 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-9 w-9 rounded-lg p-0"
                        disabled={
                          deletingId === rate.id || togglingId === rate.id
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canUpdate && (
                        <DropdownMenuItem
                          onClick={() => onEdit(rate)}
                          disabled={
                            deletingId === rate.id || togglingId === rate.id
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {canUpdate && (
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(rate.id)}
                          disabled={
                            deletingId === rate.id || togglingId === rate.id
                          }
                        >
                          {togglingId === rate.id ? (
                            <>
                              <div className="mr-2 h-4 w-4 animate-spin border-2 border-current border-t-transparent rounded-full" />
                              {rate.is_active
                                ? "Menonaktifkan..."
                                : "Mengaktifkan..."}
                            </>
                          ) : rate.is_active ? (
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
                          onClick={() => handleDeleteClick(rate)}
                          className="text-red-600"
                          disabled={
                            deletingId === rate.id || togglingId === rate.id
                          }
                        >
                          {deletingId === rate.id ? (
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
            <AlertDialogTitle>Hapus Program Flat Ongkir</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus program &quot;
              {selectedRate?.name}&quot;? Tindakan ini tidak dapat
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
