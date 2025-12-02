"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Play, Pause, RefreshCw, CheckCircle2, Box, Cpu, Monitor } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { getScanById, updateScanResult, type ScanResult, type DetectionItem } from "@/lib/scan-service"

// Dữ liệu mẫu giả lập AI nhận diện
const MOCK_AI_RESULTS = [
  { class: "projector", confidence: 0.98, box: [100, 100, 200, 150] },
  { class: "monitor", confidence: 0.92, box: [300, 200, 100, 100] },
  { class: "monitor", confidence: 0.89, box: [420, 210, 100, 100] },
  { class: "chair", confidence: 0.85, box: [50, 400, 80, 120] },
  { class: "chair", confidence: 0.88, box: [150, 410, 80, 120] },
  { class: "air_conditioner", confidence: 0.95, box: [500, 50, 150, 60] },
]

export default function ScanDetailPage() {
  const params = useParams()
  const scanId = params.id as string
  
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

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

  // Hàm giả lập AI chạy xong
  const handleSimulateAI = async () => {
    if (!scan) return
    setProcessing(true)
    
    try {
      // Giả vờ đợi 2 giây
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Update trạng thái thành completed và nạp dữ liệu mẫu
      await updateScanResult(scan.id, {
        status: "completed",
        result_data: MOCK_AI_RESULTS
      })
      
      // Load lại trang
      loadScanDetails()
    } catch (error) {
      alert("Lỗi giả lập: " + error)
    } finally {
      setProcessing(false)
    }
  }

  // Helper render icon theo loại thiết bị
  const getIcon = (type: string) => {
    if (type.includes("monitor") || type.includes("screen")) return <Monitor className="w-5 h-5 text-blue-500" />
    if (type.includes("cpu") || type.includes("projector")) return <Cpu className="w-5 h-5 text-purple-500" />
    return <Box className="w-5 h-5 text-gray-500" />
  }

  // Helper dịch tên thiết bị sang tiếng Việt
  const translateName = (name: string) => {
    const dict: Record<string, string> = {
      "projector": "Máy chiếu",
      "monitor": "Màn hình PC",
      "chair": "Ghế giáo viên",
      "air_conditioner": "Điều hòa",
      "table": "Bàn làm việc"
    }
    return dict[name] || name
  }

  if (loading) return <AppLayout><div className="p-8 text-center">Đang tải thông tin...</div></AppLayout>
  if (!scan) return <AppLayout><div className="p-8 text-center">Không tìm thấy dữ liệu</div></AppLayout>

  // Đường dẫn file (nếu chạy local cần đảm bảo Inventory Service serve file static, hoặc dùng link test)
  // Tạm thời fix cứng host nếu cần: `http://localhost:4001/${scan.image_url}`
  // Ở đây giả định backend trả về đường dẫn tương đối
  const fileUrl = scan.image_url.startsWith("http") 
    ? scan.image_url 
    : `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/${scan.image_url.replace(/\\/g, "/")}`

  const isVideo = scan.scan_code.match(/\.(mp4|mov|avi)$/i)

  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        {/* Header Toolbar */}
        <div className="h-16 border-b border-border bg-card flex items-center px-6 justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Link href="/scans">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                {scan.scan_code}
                <Badge variant={scan.status === 'completed' ? 'default' : 'secondary'} className={scan.status === 'completed' ? 'bg-green-600' : ''}>
                  {scan.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                Quét tại: <span className="font-medium text-foreground">{scan.location || "Chưa xác định"}</span>
                <span>•</span>
                {new Date(scan.scanned_at).toLocaleString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            {scan.status !== 'completed' && (
              <Button onClick={handleSimulateAI} disabled={processing} className="bg-purple-600 hover:bg-purple-700">
                {processing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                Chạy AI Phân tích
              </Button>
            )}
            <Button variant="outline">Xuất Báo cáo</Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left: Media Viewer */}
          <div className="flex-1 bg-black/5 flex items-center justify-center p-6 overflow-auto">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              {isVideo ? (
                <video 
                  ref={videoRef}
                  src={fileUrl} 
                  controls 
                  className="w-full h-full object-contain"
                />
              ) : (
                <img src={fileUrl} alt="Scan Content" className="w-full h-full object-contain" />
              )}
              
              {/* Overlay Bounding Boxes (Chỉ demo, cần tính toán tỉ lệ thực tế) */}
              {/* Đây là chỗ có thể vẽ canvas đè lên nếu muốn hiển thị box */}
            </div>
          </div>

          {/* Right: Results Sidebar */}
          <div className="w-96 bg-card border-l border-border flex flex-col shrink-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Kết quả nhận diện
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Tìm thấy <span className="font-bold text-primary">{scan.result_data?.length || 0}</span> thiết bị trong phòng
              </p>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-3">
              {(!scan.result_data || scan.result_data.length === 0) ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Chưa có kết quả.</p>
                  <p className="text-xs">Vui lòng đợi hoặc bấm "Chạy AI Phân tích"</p>
                </div>
              ) : (
                scan.result_data.map((item, index) => (
                  <Card key={index} className="p-3 flex items-start gap-3 hover:bg-accent/5 transition-colors cursor-pointer border-l-4 border-l-transparent hover:border-l-primary">
                    <div className="mt-1 p-2 bg-muted rounded-lg">
                      {getIcon(item.class)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h4 className="font-medium text-sm truncate" title={translateName(item.class)}>
                          {translateName(item.class)}
                        </h4>
                        <Badge variant="outline" className="text-[10px] h-5">
                          {(item.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Tọa độ: [{item.box.join(", ")}]
                      </p>
                      <div className="mt-2 flex gap-2">
                         {/* Nút thao tác nhanh cho từng item */}
                         <button className="text-[10px] text-blue-600 hover:underline font-medium">Xác nhận</button>
                         <button className="text-[10px] text-red-600 hover:underline">Báo sai</button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-border bg-muted/10">
              <Button className="w-full">
                Lưu vào Kho tài sản
              </Button>
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}