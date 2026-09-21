"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Loader2, Search, Users } from "lucide-react";
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

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
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
    <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
      <header className="mb-5 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Users className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-tight text-slate-900">
            Daftar Alamat Pengiriman
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Kelola dan pilih data pengirim yang tersedia
          </p>
        </div>
      </header>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <Input
          type="text"
          placeholder="Cari Nama Pengirim..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 w-full rounded-lg border-slate-200 bg-white pl-10"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          <span className="ml-2">Memuat data...</span>
        </div>
      )}

      {/* Table */}
      {!loading && (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="h-11 text-xs font-semibold text-slate-500">Nama Pengirim</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-slate-500">Nomor Telepon</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-slate-500">Email</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-slate-500">Alamat</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-slate-500">Lokasi</TableHead>
                  <TableHead className="h-11 text-xs font-semibold text-slate-500 text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((shipper) => (
                    <TableRow
                      key={shipper.id}
                      className="border-slate-100 hover:bg-slate-50/60"
                    >
                      <TableCell className="py-4 font-semibold text-slate-900">
                        {shipper.name}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-slate-700">
                        {shipper.phone || "-"}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-slate-700">
                        {shipper.email || "-"}
                      </TableCell>
                      <TableCell className="max-w-xs truncate py-4 text-sm text-slate-700">
                        {shipper.address || "-"}
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="text-sm">
                          <div className="text-slate-900">
                            {shipper.district}, {shipper.regency}
                          </div>
                          <div className="text-slate-500">
                            {shipper.province} {shipper.postal_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleEditClick(shipper)}
                          disabled={editLoading}
                          title="Edit pengirim"
                          aria-label={`Edit pengirim ${shipper.name}`}
                          className="h-9 w-9 rounded-lg border-blue-200 bg-blue-50 text-blue-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-600 hover:text-white hover:shadow-md"
                        >
                          {editLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Pencil className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-slate-500"
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
            <NumberedPagination
              className="mt-4"
              page={currentPage}
              lastPage={totalPages}
              total={totalItems}
              perPage={perPage}
              disabled={loading}
              onPageChange={handlePageChange}
              onPerPageChange={handlePerPageChange}
            />
          )}
        </>
      )}
    </section>
  );
}
