"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";
import { StatusBadge } from "@/components/redesign/status-badge";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  RefreshCw,
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Users,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getUsers, deleteUser } from "@/lib/apiClient";
import { User } from "@/types/users";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const headCls = "h-11 text-xs font-semibold text-slate-500";

const actionBtn = "h-9 gap-1.5 rounded-lg border-slate-200 px-3 text-sm";

/** "7 Jul 2026" */
function formatCreated(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function UsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !hasPermission("roles.index")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  const fetchUsers = async (
    page = 1,
    searchQuery = "",
    perPageOverride = perPage
  ) => {
    try {
      setLoading(true);
      const response = await getUsers({
        search: searchQuery || undefined,
        page,
        per_page: perPageOverride,
      });
      setData(response.data.data);
      setCurrentPage(response.data.current_page);
      setTotalPages(response.data.last_page);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Gagal memuat data pengguna");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, search, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchUsers(1, search, perPage);
  };

  const handlePerPageChange = (next: number) => {
    setPerPage(next);
    setCurrentPage(1);
  };

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      setDeleting(userToDelete.id);
      await deleteUser(userToDelete.id);
      toast.success("Pengguna berhasil dihapus");
      fetchUsers(currentPage, search);
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Gagal menghapus pengguna");
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  if (authLoading) return null;
  if (!hasPermission("roles.index")) return null;

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <div className="flex items-center justify-between w-full">
          <div className="flex-1">
            <SiteHeader />
          </div>
          <TopNav />
        </div>

        <div className="flex flex-1 flex-col gap-6 bg-blue-50/80 p-4 pb-10 md:p-6">
          <PageHeader
            breadcrumb={[
              { label: "Beranda", href: "/dashboard" },
              { label: "List User" },
            ]}
            icon={Users}
            title="Management User"
            description="Kelola data pengguna sistem"
            illustration="/images/management.png"
            illustrationClassName="w-[120px]"
          />

          {/* Pencarian */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex w-full flex-1 gap-2 sm:max-w-lg">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <Input
                  placeholder="Cari nama atau email pengguna..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="h-11 rounded-lg border-slate-200 bg-white pl-10"
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading}
                className="h-11 gap-2 rounded-lg bg-blue-600 px-5 text-white hover:bg-blue-700"
              >
                <Search className="h-4 w-4" aria-hidden />
                Cari
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => router.push("/dashboard/users/create")}
                className="h-11 gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Tambah User
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchUsers(currentPage, search)}
                disabled={loading}
                className="h-11 gap-2 rounded-lg border-slate-200"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                  aria-hidden
                />
                Refresh
              </Button>
            </div>
          </div>

          {/* Daftar */}
          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Daftar Pengguna
              </h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                {total} pengguna ditemukan
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className={`${headCls} w-14`}>No</TableHead>
                    <TableHead className={headCls}>Nama</TableHead>
                    <TableHead className={headCls}>Email</TableHead>
                    <TableHead className={headCls}>WhatsApp</TableHead>
                    <TableHead className={headCls}>Roles</TableHead>
                    <TableHead className={headCls}>Status</TableHead>
                    <TableHead className={headCls}>Tanggal Dibuat</TableHead>
                    <TableHead className={`${headCls} text-center`}>
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        <span className="inline-flex items-center gap-2 text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memuat data pengguna...
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : data.length ? (
                    data.map((user, index) => {
                      const isVerified = user.email_verified_at !== null;
                      return (
                        <TableRow
                          key={user.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4 text-sm text-slate-700">
                            {(currentPage - 1) * perPage + index + 1}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600">
                                {user.name?.[0]?.toUpperCase() ?? "U"}
                              </span>
                              <span className="text-sm font-medium text-slate-900">
                                {user.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-slate-700">
                            {user.email}
                          </TableCell>
                          <TableCell className="py-4 text-sm tabular-nums text-slate-700">
                            {user.whatsapp || "-"}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {user.roles.map((role) => (
                                <span
                                  key={role.id}
                                  className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
                                >
                                  {role.name}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <StatusBadge
                              status={isVerified ? "success" : "pending"}
                              label={isVerified ? "VERIFIED" : "UNVERIFIED"}
                              className="text-[11px] font-semibold"
                            />
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm text-slate-700">
                            {formatCreated(user.created_at)}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/dashboard/users/${user.id}/view`)
                                }
                                className={`${actionBtn} text-blue-600 hover:bg-blue-50 hover:text-blue-700`}
                              >
                                <Eye className="h-4 w-4" aria-hidden />
                                Detail
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(`/dashboard/users/${user.id}/edit`)
                                }
                                className={`${actionBtn} text-slate-700 hover:bg-slate-50`}
                              >
                                <Edit className="h-4 w-4" aria-hidden />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                disabled={deleting === user.id}
                                className={`${actionBtn} border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700`}
                              >
                                <Trash2 className="h-4 w-4" aria-hidden />
                                Hapus
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="h-24 text-center text-slate-500"
                      >
                        Tidak ada data pengguna.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <NumberedPagination
              className="mt-2"
              page={currentPage}
              lastPage={totalPages}
              total={total}
              perPage={perPage}
              disabled={loading}
              onPageChange={setCurrentPage}
              onPerPageChange={handlePerPageChange}
            />
          </section>
        </div>
      </SidebarInset>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl border-slate-100 sm:max-w-md">
          <DialogHeader className="items-center text-center sm:text-center">
            <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <Trash2 className="h-7 w-7" aria-hidden />
            </span>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna{" "}
              <span className="font-semibold text-slate-900">
                {userToDelete?.name}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-center">
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="h-10 rounded-lg border-slate-200"
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="h-10 rounded-lg"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
