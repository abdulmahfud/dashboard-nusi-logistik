"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import TopNav from "@/components/top-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import {
  CheckCircle,
  Info,
  LayoutGrid,
  Package,
  Package2,
  RefreshCw,
  Truck,
  XCircle,
  Hourglass,
  ClipboardListIcon,
  ClipboardCheck,
} from "lucide-react";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import { getOrders } from "@/lib/apiClient";
import {
  Order,
  DeliveryReport,
  STATUS_MAPPING,
  VENDOR_MAPPING,
} from "@/types/laporanPengiriman";

// Function to transform API data to table format
const transformOrderToDeliveryReport = (order: Order): DeliveryReport => {
  // Determine package type based on service_type_code
  let packageType: DeliveryReport["packageType"] = "Paket Reguler"; // Default value
  if (order.service_type_code === "COD") {
    packageType = "COD";
  } else if (order.service_type_code === "REGULER") {
    packageType = "Paket Reguler";
  } else if (order.service_type_code === "INSTANT") {
    packageType = "Paket Instant";
  }

  // Map vendor to courier service
  const courierService = VENDOR_MAPPING[order.vendor] || order.vendor;

  // Map status
  const status = STATUS_MAPPING[order.status] || order.status;

  // Determine shipping method based on service_type_code
  const shippingMethod: DeliveryReport["shippingMethod"] =
    order.service_type_code === "COD" ? "COD" : "REGULER";

  // Map shipment_type to service (DROPOFF or PICKUP)
  const service: DeliveryReport["service"] =
    order.shipment_type === "PICKUP" ? "PICKUP" : "DROPOFF";

  // Calculate total shipment from cod_value or item_value
  const totalShipment =
    parseFloat(order.cod_value) || parseFloat(order.item_value) || 0;

  // Format date
  const createdAt = new Date(order.created_at).toISOString().split("T")[0];

  return {
    orderId: order.id, // Add order ID for label download
    createdAt,
    shipmentNo: order.awb_no || order.reference_no,
    packageType,
    recipient: order.receiver.name,
    courierService,
    totalShipment,
    shippingMethod,
    service,
    status,
    vendor: order.vendor, // Add vendor information for label URL
  };
};

