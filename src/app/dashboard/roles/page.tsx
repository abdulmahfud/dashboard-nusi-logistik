"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Edit,
  Trash2,
  Search,
  Shield,
  Users,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { getRolesWithPagination, deleteRole } from "@/lib/apiClient";
import { Role } from "@/types/roles";

import { useAuth } from "@/context/AuthContext";

const headCls = "h-11 text-xs font-semibold text-slate-500";

const actionBtn = "h-9 gap-1.5 rounded-lg border-slate-200 px-3 text-sm";

/** "16 Jul 2025" dan "14:30" */
function formatCreated(value: string): { date: string; time: string } | null {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),
    time: d
      .toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
      .replace(".", ":"),
  };
}

export default function RolesPage() {
  const router = useRouter();
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const { hasPermission, loading: authLoading } = useAuth();

  const fetchRoles = async (
    page = 1,
    searchQuery = "",
    perPageOverride = perPage
  ) => {
    try {
      setLoading(true);
      const response = await getRolesWithPagination(
        searchQuery || undefined,
        page,
        perPageOverride
      );
      setData(response.data.data);
      setCurrentPage(response.data.current_page);
      setTotalPages(response.data.last_page);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Error fetching roles:", error);
      toast.error("Gagal memuat data roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !hasPermission("roles.index")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    fetchRoles(currentPage, search, perPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, perPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRoles(1, search, perPage);
  };

  const handlePerPageChange = (value: number) => {
    setPerPage(value);
    setCurrentPage(1);
  };

  const handleDeleteRole = async (role: Role) => {
    setRoleToDelete(role);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;

    try {
      setDeleting(roleToDelete.id);
      await deleteRole(roleToDelete.id);
      toast.success("Role berhasil dihapus");
      fetchRoles(currentPage, search);
    } catch (error) {
      console.error("Error deleting role:", error);
      toast.error("Gagal menghapus role");
    } finally {
      setDeleting(null);
      setDeleteDialogOpen(false);
      setRoleToDelete(null);
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setRoleToDelete(null);
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
              { label: "List Role" },
            ]}
            icon={Shield}
            title="Management Roles"
            description="Kelola roles dan permissions sistem"
            illustration="/images/role-model.png"
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
                  placeholder="Cari nama role..."
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
                onClick={() => router.push("/dashboard/roles/create")}
                className="h-11 gap-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Tambah Role
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchRoles(currentPage, search, perPage)}
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
                Daftar Roles
              </h2>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600">
                {total} roles
              </span>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className={`${headCls} w-14`}>No</TableHead>
                    <TableHead className={headCls}>Nama Role</TableHead>
                    <TableHead className={headCls}>Guard</TableHead>
                    <TableHead className={headCls}>Permissions</TableHead>
                    <TableHead className={headCls}>Tanggal Dibuat</TableHead>
                    <TableHead className={`${headCls} text-center`}>
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <span className="inline-flex items-center gap-2 text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Memuat data roles...
                        </span>
                      </TableCell>
                    </TableRow>
                  ) : data.length ? (
                    data.map((role, index) => {
                      const created = formatCreated(role.created_at);
                      return (
                        <TableRow
                          key={role.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4 text-sm text-slate-700">
                            {(currentPage - 1) * perPage + index + 1}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-blue-600">
                                <Shield className="h-4 w-4" aria-hidden />
                              </span>
                              <span className="text-sm font-semibold text-slate-900">
                                {role.name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {role.guard_name}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                              <Users
                                className="h-4 w-4 text-slate-400"
                                aria-hidden
                              />
                              {role.permissions.length} permission(s)
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm">
                            {created ? (
                              <span className="inline-flex items-start gap-2">
                                <CalendarDays
                                  className="mt-0.5 h-4 w-4 text-slate-400"
                                  aria-hidden
                                />
                                <span>
                                  <span className="block text-slate-900">
                                    {created.date}
                                  </span>
                                  <span className="block text-xs tabular-nums text-slate-500">
                                    {created.time}
                                  </span>
                                </span>
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex justify-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/roles/${role.id}/edit`
                                  )
                                }
                                className={`${actionBtn} text-slate-700 hover:bg-slate-50`}
                              >
                                <Edit className="h-4 w-4" aria-hidden />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRole(role)}
                                disabled={deleting === role.id}
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
                        colSpan={6}
                        className="h-24 text-center text-slate-500"
                      >
                        Tidak ada data roles.
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
            <DialogTitle>Hapus Role</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus role &quot;
              <span className="font-semibold text-slate-900">
                {roleToDelete?.name}
              </span>
              &quot;? Tindakan ini tidak dapat dibatalkan.
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
