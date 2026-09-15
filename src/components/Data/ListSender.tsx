"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Pencil,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getShippersData,
  getShipperById,
} from "@/lib/apiClient";
import type {
  Shipper,
} from "@/types/dataPengirim";

interface ListSenderProps {
  refreshTrigger?: number;
  onEditShipper?: (shipper: Shipper) => void;
}

export default function ListSender({ refreshTrigger, onEditShipper }: ListSenderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<Shipper[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch shippers data
  const fetchShippers = async (
    search?: string,
    page: number = 1,
    perPageOverride: number = perPage
  ) => {
    try {
      setLoading(true);
      const response = await getShippersData(search, page, perPageOverride);

      if (response.success && response.data) {
        setData(response.data.data);
        setCurrentPage(response.data.current_page);
        setTotalPages(response.data.last_page);
        setTotalItems(response.data.total);

        // Handle empty page after deletion
        if (response.data.data.length === 0 && page > 1) {
          handlePageChange(page - 1);
          return;
        }
      }
    } catch (error) {
      console.error("Error fetching shippers:", error);
      toast.error("Gagal memuat data pengirim");
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial data load and refresh when trigger changes
  useEffect(() => {
    fetchShippers(searchTerm, currentPage, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger, perPage]);

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchShippers(searchTerm, 1, perPage);
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchShippers(searchTerm, page, perPage);
    }
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(Number(value));
    setCurrentPage(1);
  };

  // Handle edit button click
  const handleEditClick = async (shipper: Shipper) => {
    try {
      setEditLoading(true);

      // Get fresh shipper data
      const response = await getShipperById(shipper.id);
      if (response.success && response.data) {
        // Pass shipper data to parent component
        if (onEditShipper) {
          onEditShipper(response.data);
        }
      }
    } catch (error) {
      console.error("Error loading shipper for edit:", error);
      toast.error("Gagal memuat data pengirim untuk diedit");
    } finally {
      setEditLoading(false);
    }
  };


  return (
    <Card className="shadow-md">
      <CardHeader className="p-3">
        <CardTitle className="text-lg font-semibold">
          Daftar Alamat Pengiriman
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Input */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Cari Nama Pengirim..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Memuat data...</span>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pengirim</TableHead>
                <TableHead>Nomor Telepon</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Lokasi</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {data.length > 0 ? (
                    data.map((shipper) => (
                      <TableRow key={shipper.id}>
                        <TableCell className="font-medium">
                          {shipper.name}
                        </TableCell>
                        <TableCell>{shipper.phone || "-"}</TableCell>
                        <TableCell>{shipper.email || "-"}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {shipper.address || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>
                              {shipper.district}, {shipper.regency}
                            </div>
                            <div className="text-gray-500">
                              {shipper.province} {shipper.postal_code}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                      <Button
                        size="icon"
                            variant="outline"
                            onClick={() => handleEditClick(shipper)}
                            disabled={editLoading}
                      >
                            {editLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pencil className="w-4 h-4" />
                            )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center text-gray-500 py-8"
                      >
                        {searchTerm
                          ? "Tidak ada data yang sesuai dengan pencarian."
                          : "Belum ada data pengirim."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

            {/* Pagination */}
            {data.length > 0 && (
              <div className="flex items-center justify-between px-1 mt-4">
                <span className="text-sm text-muted-foreground">
                  Total {totalItems} data
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
                    Halaman {currentPage} dari {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => handlePageChange(1)}
                      disabled={currentPage <= 1 || loading}
                    >
                      <span className="sr-only">Go to first page</span>
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                    >
                      <span className="sr-only">Go to previous page</span>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || loading}
                    >
                      <span className="sr-only">Go to next page</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="hidden h-8 w-8 p-0 lg:flex"
                      onClick={() => handlePageChange(totalPages)}
                      disabled={currentPage >= totalPages || loading}
                    >
                      <span className="sr-only">Go to last page</span>
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
