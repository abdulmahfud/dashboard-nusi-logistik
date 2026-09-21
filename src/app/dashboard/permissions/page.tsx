"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";
import { NumberedPagination } from "@/components/redesign/numbered-pagination";
import { PageHeader } from "@/components/redesign/page-header";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  CalendarDays,
  RefreshCw,
  Search,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { getAllPermissions } from "@/lib/apiClient";
import { Permission } from "@/types/roles";
import { useAuth } from "@/context/AuthContext";

import { useRouter } from "next/navigation";

type SortKey = "name" | "guard_name" | "created_at";
type SortState = { key: SortKey; dir: "asc" | "desc" } | null;

const headCls = "h-11 text-xs font-semibold text-slate-500";

/** "17 Apr 2026, 12.22" */
function formatCreatedAt(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  const date = d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${date}, ${time}`;
}

function compareBy(key: SortKey, a: Permission, b: Permission): number {
  if (key === "created_at") {
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  }
  return a[key].localeCompare(b[key]);
}

export default function PermissionsPage() {
  const { hasPermission, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data, setData] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await getAllPermissions();

      if (response.success) {
        setData(response.data);
        toast.success("Permissions loaded successfully");
      } else {
        toast.error("Failed to load permissions");
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setLoading(false);
    }
  };

  // Filter -> urutkan (seluruh data, bukan hanya halaman aktif) -> potong per halaman
  const filteredData = useMemo(() => {
    const q = search.toLowerCase();
    const list = data.filter(
      (permission) =>
        permission.name.toLowerCase().includes(q) ||
        permission.guard_name.toLowerCase().includes(q)
    );
    if (!sort) return list;
    const sign = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => sign * compareBy(sort.key, a, b));
  }, [data, search, sort]);

  const totalItems = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const toggleSort = (key: SortKey) => {
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  useEffect(() => {
    if (!authLoading && !hasPermission("permissions.index")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, itemsPerPage]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  if (authLoading) return null;
  if (!hasPermission("permissions.index")) return null;

  const SortHeader = ({ label, sortKey }: { label: string; sortKey: SortKey }) => {
    const active = sort?.key === sortKey;
    const Icon = !active ? ArrowUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
    return (
      <button
        type="button"
        onClick={() => toggleSort(sortKey)}
        className="inline-flex items-center gap-1.5 hover:text-slate-800"
      >
        {label}
        <Icon
          className={`h-3.5 w-3.5 ${active ? "text-blue-600" : "text-slate-400"}`}
          aria-hidden
        />
      </button>
    );
  };

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
              { label: "List Permission" },
            ]}
            icon={Shield}
            title="Permissions"
            description="Manage system permissions"
            illustration="/images/user-privileges.png"
            illustrationClassName="w-[120px]"
          />

          <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm md:p-6">
            {/* Search and Stats */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search permissions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-11 rounded-lg border-slate-200 bg-white pl-10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                <Button
                  onClick={fetchPermissions}
                  disabled={loading}
                  variant="outline"
                  className="h-10 gap-2 rounded-lg border-slate-200"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                    aria-hidden
                  />
                  Refresh
                </Button>
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <Select
                    value={`${itemsPerPage}`}
                    onValueChange={(value) => setItemsPerPage(Number(value))}
                  >
                    <SelectTrigger className="h-10 w-[76px] rounded-lg border-slate-200">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 30, 40, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <span className="tabular-nums text-slate-500">
                  {loading ? (
                    "Loading..."
                  ) : totalItems === 0 ? (
                    "Showing 0 permissions"
                  ) : (
                    <>
                      Showing {startIndex + 1}-{Math.min(endIndex, totalItems)}{" "}
                      of {totalItems} permissions
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table>
                <TableHeader className="bg-slate-50/60">
                  <TableRow className="border-slate-100 hover:bg-transparent">
                    <TableHead className={`${headCls} w-16`}>No</TableHead>
                    <TableHead className={headCls}>
                      <SortHeader label="Permission Name" sortKey="name" />
                    </TableHead>
                    <TableHead className={headCls}>
                      <SortHeader label="Guard" sortKey="guard_name" />
                    </TableHead>
                    <TableHead className={headCls}>
                      <SortHeader label="Created At" sortKey="created_at" />
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex items-center justify-center space-x-2 text-slate-500">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Loading permissions...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : currentData.length ? (
                    currentData.map((permission, index) => {
                      const parts = permission.name.split(".");
                      const category = parts[0];
                      const action = parts.slice(1).join(".");
                      return (
                        <TableRow
                          key={permission.id}
                          className="border-slate-100 hover:bg-slate-50/60"
                        >
                          <TableCell className="py-4 text-sm text-slate-700">
                            {startIndex + index + 1}
                          </TableCell>
                          <TableCell className="py-4">
                            <p className="text-sm font-semibold text-slate-900">
                              {permission.name}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-2">
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                {category}
                              </span>
                              {action && (
                                <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                  {action}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                              {permission.guard_name}
                            </span>
                          </TableCell>
                          <TableCell className="whitespace-nowrap py-4 text-sm text-slate-600">
                            <span className="inline-flex items-center gap-2">
                              <CalendarDays
                                className="h-4 w-4 text-slate-400"
                                aria-hidden
                              />
                              {formatCreatedAt(permission.created_at)}
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Shield className="h-8 w-8 text-slate-300" />
                          <span className="text-slate-500">
                            No permissions found
                          </span>
                          {search && (
                            <Button
                              variant="link"
                              onClick={() => setSearch("")}
                              className="text-sm"
                            >
                              Clear search
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && totalItems > 0 && (
              <NumberedPagination
                className="mt-4"
                page={currentPage}
                lastPage={totalPages}
                total={totalItems}
                perPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onPerPageChange={setItemsPerPage}
              />
            )}
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
