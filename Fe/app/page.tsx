"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  Package, 
  Video, 
  History, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Boxes
} from "lucide-react"

// Dữ liệu giả lập cho hoạt động gần đây
const recentActivities = [
  { id: 1, action: "Đã quét AI", target: "Phòng máy 304 - Video_001.mp4", time: "10 phút trước", status: "success", result: "Tìm thấy 12 tài sản" },
  { id: 2, action: "Thêm mới", target: "Máy chiếu Sony VPL", time: "2 giờ trước", status: "info", result: "Thủ công" },
  { id: 3, action: "Đã quét AI", target: "Kho thiết bị T2 - IMG_2234.jpg", time: "5 giờ trước", status: "warning", result: "Cần xác nhận 2 mục" },
]

export default function Page() {
  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Tổng quan Hệ thống</h1>
            <p className="text-muted-foreground mt-1">
              Quản lý tài sản và kiểm kê tự động cho Trường ĐH Công nghệ
            </p>
          </div>
          <div className="text-sm font-medium bg-primary/10 text-primary px-4 py-2 rounded-full">
             Học kỳ 1 - Năm học 2025-2026
          </div>
        </div>

        {/* Hero Action Section - Khu vực chức năng chính */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Quản lý Tài sản */}
          <Link href="/assets" className="block group">
            <Card className="h-full p-8 hover:shadow-lg transition-all border-l-4 border-l-blue-500 cursor-pointer group-hover:bg-accent/5">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Package className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground group-hover:text-blue-600 transition-colors">Kho Tài sản</h2>
                    <p className="text-muted-foreground mt-2">
                      Xem danh sách, tìm kiếm, chỉnh sửa và quản lý toàn bộ thiết bị trong trường.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm font-medium text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Boxes className="w-4 h-4" /> 1,234 Thiết bị
                </div>
                <div className="w-1 h-1 bg-muted-foreground/30 rounded-full" />
                <div>Cập nhật: Hôm nay</div>
              </div>
            </Card>
          </Link>

          {/* Card 2: AI Scan - Tính năng cốt lõi */}
          <Link href="/scans/upload" className="block group">
            <Card className="h-full p-8 hover:shadow-lg transition-all border-l-4 border-l-purple-500 cursor-pointer group-hover:bg-accent/5">
              <div className="flex justify-between items-start">
                <div className="space-y-4">
                  <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                    <Video className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground group-hover:text-purple-600 transition-colors">Quét AI Nhận diện</h2>
                    <p className="text-muted-foreground mt-2">
                      Tải lên video hoặc hình ảnh để AI tự động phát hiện, đếm và kiểm kê tài sản.
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-6 h-6 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="mt-8 flex items-center gap-2">
                <Button className="bg-purple-600 hover:bg-purple-700 text-white shadow-md">
                  Bắt đầu quét mới
                </Button>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cột trái: Hoạt động gần đây */}
          <Card className="lg:col-span-2 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                Hoạt động gần đây
              </h3>
              <Link href="/reports" className="text-sm text-primary hover:underline">
                Xem tất cả
              </Link>
            </div>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      activity.status === 'success' ? 'bg-green-500' : 
                      activity.status === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div>
                      <p className="font-medium text-foreground">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">{activity.target}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      activity.status === 'success' ? 'text-green-600' : 
                      activity.status === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                    }`}>
                      {activity.result}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Cột phải: Trạng thái nhanh */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-6">Trạng thái hệ thống</h3>
            <div className="space-y-6">
              
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Tỉ lệ nhận diện chính xác</p>
                  <p className="text-2xl font-bold">94.2%</p>
                </div>
              </div>

              <div className="w-full h-px bg-border" />

              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Cần kiểm tra lại</p>
                  <p className="text-2xl font-bold">12 <span className="text-sm font-normal text-muted-foreground">mục</span></p>
                </div>
              </div>

              <div className="w-full h-px bg-border" />
              
              <div className="bg-primary/5 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">Dung lượng lưu trữ Video</p>
                <div className="w-full bg-muted rounded-full h-2 mb-1">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <p className="text-xs text-right text-muted-foreground">45% đã dùng</p>
              </div>

            </div>
          </Card>
        </div>

      </div>
    </AppLayout>
  )
}