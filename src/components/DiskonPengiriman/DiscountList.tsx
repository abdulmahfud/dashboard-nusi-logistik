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
  MoreHorizontal,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Percent,
  DollarSign,
} from "lucide-react";
import { ExpeditionDiscount } from "@/types/discount";
import { Skeleton } from "@/components/ui/skeleton";

interface DiscountListProps {
  discounts: ExpeditionDiscount[];
  isLoading: boolean;
  onEdit: (discount: ExpeditionDiscount) => void;
  onDelete: (id: number) => Promise<void>;
  onToggleStatus: (id: number) => Promise<void>;
}

export function DiscountList({
  discounts,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
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
  };

  const getVendorBadgeColor = (vendor: string) => {
    const colors: Record<string, string> = {
      JNTEXPRESS: "bg-blue-100 text-blue-800",
      SAP: "bg-green-100 text-green-800",
      LION: "bg-yellow-100 text-yellow-800",
      SICEPAT: "bg-purple-100 text-purple-800",
      TIKI: "bg-red-100 text-red-800",
      POS: "bg-orange-100 text-orange-800",
    };
    return colors[vendor] || "bg-gray-100 text-gray-800";
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
      <div className="text-center py-12">
        <div className="text-muted-foreground">
          <Percent className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium mb-2">Belum ada diskon</h3>
          <p className="text-sm">
            Mulai dengan menambahkan diskon pertama untuk ekspedisi Anda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vendor</TableHead>
              <TableHead>Diskon</TableHead>
              <TableHead>Min. Order</TableHead>
              <TableHead>Max. Potongan</TableHead>
              <TableHead>Tipe Akun</TableHead>
              <TableHead>Berlaku Sampai</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.map((discount) => (
              <TableRow key={discount.id}>
                <TableCell>
                  <Badge className={getVendorBadgeColor(discount.vendor)}>
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
                  <Badge
                    variant={discount.is_active ? "default" : "secondary"}
                    className={
                      discount.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {discount.is_active ? "Aktif" : "Tidak Aktif"}
                  </Badge>
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
        <AlertDialogContent>
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
