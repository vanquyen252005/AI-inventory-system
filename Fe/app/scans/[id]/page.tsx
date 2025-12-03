"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, RefreshCw, CheckCircle2, Box, Save, Loader2, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { getScanById, updateScanResult, type ScanResult } from "@/lib/scan-service"
import { createBulkAssets, type CreateAssetPayload } from "@/lib/inventory-service"
export default function ScanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.id as string
  
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadScanDetails()
  }, [scanId])

  const loadScanDetails = async () => {
    try {
      const data = await getScanById(scanId)
      setScan(data)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIC GỘP NHÓM (GROUPING) ---
  const groupedResults = useMemo(() => {
    if (!scan?.result_data) return []
    
    const groups: Record<string, { count: number; confidenceSum: number; class: string }> = {}
    
    scan.result_data.forEach((item) => {
      // Chuẩn hóa tên lớp (ví dụ: "chair" -> "Chair")
      const className = item.class.charAt(0).toUpperCase() + item.class.slice(1)
      
      if (!groups[className]) {
        groups[className] = { count: 0, confidenceSum: 0, class: className }
      }
      groups[className].count += 1
      groups[className].confidenceSum += item.confidence
    })

    return Object.values(groups).map(g => ({
      ...g,
      avgConfidence: (g.confidenceSum / g.count) * 100
    }))
  }, [scan?.result_data])

  // --- LOGIC LƯU VÀO KHO ---
  const handleSaveToInventory = async () => {
    if (!scan || !groupedResults.length) return
    
    if(!confirm(`Bạn có chắc chắn muốn thêm ${scan.result_data?.length} thiết bị này vào kho không?`)) return

    try {
      setIsSaving(true)
      
      // 1. Chuẩn bị dữ liệu để lưu
      // Chúng ta sẽ tạo N tài sản ứng với số lượng đếm được
      // Ví dụ: Đếm được 5 cái Ghế -> Tạo 5 bản ghi "Ghế (AI Scan)"
      const assetsToCreate: CreateAssetPayload[] = [] 
      
      for (const group of groupedResults) {
        for (let i = 0; i < group.count; i++) {
          assetsToCreate.push({
            name: `${group.class} (AI-${scan.scan_code.slice(-4)})`,
            category: group.class,
            location: scan.location || "Chưa xác định",
            // Hoặc dùng: status: "active" as const,
            status: "active", 
            value: 0,
            condition: 100,
            description: `Tự động thêm từ phiên quét AI: ${scan.scan_code}`
          })
        }
      }
      // 2. Gọi API Bulk Create
      await createBulkAssets(assetsToCreate)
      
      alert("Đã lưu tài sản thành công!")
      router.push("/assets") // Chuyển hướng về trang danh sách tài sản
      
    } catch (error) {
      alert("Lỗi khi lưu: " + (error instanceof Error ? error.message : "Không xác định"))
    } finally {
      setIsSaving(false)
    }
  }

  // Helper render icon
  const getIcon = (type: string) => {
    return <Box className="w-5 h-5 text-blue-500" />
  }

  if (loading) return <AppLayout><div className="p-8 text-center">Đang tải...</div></AppLayout>
  if (!scan) return <AppLayout><div className="p-8 text-center">Không tìm thấy dữ liệu</div></AppLayout>

  const fileUrl = scan.image_url.startsWith("http") 
    ? scan.image_url 
    : `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/${scan.image_url.replace(/\\/g, "/")}`

  const isVideo = scan.scan_code.match(/\.(mp4|mov|avi)$/i)

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-border bg-card flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/scans">
              <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
            </Link>
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                {scan.scan_code}
                <Badge variant={scan.status === 'completed' ? 'default' : 'secondary'}>
                  {scan.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                Vị trí: <b>{scan.location}</b> • {new Date(scan.scanned_at).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Media */}
          <div className="flex-1 bg-black/5 flex items-center justify-center p-6 overflow-auto">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              {isVideo ? (
                <video src={fileUrl} controls className="w-full h-full object-contain" />
              ) : (
                <img src={fileUrl} alt="Scan" className="w-full h-full object-contain" />
              )}
            </div>
          </div>

          {/* Right: Grouped Results */}
          <div className="w-96 bg-card border-l border-border flex flex-col shrink-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Kết quả tổng hợp
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                AI đã phát hiện tổng cộng <span className="font-bold text-primary">{scan.result_data?.length || 0}</span> vật thể.
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {groupedResults.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>Chưa có kết quả.</p>
                </div>
              ) : (
                // HIỂN THỊ DẠNG GỘP NHÓM
                groupedResults.map((group, index) => (
                  <Card key={index} className="p-4 flex items-center gap-4 hover:bg-accent/5 transition-colors border-l-4 border-l-primary">
                    <div className="p-3 bg-primary/10 rounded-full">
                      {getIcon(group.class)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-foreground">{group.class}</h4>
                      <p className="text-xs text-muted-foreground">Độ tin cậy TB: {group.avgConfidence.toFixed(0)}%</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-primary">{group.count}</span>
                      <span className="text-[10px] text-muted-foreground uppercase">Số lượng</span>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            {/* Nút Lưu */}
            <div className="p-4 border-t border-border bg-muted/10">
              <Button 
                onClick={handleSaveToInventory} 
                disabled={groupedResults.length === 0 || isSaving}
                className="w-full h-12 text-base bg-green-600 hover:bg-green-700 text-white"
              >
                {isSaving ? (
                  <> <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Đang lưu... </>
                ) : (
                  <> <Save className="w-5 h-5 mr-2" /> Lưu tất cả vào Kho </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">
                Hành động này sẽ tạo mới các tài sản tương ứng trong cơ sở dữ liệu.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}