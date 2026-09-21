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
import { Pencil, Search, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  getReceiversData,
  updateReceiver,
  getProvinces,
  getRegencies,
  getDistricts,
} from "@/lib/apiClient";
import type { Receiver, ReceiverFormData } from "@/types/dataPenerima";
import type { Province, Regency, District } from "@/types/dataRegulerForm";

interface RecipientListProps {
  refreshTrigger?: number;
}

export default function RecipientList({ refreshTrigger }: RecipientListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [receivers, setReceivers] = useState<Receiver[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Edit dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReceiver, setEditingReceiver] = useState<Receiver | null>(null);
  const [editFormData, setEditFormData] = useState<ReceiverFormData>({
    name: "",
    phone: "",
    contact: "",
    email: "",
    address: "",
    province: "",
    regency: "",
    district: "",
    postal_code: "",
  });
  const [editErrors, setEditErrors] = useState<{ [key: string]: string }>({});
  const [isUpdating, setIsUpdating] = useState(false);

  // Location dropdown states for edit
  const [editProvinceOptions, setEditProvinceOptions] = useState<Province[]>(
    []
  );
  const [editRegencyOptions, setEditRegencyOptions] = useState<Regency[]>([]);
  const [editDistrictOptions, setEditDistrictOptions] = useState<District[]>(
    []
  );
  const [editProvinceSearch, setEditProvinceSearch] = useState("");
  const [editRegencySearch, setEditRegencySearch] = useState("");
  const [editDistrictSearch, setEditDistrictSearch] = useState("");
  const [editSelectedProvinceName, setEditSelectedProvinceName] = useState("");
  const [editSelectedRegencyName, setEditSelectedRegencyName] = useState("");
  const [editSelectedDistrictName, setEditSelectedDistrictName] = useState("");
  const [editLoadingProvince, setEditLoadingProvince] = useState(false);
  const [editLoadingRegency, setEditLoadingRegency] = useState(false);
  const [editLoadingDistrict, setEditLoadingDistrict] = useState(false);

  // Fetch receivers data
  const fetchReceivers = async (
    search?: string,
    page?: number,
    perPageOverride: number = perPage
  ) => {
    setLoading(true);
    try {
      const response = await getReceiversData(search, page, perPageOverride);
      setReceivers(response.data.data);
      setTotalPages(response.data.last_page);
      setTotalRecords(response.data.total);
      setCurrentPage(response.data.current_page);
    } catch (error) {
      console.error("Error fetching receivers:", error);
      toast.error("Gagal memuat data penerima");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchReceivers("", 1, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPage]);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger) {
      fetchReceivers(searchTerm, currentPage, perPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Search effect - reset to page 1 when searching
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      setCurrentPage(1);
      fetchReceivers(searchTerm, 1, perPage);
    }, 500);

    return () => clearTimeout(delayedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  // Edit dialog location effects
  useEffect(() => {
    if (editProvinceSearch.length >= 3) {
      setEditLoadingProvince(true);
      getProvinces().then((res) => {
        setEditProvinceOptions(
          res.data.filter((prov) =>
            prov.name.toLowerCase().includes(editProvinceSearch.toLowerCase())
          )
        );
        setEditLoadingProvince(false);
      });
    } else {
      setEditProvinceOptions([]);
    }
  }, [editProvinceSearch]);

  useEffect(() => {
    if (editFormData.province && editRegencySearch.length >= 3) {
      setEditLoadingRegency(true);
      getRegencies(Number(editFormData.province)).then((res) => {
        setEditRegencyOptions(
          res.data.filter((reg) =>
            reg.name.toLowerCase().includes(editRegencySearch.toLowerCase())
          )
        );
        setEditLoadingRegency(false);
      });
    } else {
      setEditRegencyOptions([]);
    }
  }, [editFormData.province, editRegencySearch]);

  useEffect(() => {
    if (editFormData.regency && editDistrictSearch.length >= 3) {
      setEditLoadingDistrict(true);
      getDistricts(Number(editFormData.regency)).then((res) => {
        setEditDistrictOptions(
          res.data.filter((dist) =>
            dist.name.toLowerCase().includes(editDistrictSearch.toLowerCase())
          )
        );
        setEditLoadingDistrict(false);
      });
    } else {
      setEditDistrictOptions([]);
    }
  }, [editFormData.regency, editDistrictSearch]);

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page !== currentPage && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      fetchReceivers(searchTerm, page, perPage);
    }
  };

  // Handle edit
  const handleEdit = (receiver: Receiver) => {
    setEditingReceiver(receiver);
    setEditFormData({
      name: receiver.name,
      phone: receiver.phone || "",
      contact: receiver.contact || "",
      email: receiver.email || "",
      address: receiver.address || "",
      province: "", // Will be set when location loads
      regency: "",
      district: "",
      postal_code: receiver.postal_code || "",
    });

    // Set the display names for locations
    setEditSelectedProvinceName(receiver.province || "");
    setEditSelectedRegencyName(receiver.regency || "");
    setEditSelectedDistrictName(receiver.district || "");
    setEditProvinceSearch(receiver.province || "");
    setEditRegencySearch(receiver.regency || "");
    setEditDistrictSearch(receiver.district || "");

    setEditErrors({});
    setEditDialogOpen(true);
  };

  // Handle edit form change
  const handleEditChange = (field: keyof ReceiverFormData, value: string) => {
    setEditFormData((prev) => ({ ...prev, [field]: value }));
    if (editErrors[field]) {
      setEditErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle edit form submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingReceiver) return;

    // Reset errors
    setEditErrors({});

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!editFormData.name.trim()) {
      newErrors.name = "Nama penerima harus diisi";
    }

    if (!editFormData.phone.trim()) {
      newErrors.phone = "Nomor telepon harus diisi";
    } else {
      const phoneRegex = /^(08|62)\d{8,13}$/;
      if (!phoneRegex.test(editFormData.phone.replace(/[\s-]/g, ""))) {
        newErrors.phone =
          "Format nomor telepon tidak valid. Gunakan format: 08XXXXXXXXXX";
      }
    }

    if (
      editFormData.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editFormData.email)
    ) {
      newErrors.email = "Format email tidak valid";
    }

    if (Object.keys(newErrors).length > 0) {
      setEditErrors(newErrors);
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }

    setIsUpdating(true);

    try {
      const updateData = {
        user_id: editingReceiver.user_id,
        name: editFormData.name,
        phone: editFormData.phone,
        contact: editFormData.name, // Set contact sama dengan name
        email: editFormData.email || undefined,
        address: editFormData.address || undefined,
        province: editSelectedProvinceName || undefined,
        regency: editSelectedRegencyName || undefined,
        district: editSelectedDistrictName || undefined,
        postal_code: editFormData.postal_code || undefined,
      };

      await updateReceiver(editingReceiver.id, updateData);

      toast.success("Data penerima berhasil diupdate!");
      setEditDialogOpen(false);
      fetchReceivers(searchTerm, currentPage);
    } catch (error) {
      console.error("Error updating receiver:", error);
      toast.error("Gagal mengupdate data penerima");
    } finally {
      setIsUpdating(false);
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
            Daftar Penerima Pengiriman
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Kelola dan pilih data penerima yang tersedia
          </p>
        </div>
      </header>
      <div>
        {/* Search Input */}
        <div className="relative mb-4">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <Input
            type="text"
            placeholder="Cari Nama Penerima..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 w-full rounded-lg border-slate-200 bg-white pl-10"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="py-8 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-slate-500">Memuat data...</p>
          </div>
        ) : (
          <>
            {/* Data Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className="w-[15%] text-xs font-semibold text-slate-500">Nama Penerima</TableHead>
                    <TableHead className="w-[12%] text-xs font-semibold text-slate-500">Nomor Telepon</TableHead>
                    <TableHead className="w-[10%] text-xs font-semibold text-slate-500">Email</TableHead>
                    <TableHead className="w-[10%] text-xs font-semibold text-slate-500">Provinsi</TableHead>
                    <TableHead className="w-[10%] text-xs font-semibold text-slate-500">Kota/Kabupaten</TableHead>
                    <TableHead className="w-[10%] text-xs font-semibold text-slate-500">Kecamatan</TableHead>
                    <TableHead className="w-[8%] text-xs font-semibold text-slate-500">Kode Pos</TableHead>
                    <TableHead className="w-[20%] text-xs font-semibold text-slate-500">Alamat</TableHead>
                    <TableHead className="w-[5%] text-center text-xs font-semibold text-slate-500">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receivers.length > 0 ? (
                    receivers.map((receiver) => (
                      <TableRow
                        key={receiver.id}
                        className="border-slate-100 hover:bg-slate-50/60"
                      >
                        <TableCell className="py-4 font-semibold text-slate-900">
                          {receiver.name}
                        </TableCell>
                        <TableCell className="py-4 text-sm text-slate-700">{receiver.phone || "-"}</TableCell>
                        <TableCell className="py-4 text-sm text-slate-700">{receiver.email || "-"}</TableCell>
                        <TableCell className="py-4 text-sm text-slate-700">{receiver.province || "-"}</TableCell>
                        <TableCell className="py-4 text-sm text-slate-700">{receiver.regency || "-"}</TableCell>
                        <TableCell className="py-4 text-sm text-slate-700">{receiver.district || "-"}</TableCell>
                        <TableCell className="py-4 text-sm text-slate-700">{receiver.postal_code || "-"}</TableCell>
                        <TableCell className="max-w-[200px] truncate py-4 text-sm text-slate-700">
                          {receiver.address || "-"}
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <div className="flex justify-center space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="p-1"
                              onClick={() => handleEdit(receiver)}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-8 text-center text-slate-500"
                      >
                        {searchTerm
                          ? "Tidak ada data yang sesuai dengan pencarian."
                          : "Belum ada data penerima."}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalRecords > 0 && (
              <NumberedPagination
                className="mt-4"
                page={currentPage}
                lastPage={totalPages}
                total={totalRecords}
                perPage={perPage}
                disabled={loading}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
              />
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>Edit Data Penerima</DialogTitle>
            <DialogDescription>
              Ubah informasi penerima di bawah ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-name">
                Nama Penerima<span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-name"
                type="text"
                placeholder="Nama lengkap penerima"
                value={editFormData.name}
                onChange={(e) => handleEditChange("name", e.target.value)}
                className={`${editErrors.name ? "border-red-500" : ""}`}
              />
              {editErrors.name && (
                <p className="text-sm text-red-500">{editErrors.name}</p>
              )}
            </div>

            {/* Phone and Email */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-phone">
                  Nomor Telepon<span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-phone"
                  type="number"
                  placeholder="08XXXXXXXXXX"
                  value={editFormData.phone}
                  onChange={(e) => handleEditChange("phone", e.target.value)}
                  className={`${editErrors.phone ? "border-red-500" : ""}`}
                />
                {editErrors.phone && (
                  <p className="text-sm text-red-500">{editErrors.phone}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  placeholder="email@example.com"
                  value={editFormData.email}
                  onChange={(e) => handleEditChange("email", e.target.value)}
                  className={`${editErrors.email ? "border-red-500" : ""}`}
                />
                {editErrors.email && (
                  <p className="text-sm text-red-500">{editErrors.email}</p>
                )}
              </div>
            </div>

            {/* Location Dropdowns */}
            <div className="space-y-4">
              {/* Province */}
              <div className="relative">
                <Label htmlFor="edit-province">Provinsi</Label>
                <Input
                  id="edit-province"
                  placeholder="Cari provinsi..."
                  value={editProvinceSearch}
                  onChange={(e) => {
                    setEditProvinceSearch(e.target.value);
                    handleEditChange("province", "");
                    handleEditChange("regency", "");
                    handleEditChange("district", "");
                    setEditSelectedProvinceName("");
                    setEditSelectedRegencyName("");
                    setEditSelectedDistrictName("");
                    setEditRegencySearch("");
                    setEditDistrictSearch("");
                  }}
                  autoComplete="off"
                />
                {editProvinceSearch.length >= 3 && !editFormData.province && (
                  <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                    {editLoadingProvince ? (
                      <div className="p-2 text-sm text-gray-500">
                        Loading...
                      </div>
                    ) : editProvinceOptions.length > 0 ? (
                      editProvinceOptions.map((prov) => (
                        <div
                          key={prov.id}
                          className="p-2 hover:bg-blue-100 cursor-pointer"
                          onClick={() => {
                            handleEditChange("province", String(prov.id));
                            setEditProvinceSearch(prov.name);
                            setEditSelectedProvinceName(prov.name);
                            setEditRegencySearch("");
                            setEditDistrictSearch("");
                          }}
                        >
                          {prov.name}
                        </div>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-gray-500">
                        Tidak ada hasil
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Regency */}
              <div className="relative">
                <Label htmlFor="edit-regency">Kota/Kabupaten</Label>
                <Input
                  id="edit-regency"
                  placeholder="Cari kota/kabupaten..."
                  value={editRegencySearch}
                  onChange={(e) => {
                    setEditRegencySearch(e.target.value);
                    handleEditChange("regency", "");
                    handleEditChange("district", "");
                    setEditSelectedRegencyName("");
                    setEditSelectedDistrictName("");
                    setEditDistrictSearch("");
                  }}
                  disabled={!editFormData.province}
                  autoComplete="off"
                />
                {editFormData.province &&
                  editRegencySearch.length >= 3 &&
                  !editFormData.regency && (
                    <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                      {editLoadingRegency ? (
                        <div className="p-2 text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : editRegencyOptions.length > 0 ? (
                        editRegencyOptions.map((reg) => (
                          <div
                            key={reg.id}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => {
                              handleEditChange("regency", String(reg.id));
                              setEditRegencySearch(reg.name);
                              setEditSelectedRegencyName(reg.name);
                              setEditDistrictSearch("");
                            }}
                          >
                            {reg.name}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">
                          Tidak ada hasil
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* District */}
              <div className="relative">
                <Label htmlFor="edit-district">Kecamatan</Label>
                <Input
                  id="edit-district"
                  placeholder="Cari kecamatan..."
                  value={editDistrictSearch}
                  onChange={(e) => {
                    setEditDistrictSearch(e.target.value);
                    handleEditChange("district", "");
                    setEditSelectedDistrictName("");
                  }}
                  disabled={!editFormData.regency}
                  autoComplete="off"
                />
                {editFormData.regency &&
                  editDistrictSearch.length >= 3 &&
                  !editFormData.district && (
                    <div className="border rounded bg-white max-h-40 overflow-y-auto absolute z-20 w-full">
                      {editLoadingDistrict ? (
                        <div className="p-2 text-sm text-gray-500">
                          Loading...
                        </div>
                      ) : editDistrictOptions.length > 0 ? (
                        editDistrictOptions.map((dist) => (
                          <div
                            key={dist.id}
                            className="p-2 hover:bg-blue-100 cursor-pointer"
                            onClick={() => {
                              handleEditChange("district", String(dist.id));
                              setEditDistrictSearch(dist.name);
                              setEditSelectedDistrictName(dist.name);
                            }}
                          >
                            {dist.name}
                          </div>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">
                          Tidak ada hasil
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>

            {/* Postal Code */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-postal-code">Kode Pos</Label>
              <Input
                id="edit-postal-code"
                type="text"
                placeholder="12345"
                value={editFormData.postal_code}
                onChange={(e) =>
                  handleEditChange("postal_code", e.target.value)
                }
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="edit-address">Alamat Lengkap</Label>
              <Textarea
                id="edit-address"
                placeholder="Alamat lengkap seperti Jl. atau RT/RW"
                value={editFormData.address}
                onChange={(e) => handleEditChange("address", e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isUpdating}
                className="rounded-lg bg-blue-600 hover:bg-blue-700"
              >
                {isUpdating ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
