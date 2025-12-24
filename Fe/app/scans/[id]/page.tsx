"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Play, Save, Loader2, AlertCircle, Eye, Box } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import { getScanById, type ScanResult } from "@/lib/scan-service"
import { createBulkAssets, type CreateAssetPayload } from "@/lib/inventory-service"
import { X } from "lucide-react"
// Định nghĩa lại interface cho item chi tiết
interface DetectionItem {
  class: string;
  confidence: number;
  box?: number[]; // [x1, y1, x2, y2] (0.0 - 1.0)
  frameIndex?: number;
}

export default function ScanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const scanId = params.id as string
  
  const [scan, setScan] = useState<ScanResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  
  // State lưu vật thể đang được chọn để xem
  const [selectedItem, setSelectedItem] = useState<DetectionItem | null>(null);

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

  // --- LOGIC GỘP NHÓM ---
  const groupedResults = useMemo(() => {
    if (!scan?.result_data) return []
    
    // Parse dữ liệu nếu nó là string (do DB lưu JSONB hoặc String)
    let rawData: any = scan.result_data;
    if (typeof rawData === 'string') {
        try { rawData = JSON.parse(rawData); } catch(e) { rawData = []; }
    }

    const groups: Record<string, { count: number; confidenceSum: number; class: string; items: DetectionItem[] }> = {}
    
    if(Array.isArray(rawData)) {
        rawData.forEach((item: any) => {
          const key = item.class 
          if (!groups[key]) {
            groups[key] = { count: 0, confidenceSum: 0, class: key, items: [] }
          }
          groups[key].count += 1
          groups[key].confidenceSum += item.confidence
          groups[key].items.push(item)
        })
    }

    return Object.values(groups).map(g => ({
      ...g,
      avgConfidence: (g.confidenceSum / g.count) * 100
    }))
  }, [scan?.result_data])

  // --- LOGIC LƯU VÀO KHO (Giữ nguyên) ---
  const handleSaveToInventory = async () => {
    if (!scan || !groupedResults.length) return
    if(!confirm(`Bạn có chắc chắn muốn thêm ${groupedResults.reduce((a,b)=>a+b.count,0)} thiết bị này vào kho không?`)) return

    try {
      setIsSaving(true)
      // Dùng any[] tạm thời để tránh lỗi TypeScript nếu bạn chưa update interface CreateAssetPayload
      const assetsToCreate: any[] = [] 
      
      // 1. Lấy URL của file gốc và chuyển thành URL ảnh Output (để làm bằng chứng)
      const fileUrl = getFileUrl(); 
      // Logic: thay đuôi file (mp4, jpg...) thành _output.jpg và folder uploads -> output_results
      const outputImgUrl = fileUrl
        .replace(/\.(mp4|mov|avi|jpg|png|jpeg)$/i, "_output.jpg")
        .replace("/uploads/", "/output_results/");

      for (const group of groupedResults) {
        const rawClass = group.class.toLowerCase(); 
        let baseName = group.class; 
        let condition = 100;        
        let status: "active" | "maintenance" | "inactive" = "active";
        let descriptionNote = "";

        // Logic xác định tình trạng (Giữ nguyên của bạn)
        if (rawClass.includes("good")) {
          baseName = rawClass.replace(/-?good/g, "").trim();
          condition = 95; status = "active";
          descriptionNote = "Tình trạng tốt (AI Scan)";
        } else if (rawClass.includes("bad") || rawClass.includes("broken")) {
          baseName = rawClass.replace(/-?(bad|broken)/g, "").trim();
          condition = 30; status = "maintenance"; 
          descriptionNote = "Hư hỏng cần sửa chữa (AI Scan)";
        }

        baseName = baseName.charAt(0).toUpperCase() + baseName.slice(1);

        // 2. Thay vòng lặp for(count) bằng forEach(items) để lấy tọa độ
        group.items.forEach((item, i) => {
             assetsToCreate.push({
                name: `${baseName} #${i + 1} (AI-${scan.scan_code.slice(0, 6)})`,
                category: baseName,
                location: scan.location || "Chưa xác định",
                status: status,
                value: 0,
                condition: condition,
                description: `Tự động thêm từ phiên quét. ${descriptionNote}`,
                
                // --- HAI TRƯỜNG MỚI QUAN TRỌNG ---
                evidence_url: outputImgUrl, // Link ảnh có vẽ box (hoặc ảnh sạch tùy logic main.py)
                evidence_bbox: item.box     // Tọa độ [x1, y1, x2, y2]
             })
        });
      }

      await createBulkAssets(assetsToCreate)
      alert("Đã lưu tài sản thành công!")
      router.push("/assets") 
    } catch (error) {
      alert("Lỗi khi lưu: " + (error instanceof Error ? error.message : "Không xác định"))
    } finally {
      setIsSaving(false)
    }
  }

  // Helper render file URL
  const getFileUrl = () => {
     if(!scan) return "";
     return scan.image_url.startsWith("http") 
       ? scan.image_url 
       : `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/${scan.image_url.replace(/\\/g, "/")}`;
  }

  // --- RENDER POPUP CHI TIẾT CÓ BOX ---
  const renderDetailModal = () => {
    if(!selectedItem || !scan) return null;
    
    const fileUrl = getFileUrl();
    const outputImgUrl = fileUrl
      .replace(/\.(mp4|mov|avi|jpg|png|jpeg)$/i, "_output.jpg")
      .replace("/uploads/", "/output_results/");
    
    const boxStyle: React.CSSProperties = selectedItem.box ? {
        position: 'absolute',
        left: `${selectedItem.box[0] * 100}%`,
        top: `${selectedItem.box[1] * 100}%`,
        width: `${(selectedItem.box[2] - selectedItem.box[0]) * 100}%`,
        height: `${(selectedItem.box[3] - selectedItem.box[1]) * 100}%`,
        border: '3px solid #ef4444', 
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        zIndex: 20
    } : {};

    return (
        <div className="relative w-full aspect-video bg-black flex items-center justify-center overflow-hidden rounded-md group">
            {/* NÚT TẮT (CLOSE BUTTON) */}
            <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-50 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
            >
                <X className="w-6 h-6" />
            </button>

            <img 
                src={outputImgUrl} 
                alt="AI Evidence" 
                className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            
            {selectedItem.box && (
                <div style={boxStyle} className="pointer-events-none">
                    <span className="absolute -top-7 left-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                        {selectedItem.class} ({(selectedItem.confidence * 100).toFixed(0)}%)
                    </span>
                </div>
            )}
        </div>
    )
  }

  if (loading) return <AppLayout><div className="p-8 text-center">Đang tải...</div></AppLayout>
  if (!scan) return <AppLayout><div className="p-8 text-center">Không tìm thấy dữ liệu</div></AppLayout>

  const isVideo = scan.scan_code.match(/\.(mp4|mov|avi)$/i);
  const fileUrl = getFileUrl();

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
                Vị trí: <b>{scan.location}</b>
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Media View */}
          <div className="flex-1 bg-black/5 flex items-center justify-center p-6 overflow-auto">
             <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
               {isVideo ? (
                 <video src={fileUrl} controls className="w-full h-full object-contain" />
               ) : (
                 <img src={fileUrl} alt="Scan" className="w-full h-full object-contain" />
               )}
             </div>
          </div>

          {/* Right: Results List */}
          <div className="w-96 bg-card border-l border-border flex flex-col shrink-0">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                Kết quả AI ({scan.result_data?.length || 0})
              </h3>
            </div>
            
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {groupedResults.length === 0 ? (
                  <div className="text-center text-muted-foreground py-10">Chưa có kết quả</div>
              ) : groupedResults.map((group, idx) => (
                <Card key={idx} className="p-3 border-l-4 border-l-primary flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <div className="font-bold text-lg flex items-center gap-2">
                            <Box className="w-4 h-4 text-primary" />
                            {group.class}
                        </div>
                        <Badge variant="outline">{group.count}</Badge>
                    </div>
                    
                    {/* Danh sách con: Click vào đây để xem vị trí */}
                    <div className="space-y-1 mt-1 max-h-32 overflow-y-auto pr-1">
                        {group.items.map((item, i) => (
                            <div 
                                key={i} 
                                onClick={() => setSelectedItem(item)} // SỰ KIỆN CLICK Ở ĐÂY
                                className="flex justify-between items-center text-xs p-2 bg-muted/40 rounded cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors group"
                            >
                                <span>#{i+1} Độ tin cậy: {(item.confidence*100).toFixed(0)}%</span>
                                <Eye className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                            </div>
                        ))}
                    </div>
                </Card>
              ))}
            </div>

            <div className="p-4 border-t border-border bg-muted/10">
              <Button 
                onClick={handleSaveToInventory} 
                disabled={groupedResults.length === 0 || isSaving}
                className="w-full"
              >
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                Lưu vào kho
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG HIỂN THỊ VỊ TRÍ */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-5xl w-full p-0 overflow-hidden bg-black border-zinc-800">
             <DialogHeader className="sr-only">
               <DialogTitle>Chi tiết vật thể</DialogTitle>
             </DialogHeader>
             {renderDetailModal()}
             {selectedItem && (
               <div className="absolute bottom-4 left-4 right-4 text-center">
                 <span className="inline-block bg-black/70 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md">
                   Vật thể: <b>{selectedItem.class}</b> - Độ tin cậy: <b>{(selectedItem.confidence * 100).toFixed(1)}%</b>
                 </span>
               </div>
             )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  )
}