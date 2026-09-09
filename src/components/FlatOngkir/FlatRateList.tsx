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
import { MoreHorizontal, Edit, Trash2, Power, PowerOff, Tag } from "lucide-react";
import { FlatShippingRate } from "@/types/flatShippingRate";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRupiah } from "@/lib/currency";

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
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <Tag className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-2">
            Belum ada program flat ongkir
          </h3>
          <p className="text-sm">
            Buat program baru untuk memberi harga tetap di rute tertentu.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Program</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Harga Flat</TableHead>
              <TableHead>Cakupan Provinsi</TableHead>
              <TableHead>Maks. Berat</TableHead>
              <TableHead>Prioritas</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.map((rate) => (
              <TableRow key={rate.id}>
                <TableCell className="font-medium">{rate.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{rate.vendor || "Semua"}</Badge>
                </TableCell>
                <TableCell className="font-medium text-green-600">
                  {formatRupiah(rate.flat_price)}
                </TableCell>
                <TableCell
                  className="max-w-[220px] truncate"
                  title={rate.covered_provinces?.join(", ")}
                >
                  {formatProvinces(rate)}
                </TableCell>
                <TableCell>{rate.max_weight} kg</TableCell>
                <TableCell>{rate.priority}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      rate.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {rate.is_active ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-8 w-8 p-0"
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
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Program Flat Ongkir</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus program &quot;
              {selectedRate?.name}&quot;? Tindakan ini tidak dapat
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
