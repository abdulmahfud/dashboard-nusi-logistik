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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Pencil, Loader2 } from "lucide-react";
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
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [editLoading, setEditLoading] = useState(false);

  // Fetch shippers data
  const fetchShippers = async (search?: string, page: number = 1) => {
    try {
      setLoading(true);
      const response = await getShippersData(search, page);

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
    fetchShippers(searchTerm, currentPage);
  }, [refreshTrigger]);

  // Handle search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
      fetchShippers(searchTerm, 1);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchShippers(searchTerm, page);
    }
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


  // Generate pagination numbers with ellipsis
  const generatePaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "ellipsis", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "ellipsis",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          "ellipsis",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "ellipsis",
          totalPages
        );
      }
    }

    return pages;
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
            {totalPages > 1 && (
              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-600">
                  Menampilkan {(currentPage - 1) * 5 + 1} -{" "}
                  {Math.min(currentPage * 5, totalItems)} dari {totalItems} data
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1)
                            handlePageChange(currentPage - 1);
                        }}
                        className={
                          currentPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>

                    {generatePaginationNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === "ellipsis" ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page as number);
                            }}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            handlePageChange(currentPage + 1);
                        }}
                        className={
                          currentPage === totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
