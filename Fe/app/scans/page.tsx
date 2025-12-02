"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Video, Image as ImageIcon, Search, Calendar, MapPin, ChevronRight, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getScans, type ScanResult } from "@/lib/scan-service"
import { Input } from "@/components/ui/input"

export default function ScansPage() {
  const [scans, setScans] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    loadScans()
  }, [])

  const loadScans = async () => {
    try {
      setLoading(true)
      const data = await getScans()
      setScans(data)
    } catch (error) {
      console.error("Failed to load scans", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredScans = scans.filter(scan => 
    (scan.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    scan.scan_code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Lịch sử Quét AI</h1>
            <p className="text-muted-foreground">Danh sách các video và hình ảnh đã được xử lý nhận diện.</p>
          </div>
          <Link href="/scans/upload">
            <Button className="bg-primary hover:bg-primary/90 gap-2">
              <Plus className="w-5 h-5" /> Quét mới
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              placeholder="Tìm kiếm theo phòng hoặc mã quét..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {/* List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Đang tải dữ liệu...</div>
          ) : filteredScans.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Chưa có dữ liệu quét</h3>
              <p className="text-muted-foreground mb-6">Hãy tải lên video hoặc ảnh đầu tiên để bắt đầu.</p>
              <Link href="/scans/upload">
                <Button>Bắt đầu ngay</Button>
              </Link>
            </div>
          ) : (
            filteredScans.map((scan) => (
              <Card key={scan.id} className="p-5 hover:shadow-md transition-shadow group">
                <div className="flex items-center gap-6">
                  {/* Icon */}
                  <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    {scan.scan_code.match(/\.(mp4|mov|avi)$/i) ? (
                      <Video className="w-8 h-8 text-blue-500" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-purple-500" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg">{scan.scan_code}</h3>
                      {scan.status === "completed" ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium border border-green-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                        </span>
                      ) : scan.status === "failed" ? (
                         <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-medium border border-red-200">
                          Thất bại
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium border border-blue-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Đang xử lý
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> 
                        {scan.location || "Chưa xác định"}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(scan.scanned_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right px-6 border-l border-border hidden md:block">
                    <div className="text-sm text-muted-foreground">Phát hiện</div>
                    <div className="text-2xl font-bold text-foreground">{scan.device_cnt} <span className="text-sm font-normal text-muted-foreground">thiết bị</span></div>
                  </div>

                  {/* Action */}
                  <Link href={`/scans/${scan.id}`}>
                    <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}