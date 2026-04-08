"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { getRolesWithPagination, deleteRole } from "@/lib/apiClient";
import { Role } from "@/types/roles";

import { useAuth } from "@/context/AuthContext";

export default function RolesPage() {
  const router = useRouter();
  const [data, setData] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const { hasPermission, loading: authLoading } = useAuth();

  const fetchRoles = async (page = 1, searchQuery = "") => {
    try {
      setLoading(true);
      const response = await getRolesWithPagination(
        searchQuery || undefined,
        page
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
    fetchRoles(currentPage, search);
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchRoles(1, search);
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

  const columns: ColumnDef<Role>[] = [
    {
      id: "no",
      header: "NO",
      cell: ({ row, table }) => {
        const pageIndex = table.getState().pagination.pageIndex;
        const pageSize = table.getState().pagination.pageSize;

        return (
          <div className="text-center font-mono">
            {pageIndex * pageSize + row.index + 1}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "NAMA ROLE",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-blue-500" />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "guard_name",
      header: "GUARD",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.guard_name}</Badge>
      ),
    },
    {
      accessorKey: "permissions",
      header: "PERMISSIONS",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-gray-500" />
          <span className="text-sm">
            {row.original.permissions.length} permission(s)
          </span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "TANGGAL DIBUAT",
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.created_at).toLocaleDateString("id-ID")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "AKSI",
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              router.push(`/dashboard/roles/${row.original.id}/edit`)
            }
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDeleteRole(row.original)}
            disabled={deleting === row.original.id}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Hapus
          </Button>
        </div>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (authLoading) return null;
  if (!hasPermission("roles.index")) return null;

  if (loading && data.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Memuat data roles...
      </div>
    );
  }

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
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Management Roles</h1>
              <p className="text-gray-600">
                Kelola roles dan permissions sistem
              </p>
            </div>
            <Button
              onClick={() => router.push("/dashboard/roles/create")}
              className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
            >
              <Plus className="h-4 w-4" />
              Tambah Role
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1 flex gap-2">
                <Input
                  placeholder="Cari nama role..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="max-w-sm"
                />
                <Button
                  onClick={handleSearch}
                  disabled={loading}
                  className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
                >
                  <Search className="h-4 w-4" />
                  Cari
                </Button>
              </div>
              <Button
                variant="outline"
                onClick={() => fetchRoles(currentPage, search)}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              Menampilkan {data.length} dari {total} roles
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        Tidak ada data roles.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-2">
              <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                Halaman {currentPage} dari {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || loading}
                >
                  <span className="sr-only">Go to first page</span>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  <span className="sr-only">Go to previous page</span>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="h-8 w-8 p-0"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                >
                  <span className="sr-only">Go to next page</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="hidden h-8 w-8 p-0 lg:flex"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages || loading}
                >
                  <span className="sr-only">Go to last page</span>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Total: {total} roles
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Role</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus role &quot;{roleToDelete?.name}
              &quot;? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={cancelDelete}>
              Batal
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
