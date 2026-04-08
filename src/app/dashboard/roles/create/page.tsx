"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import TopNav from "@/components/top-nav";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Shield, Users } from "lucide-react";
import { toast } from "sonner";
import { createRole, getAllPermissions } from "@/lib/apiClient";
import { RoleCreateRequest, Permission, PermissionGroup } from "@/types/roles";

import { useAuth } from "@/context/AuthContext";

export default function CreateRolePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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

  const isGroupPartiallySelected = (groupPermissions: Permission[]) => {
    const groupIds = groupPermissions.map((p) => p.id);
    const selectedCount = groupIds.filter((id) =>
      formData.permissions?.includes(id)
    ).length;
    return selectedCount > 0 && selectedCount < groupIds.length;
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
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/roles")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Tambah Role Baru</h1>
              <p className="text-gray-600">Buat role baru dengan permissions</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Role Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Informasi Role
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Role *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="Masukkan nama role"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="guard_name">Guard Name</Label>
                    <Input
                      id="guard_name"
                      type="text"
                      value={formData.guard_name || "api"}
                      onChange={(e) =>
                        handleInputChange("guard_name", e.target.value)
                      }
                      placeholder="api"
                      disabled
                    />
                    <p className="text-xs text-gray-500">
                      Guard name biasanya &quot;api&quot; untuk API
                      authentication
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permissions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Permissions
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Pilih permissions yang akan diberikan pada role ini
                </p>
              </CardHeader>
              <CardContent>
                {permissionGroups.length > 0 ? (
                  <div className="space-y-6">
                    {permissionGroups.map((group) => (
                      <div
                        key={group.category}
                        className="border rounded-lg p-4"
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          <Checkbox
                            id={`group-${group.category}`}
                            checked={isGroupSelected(group.permissions)}
                            ref={(input) => {
                              if (input && "indeterminate" in input) {
                                (input as HTMLInputElement).indeterminate =
                                  isGroupPartiallySelected(group.permissions);
                              }
                            }}
                            onCheckedChange={(checked) =>
                              handleSelectAllInGroup(
                                group.permissions,
                                !!checked
                              )
                            }
                          />
                          <Label
                            htmlFor={`group-${group.category}`}
                            className="text-sm font-semibold capitalize cursor-pointer"
                          >
                            {group.category} ({group.permissions.length})
                          </Label>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 ml-6">
                          {group.permissions.map((permission) => {
                            const isUsersIndex =
                              permission.name === "users.index";
                            return (
                              <div
                                key={permission.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`permission-${permission.id}`}
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
                                  className={`text-sm cursor-pointer ${
                                    isUsersIndex
                                      ? "text-blue-600 font-medium"
                                      : ""
                                  }`}
                                >
                                  {permission.name}
                                  {isUsersIndex && (
                                    <span className="text-xs text-blue-500 ml-1">
                                      (Required)
                                    </span>
                                  )}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Memuat permissions...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard/roles")}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="gap-2 bg-blue-500 text-white hover:bg-blue-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Membuat...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Buat Role
                  </>
                )}
              </Button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Tips:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
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
