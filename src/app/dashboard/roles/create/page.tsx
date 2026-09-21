"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/redesign/page-header";
import { SectionCard } from "@/components/redesign/section-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronUp,
  Loader2,
  Lock,
  Save,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { createRole, getAllPermissions } from "@/lib/apiClient";
import { RoleCreateRequest, Permission, PermissionGroup } from "@/types/roles";

import { useAuth } from "@/context/AuthContext";

export default function CreateRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  /** Kategori permission yang sedang dilipat (default: semua terbuka). */
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const { hasPermission, loading: authLoading } = useAuth();
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(
    []
  );
  const [formData, setFormData] = useState<RoleCreateRequest>({
    name: "",
    guard_name: "api",
    permissions: [],
  });

  const fetchPermissions = async () => {
    try {
      const response = await getAllPermissions();

      // Group permissions by category (first part before the dot)
      const grouped = response.data.reduce(
        (acc: { [key: string]: Permission[] }, permission) => {
          const category = permission.name.split(".")[0] || "other";
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(permission);
          return acc;
        },
        {}
      );

      const groups: PermissionGroup[] = Object.keys(grouped).map(
        (category) => ({
          category,
          permissions: grouped[category],
        })
      );

      setPermissionGroups(groups);

      // Auto-select users.index permission
      const usersIndexPermission = response.data.find(
        (permission) => permission.name === "users.index"
      );
      if (usersIndexPermission) {
        setFormData((prev) => ({
          ...prev,
          permissions: [...(prev.permissions || []), usersIndexPermission.id],
        }));
      }
    } catch (error) {
      console.error("Error fetching permissions:", error);
      toast.error("Gagal memuat data permissions");
    }
  };

  useEffect(() => {
    if (!authLoading && !hasPermission("roles.store")) {
      router.replace("/dashboard");
    }
  }, [authLoading, hasPermission, router]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const handleInputChange = (field: keyof RoleCreateRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePermissionChange = (permissionId: number, checked: boolean) => {
    // Find the users.index permission to prevent unchecking it
    const usersIndexPermission = permissionGroups
      .flatMap((group) => group.permissions)
      .find((permission) => permission.name === "users.index");

    // Prevent unchecking users.index permission
    if (
      !checked &&
      usersIndexPermission &&
      permissionId === usersIndexPermission.id
    ) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...(prev.permissions || []), permissionId]
        : (prev.permissions || []).filter((id) => id !== permissionId),
    }));
  };

  const handleSelectAllInGroup = (
    groupPermissions: Permission[],
    checked: boolean
  ) => {
    const groupIds = groupPermissions.map((p) => p.id);
    const usersIndexPermission = groupPermissions.find(
      (p) => p.name === "users.index"
    );

    setFormData((prev) => ({
      ...prev,
      permissions: checked
        ? [...new Set([...(prev.permissions || []), ...groupIds])]
        : (prev.permissions || []).filter((id) => {
            // Keep users.index even when unchecking its group
            if (usersIndexPermission && id === usersIndexPermission.id) {
              return true;
            }
            return !groupIds.includes(id);
          }),
    }));
  };

  const isGroupSelected = (groupPermissions: Permission[]) => {
    const groupIds = groupPermissions.map((p) => p.id);
    return groupIds.every((id) => formData.permissions?.includes(id));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error("Nama role harus diisi");
      return false;
    }

    if (formData.name.length < 3) {
      toast.error("Nama role minimal 3 karakter");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await createRole(formData);
      toast.success("Role berhasil dibuat");
      router.push("/dashboard/roles");
    } catch (error: unknown) {
      console.error("Error creating role:", error);

      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            data?: { errors?: Record<string, string[]>; message?: string };
          };
        };
        if (axiosError.response?.data?.errors) {
          const errors = axiosError.response.data.errors;
          Object.keys(errors).forEach((key) => {
            errors[key].forEach((message: string) => {
              toast.error(`${key}: ${message}`);
            });
          });
        } else {
          toast.error(
            axiosError.response?.data?.message || "Gagal membuat role"
          );
        }
      } else {
        toast.error("Gagal membuat role");
      }
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return null;
  if (!hasPermission("roles.store")) return null;

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
              { label: "Tambah Role" },
            ]}
            back={{ href: "/dashboard/roles", label: "Kembali ke daftar role" }}
            title="Tambah Role Baru"
            description="Buat role baru dengan permissions"
            illustration="/images/roles.png"
            illustrationClassName="w-[120px]"
          />

          <form onSubmit={handleSubmit} className="space-y-6">
            <SectionCard icon={Shield} title="Informasi Role">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-slate-800"
                  >
                    Nama Role <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Shield
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      placeholder="Masukkan nama role"
                      required
                      className="h-11 rounded-lg border-slate-200 bg-white pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="guard_name"
                    className="text-sm font-medium text-slate-800"
                  >
                    Guard Name
                  </Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden
                    />
                    <Input
                      id="guard_name"
                      type="text"
                      value={formData.guard_name || "api"}
                      onChange={(e) =>
                        handleInputChange("guard_name", e.target.value)
                      }
                      placeholder="api"
                      disabled
                      className="h-11 rounded-lg border-slate-200 bg-slate-50 pl-9"
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Guard name biasanya &quot;api&quot; untuk API authentication
                  </p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              icon={Users}
              title="Permissions"
              description="Pilih permissions yang akan diberikan pada role ini"
            >
              {permissionGroups.length > 0 ? (
                <div className="space-y-4">
                  {permissionGroups.map((group) => {
                    const isCollapsed = collapsed[group.category] === true;
                    return (
                      <div
                        key={group.category}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              id={`group-${group.category}`}
                              className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                              checked={isGroupSelected(group.permissions)}
                              onCheckedChange={(checked) =>
                                handleSelectAllInGroup(
                                  group.permissions,
                                  !!checked
                                )
                              }
                            />
                            <Label
                              htmlFor={`group-${group.category}`}
                              className="cursor-pointer text-sm font-semibold capitalize text-slate-900"
                            >
                              {group.category} ({group.permissions.length})
                            </Label>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setCollapsed((prev) => ({
                                ...prev,
                                [group.category]: !isCollapsed,
                              }))
                            }
                            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
                            aria-label={`${isCollapsed ? "Buka" : "Lipat"} kategori ${group.category}`}
                            aria-expanded={!isCollapsed}
                          >
                            <ChevronUp
                              className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-180" : ""}`}
                              aria-hidden
                            />
                          </button>
                        </div>

                        {!isCollapsed && (
                          <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-3 pl-8 md:grid-cols-2 lg:grid-cols-3">
                            {group.permissions.map((permission) => {
                              const isUsersIndex =
                                permission.name === "users.index";
                              return (
                                <div
                                  key={permission.id}
                                  className="flex items-center gap-3"
                                >
                                  <Checkbox
                                    id={`permission-${permission.id}`}
                                    className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                                    checked={formData.permissions?.includes(
                                      permission.id
                                    )}
                                    disabled={isUsersIndex}
                                    onCheckedChange={(checked) =>
                                      handlePermissionChange(
                                        permission.id,
                                        !!checked
                                      )
                                    }
                                  />
                                  <Label
                                    htmlFor={`permission-${permission.id}`}
                                    className={`cursor-pointer text-sm ${
                                      isUsersIndex
                                        ? "font-medium text-blue-600"
                                        : "text-slate-700"
                                    }`}
                                  >
                                    {permission.name}
                                    {isUsersIndex && (
                                      <span className="ml-1 text-xs text-blue-500">
                                        (Required)
                                      </span>
                                    )}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Users className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                  <p className="text-slate-500">Memuat permissions...</p>
                </div>
              )}
            </SectionCard>

            <div className="sticky bottom-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-lg shadow-blue-900/5">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-lg border-slate-200 px-6"
                onClick={() => router.push("/dashboard/roles")}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-11 gap-2 rounded-lg bg-blue-600 px-6 text-white hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" aria-hidden />
                    Simpan Role
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
            <h3 className="mb-2 font-semibold text-blue-900">Tips:</h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Nama role harus unik dan deskriptif</li>
              <li>
                • <strong>users.index</strong> permission wajib dan tidak dapat
                dihapus (diperlukan untuk akses dashboard)
              </li>
              <li>• Pilih permissions sesuai dengan tanggung jawab role</li>
              <li>
                • Anda dapat mencentang kategori untuk memilih semua permissions
                dalam grup
              </li>
              <li>• Role dapat diubah setelah dibuat melalui menu edit</li>
            </ul>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
