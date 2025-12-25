"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Activity, Box, DollarSign, ScanLine, AlertTriangle, CheckCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { getDashboardStats, type DashboardStats } from "@/lib/report-service"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
     return <AppLayout><div className="p-8 text-center text-gray-500">Đang tải dữ liệu tổng quan...</div></AppLayout>
  }

  // Tính toán tỷ lệ cho biểu đồ đơn giản hoặc hiển thị text
  const maintenanceRate = stats && stats.totalAssets > 0 
    ? ((stats.statusCounts.maintenance / stats.totalAssets) * 100).toFixed(1) 
    : 0;

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Tổng quan</h2>
        </div>
        
        {/* HÀNG 1: THẺ THỐNG KÊ SỐ LIỆU */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng tài sản</CardTitle>
              <Box className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAssets || 0}</div>
              <p className="text-xs text-muted-foreground">thiết bị trong hệ thống</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng giá trị</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                 {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats?.totalValue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">ước tính giá trị kho</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang bảo trì</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats?.statusCounts.maintenance || 0}</div>
              <p className="text-xs text-muted-foreground">chiếm {maintenanceRate}% tổng số</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hoạt động tốt</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.statusCounts.active || 0}</div>
              <p className="text-xs text-muted-foreground">sẵn sàng sử dụng</p>
            </CardContent>
          </Card>
        </div>

        {/* HÀNG 2: CHI TIẾT & HOẠT ĐỘNG GẦN ĐÂY */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          
          {/* Cột trái: Biểu đồ hoặc thông tin khác (Tạm thời để placeholder hoặc stats chi tiết hơn) */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Trạng thái kho</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
               <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Đang sử dụng</span>
                      <span className="font-bold">{stats?.statusCounts.active}</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 h-full" style={{ width: `${stats && stats.totalAssets ? (stats.statusCounts.active/stats.totalAssets)*100 : 0}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                      <span className="text-sm font-medium">Bảo trì / Hỏng</span>
                      <span className="font-bold">{stats?.statusCounts.maintenance}</span>
                  </div>
                   <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-orange-500 h-full" style={{ width: `${stats && stats.totalAssets ? (stats.statusCounts.maintenance/stats.totalAssets)*100 : 0}%` }}></div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                      <span className="text-sm font-medium">Thanh lý / Ngừng dùng</span>
                      <span className="font-bold">{stats?.statusCounts.inactive}</span>
                  </div>
                   <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                      <div className="bg-gray-500 h-full" style={{ width: `${stats && stats.totalAssets ? (stats.statusCounts.inactive/stats.totalAssets)*100 : 0}%` }}></div>
                  </div>
               </div>
            </CardContent>
          </Card>

          {/* Cột phải: Lịch sử quét gần đây */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Hoạt động quét gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {stats?.recentScans.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center">Chưa có dữ liệu quét.</p>
                ) : (
                    stats?.recentScans.map((scan) => (
                        <div key={scan.id} className="flex items-center">
                            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                                <ScanLine className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="ml-4 space-y-1">
                                <p className="text-sm font-medium leading-none">{scan.scan_code}</p>
                                <p className="text-xs text-muted-foreground">
                                    {scan.location || "Chưa xác định"} • {new Date(scan.created_at).toLocaleDateString('vi-VN')}
                                </p>
                            </div>
                            <div className="ml-auto font-medium">
                                <Badge variant={scan.status === 'completed' ? 'default' : 'secondary'}>
                                    {scan.status === 'completed' ? 'Xong' : 'Xử lý'}
                                </Badge>
                            </div>
                        </div>
                    ))
                )}
                
                <div className="pt-4 text-center">
                    <Link href="/scans">
                        <Button variant="outline" size="sm" className="w-full">Xem tất cả lịch sử</Button>
                    </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}