const LaporanPengiriman = () => {
  const [statusFilter, setStatusFilter] = useState<string>("Semua Status");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [packageTypeFilter, setPackageTypeFilter] =
    useState<string>("Semua Status");
  const [dataReport, setDataReport] = useState<DeliveryReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getOrders();

        // Transform API data to table format
        const transformedData = response.data.map(
          transformOrderToDeliveryReport
        );
        setDataReport(transformedData);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setError("Failed to fetch orders data");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Calculate statistics from real data
  const calculateStatistics = () => {
    const totalPengiriman = dataReport.length;
    const paketReguler = dataReport.filter(
      (item) => item.packageType === "Paket Reguler"
    ).length;
    const paketInstant = dataReport.filter(
      (item) => item.packageType === "Paket Instant"
    ).length;
    const cod = dataReport.filter(
      (item) => item.packageType === "COD" || item.shippingMethod === "COD"
    ).length;

    return {
      totalPengiriman,
      paketReguler,
      paketInstant,
      cod,
      paketRegulerPercentage:
        totalPengiriman > 0
          ? Math.round((paketReguler / totalPengiriman) * 100)
          : 0,
      paketInstantPercentage:
        totalPengiriman > 0
          ? Math.round((paketInstant / totalPengiriman) * 100)
          : 0,
      codPercentage:
        totalPengiriman > 0 ? Math.round((cod / totalPengiriman) * 100) : 0,
    };
  };

  const calculateStatusStatistics = () => {
    const statusCounts = {
      "Belum Proses": dataReport.filter(
        (item) => item.status === "Belum Proses"
      ).length,
      "Belum di Expedisi": dataReport.filter(
        (item) => item.status === "Belum di Expedisi"
      ).length,
      "Proses Pengiriman": dataReport.filter(
        (item) => item.status === "Proses Pengiriman"
      ).length,
      "Kendala Pengiriman": dataReport.filter(
        (item) => item.status === "Kendala Pengiriman"
      ).length,
      "Sampai Tujuan": dataReport.filter(
        (item) => item.status === "Sampai Tujuan"
      ).length,
      Retur: dataReport.filter((item) => item.status === "Retur").length,
      Dibatalkan: dataReport.filter((item) => item.status === "Dibatalkan")
        .length,
    };

    const total = dataReport.length;
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  };

  const stats = calculateStatistics();
  const statusStats = calculateStatusStatistics();

  // Updated data arrays using real statistics
  const data = [
    {
      label: "Total Pengiriman",
      value: stats.totalPengiriman,
      icon: (
        <LayoutGrid
          size={24}
          className="bg-blue-200 text-blue-500 rounded-full p-1"
        />
      ),
      percentage: null,
    },
    {
      label: "Paket Reguler",
      value: stats.paketReguler,
      icon: (
        <Package
          size={24}
          className="bg-blue-200 text-blue-500 rounded-full p-1"
        />
      ),
      percentage: stats.paketRegulerPercentage,
    },
    {
      label: "Paket Instant",
      value: stats.paketInstant,
      icon: (
        <Truck
          size={24}
          className="bg-blue-200 text-blue-500 rounded-full p-1"
        />
      ),
      percentage: stats.paketInstantPercentage,
    },
    {
      label: "COD",
      value: stats.cod,
      icon: (
        <Package2
          size={24}
          className="bg-blue-200 text-blue-500 rounded-full p-1"
        />
      ),
      percentage: stats.codPercentage,
    },
  ];

  const statusData = [
    {
      label: "Belum Proses",
      value: statusStats.find((s) => s.status === "Belum Proses")?.count || 0,
      icon: <Hourglass size={18} className="text-yellow-500" />,
      percentage:
        statusStats.find((s) => s.status === "Belum Proses")?.percentage || 0,
    },
    {
      label: "Belum di Expedisi",
      value:
        statusStats.find((s) => s.status === "Belum di Expedisi")?.count || 0,
      icon: <Info size={18} className="text-blue-500" />,
      percentage:
        statusStats.find((s) => s.status === "Belum di Expedisi")?.percentage ||
        0,
    },
    {
      label: "Proses Pengiriman",
      value:
        statusStats.find((s) => s.status === "Proses Pengiriman")?.count || 0,
      icon: <Truck size={18} className="text-blue-500" />,
      percentage:
        statusStats.find((s) => s.status === "Proses Pengiriman")?.percentage ||
        0,
    },
    {
      label: "Kendala Pengiriman",
      value:
        statusStats.find((s) => s.status === "Kendala Pengiriman")?.count || 0,
      icon: <XCircle size={18} className="text-red-500" />,
      percentage:
        statusStats.find((s) => s.status === "Kendala Pengiriman")
          ?.percentage || 0,
    },
    {
      label: "Sampai Tujuan",
      value: statusStats.find((s) => s.status === "Sampai Tujuan")?.count || 0,
      icon: <CheckCircle size={18} className="text-green-500" />,
      percentage:
        statusStats.find((s) => s.status === "Sampai Tujuan")?.percentage || 0,
    },
    {
      label: "Retur",
      value: statusStats.find((s) => s.status === "Retur")?.count || 0,
      icon: <RefreshCw size={18} className="text-blue-500" />,
      percentage:
        statusStats.find((s) => s.status === "Retur")?.percentage || 0,
    },
    {
      label: "Dibatalkan",
      value: statusStats.find((s) => s.status === "Dibatalkan")?.count || 0,
      icon: <XCircle size={18} className="text-red-600" />,
      percentage:
        statusStats.find((s) => s.status === "Dibatalkan")?.percentage || 0,
    },
  ];

  if (loading) {
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
          <div className="flex flex-1 flex-col bg-blue-100">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-3 md:px-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg">Loading...</div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (error) {
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
          <div className="flex flex-1 flex-col bg-blue-100">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 px-3 md:px-6">
                <div className="flex items-center justify-center h-64">
                  <div className="text-lg text-red-500">{error}</div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
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
        <div className="flex flex-1 flex-col bg-blue-50/80">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 py-3 sm:py-4 md:py-6 px-3 md:px-6">
              {/* Header - Mobile responsive */}
              <div className="flex items-center gap-2">
                <ClipboardListIcon className="h-7 w-7 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Laporan Pengiriman
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Riwayat pengiriman dengan filter admin.
                  </p>
                </div>
              </div>

              {/* Kartu Statistik Pengiriman - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {data.map((item, index) => (
                  <Card key={index} className="shadow-md">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        {item.icon}
                        <span className="text-xs sm:text-sm leading-tight">
                          {item.label}
                        </span>
                      </CardTitle>
                      {item.percentage !== null && (
                        <span className="text-xs text-blue-700 rounded-full bg-blue-100 px-2 py-1 flex-shrink-0">
                          {item.percentage}%
                        </span>
                      )}
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">
                        {item.value}
                      </p>
                      {item.percentage !== null && (
                        <Progress value={item.percentage} className="mt-2" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <ClipboardCheck className="h-7 w-7 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Status Pengiriman
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Status pengiriman dengan filter admin.
                  </p>
                </div>
              </div>
              {/* Kartu Status Pengiriman - Better Mobile Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 sm:gap-4">
                {statusData.map((status, index) => (
                  <Card key={index} className="shadow-md">
                    <CardHeader className="flex flex-col space-y-2 pb-2 p-3 sm:p-4">
                      <div className="flex items-center justify-between">
                        {status.icon}
                        <span className="text-xs text-blue-700 rounded-full bg-blue-100 px-2 py-1 flex-shrink-0">
                          {status.percentage}%
                        </span>
                      </div>
                      <CardTitle className="text-xs sm:text-sm font-medium leading-tight">
                        {status.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 p-3 sm:p-4">
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold">
                        {status.value}
                      </p>
                      <Progress value={status.percentage} className="mt-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card className="overflow-hidden">
                <DataTable
                  columns={columns}
                  data={dataReport}
                  statusFilter={statusFilter}
                  setStatusFilter={setStatusFilter}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  packageTypeFilter={packageTypeFilter}
                  setPackageTypeFilter={setPackageTypeFilter}
                />
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default LaporanPengiriman;
