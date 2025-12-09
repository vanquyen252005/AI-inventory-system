"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Video, Image as ImageIcon, Search, Calendar, MapPin, ChevronRight, CheckCircle2, Clock, UploadCloud, X, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, useMemo } from "react"
import { getScans, uploadScan, type ScanResult } from "@/lib/scan-service"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

// --- CONSTANTS: ĐỊA ĐIỂM (Đồng bộ với Asset) ---
const ROOMS_BY_HALL: Record<string, string[]> = {
  "G2": ["101", "102", "201", "202", "301", "302", "305", "Phòng Giáo Viên"],
  "GD2": ["201", "202", "301", "302", "401", "402", "Hội trường lớn"],
  "GD3": ["101", "102", "201", "202", "301", "302"],
  "GD4": ["401 (Lab)", "402 (Lab)", "403", "404", "405"],
};

const LECTURE_HALLS = [
  { id: "G2", name: "Giảng đường G2" },
  { id: "GD2", name: "Giảng đường 2 (GD2)" },
  { id: "GD3", name: "Giảng đường 3 (GD3)" },
  { id: "GD4", name: "Giảng đường 4 (GD4)" },
  { id: "OTHER", name: "Khu vực khác" }
]

export default function ScansPage() {
  // --- STATE ---
  const [scans, setScans] = useState<ScanResult[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filter State
  const [filterHall, setFilterHall] = useState("ALL")
  const [filterRoom, setFilterRoom] = useState("ALL")
  const [searchTerm, setSearchTerm] = useState("")

  // Upload Dialog State
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadHall, setUploadHall] = useState("G2")
  const [uploadRoom, setUploadRoom] = useState(ROOMS_BY_HALL["G2"][0])

  useEffect(() => {
    loadScans()
  }, [])

  // Reset phòng khi đổi tòa nhà trong Upload Dialog
  useEffect(() => {
    if (uploadOpen && uploadHall !== "OTHER" && ROOMS_BY_HALL[uploadHall]) {
       if (!ROOMS_BY_HALL[uploadHall].includes(uploadRoom)) {
          setUploadRoom(ROOMS_BY_HALL[uploadHall][0]);
       }
    }
  }, [uploadHall, uploadOpen])

  const loadScans = async () => {
    try {
      setLoading(true)
      const data = await getScans()
      // Sắp xếp mới nhất lên đầu
      const sortedData = data.sort((a, b) => new Date(b.scanned_at).getTime() - new Date(a.scanned_at).getTime())
      setScans(sortedData)
    } catch (error) {
      console.error("Failed to load scans", error)
    } finally {
      setLoading(false)
    }
  }

  // --- LOGIC FILTER ---
  const filteredScans = useMemo(() => {
    return scans.filter(scan => {
      // 1. Lọc theo Text (Mã hoặc Tên)
      const matchText = (scan.location || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                        scan.scan_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchText) return false;

      // 2. Lọc theo Tòa nhà
      if (filterHall !== "ALL") {
         if (!scan.location) return false;
         // Nếu chọn OTHER, tìm các location không bắt đầu bằng G2, GD2...
         if (filterHall === "OTHER") {
             const isKnown = LECTURE_HALLS.some(h => h.id !== "OTHER" && scan.location?.startsWith(h.id));
             if (isKnown) return false;
         } else {
             if (!scan.location.startsWith(filterHall)) return false;
         }
      }

      // 3. Lọc theo Phòng (nếu đã chọn Tòa nhà)
      if (filterHall !== "ALL" && filterHall !== "OTHER" && filterRoom !== "ALL") {
          // Location dạng: "GD2 - 201" -> check xem có chứa " - 201" ko
          if (!scan.location?.endsWith(` - ${filterRoom}`)) return false;
      }

      return true;
    })
  }, [scans, searchTerm, filterHall, filterRoom]);

  // --- HANDLE UPLOAD ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    // Ghép location chuẩn
    let location = uploadRoom;
    if (uploadHall !== "OTHER") {
        location = `${uploadHall} - ${uploadRoom}`;
    }

    try {
      setUploading(true);
      await uploadScan(selectedFile, location);
      
      // Reset & Reload
      setUploadOpen(false);
      setSelectedFile(null);
      loadScans();
      alert("Tải lên thành công! Hệ thống đang xử lý...");
    } catch (error) {
      alert("Lỗi tải lên. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  }

  // Style inputs
  const selectClass = "h-10 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Lịch sử Quét AI</h1>
            <p className="text-muted-foreground">Quản lý video và hình ảnh giám sát tài sản.</p>
          </div>
          <Button onClick={() => setUploadOpen(true)} className="bg-primary hover:bg-primary/90 gap-2 shadow-lg hover:shadow-primary/25">
            <Plus className="w-5 h-5" /> Quét mới
          </Button>
        </div>

        {/* --- FILTERS TOOLBAR --- */}
        <Card className="p-4 mb-6 sticky top-4 z-20 shadow-sm border-muted-foreground/10 backdrop-blur-sm bg-background/95">
          <div className="flex flex-col md:flex-row gap-3">
            {/* 1. Chọn Tòa nhà */}
            <select 
               className={`w-full md:w-48 ${selectClass}`}
               value={filterHall}
               onChange={(e) => { setFilterHall(e.target.value); setFilterRoom("ALL"); }}
            >
               <option value="ALL">Tất cả khu vực</option>
               {LECTURE_HALLS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>

            {/* 2. Chọn Phòng (Hiện khi đã chọn Tòa) */}
            {filterHall !== "ALL" && filterHall !== "OTHER" && (
                <select 
                    className={`w-full md:w-32 ${selectClass}`}
                    value={filterRoom}
                    onChange={(e) => setFilterRoom(e.target.value)}
                >
                    <option value="ALL">Tất cả</option>
                    {ROOMS_BY_HALL[filterHall]?.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            )}

            {/* 3. Search Text */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Tìm mã quét..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* --- LIST SCANS --- */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Đang tải dữ liệu...</div>
          ) : filteredScans.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
              <Video className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-medium">Chưa có dữ liệu</h3>
              <p className="text-muted-foreground mb-6 text-sm">Thử thay đổi bộ lọc hoặc tải lên video mới.</p>
              <Button variant="outline" onClick={() => {setFilterHall("ALL"); setSearchTerm("");}}>Xóa bộ lọc</Button>
            </div>
          ) : (
            filteredScans.map((scan) => (
              <Card key={scan.id} className="p-4 hover:border-primary/50 transition-all group bg-card">
                <div className="flex items-center gap-4 md:gap-6">
                  {/* Thumbnail / Icon */}
                  <div className="w-16 h-16 md:w-20 md:h-20 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700">
                    {scan.scan_code.match(/\.(mp4|mov|avi|mkv)$/i) ? (
                      <Video className="w-8 h-8 text-blue-500" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-purple-500" />
                    )}
                  </div>

                  {/* Info Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                      <h3 className="font-bold text-base md:text-lg truncate" title={scan.scan_code}>{scan.scan_code}</h3>
                      {scan.status === "completed" ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 gap-1 font-normal">
                          <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                        </Badge>
                      ) : scan.status === "failed" ? (
                         <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-normal">
                          Thất bại
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 font-normal animate-pulse">
                          <Clock className="w-3 h-3" /> Đang xử lý
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" /> 
                        <span className="font-medium text-foreground">{scan.location || "Chưa xác định"}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(scan.scanned_at).toLocaleString("vi-VN")}
                      </div>
                    </div>
                  </div>

                  {/* Stats (Desktop only) */}
                  <div className="text-right px-4 border-l border-border hidden md:block min-w-[100px]">
                    <div className="text-xs text-muted-foreground uppercase font-semibold">Phát hiện</div>
                    <div className="text-2xl font-bold text-foreground">{scan.device_cnt}</div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/scans/${scan.id}`}>
                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100">
                      <ChevronRight className="w-6 h-6 text-slate-400" />
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* --- UPLOAD DIALOG (Mới: Chuẩn hóa Location) --- */}
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tải lên dữ liệu quét</DialogTitle>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* 1. Vùng chọn File */}
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50 transition-colors relative">
                <Input 
                   type="file" 
                   accept="image/*,video/*"
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   onChange={handleFileChange}
                />
                <div className="flex flex-col items-center gap-2 pointer-events-none">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                   </div>
                   {selectedFile ? (
                      <div className="text-sm font-medium text-blue-600 truncate max-w-[300px]">
                        {selectedFile.name}
                      </div>
                   ) : (
                      <>
                        <div className="text-sm font-medium">Kéo thả hoặc bấm để chọn</div>
                        <div className="text-xs text-muted-foreground">Hỗ trợ MP4, AVI, JPG, PNG</div>
                      </>
                   )}
                </div>
              </div>

              {/* 2. Chọn Vị trí (Chuẩn hóa) */}
              <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
                 <h4 className="text-sm font-semibold flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" /> Vị trí thực hiện
                 </h4>
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Khu vực</label>
                        <select 
                            className={selectClass} 
                            value={uploadHall}
                            onChange={(e) => setUploadHall(e.target.value)}
                        >
                            {LECTURE_HALLS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 mb-1 block">Phòng</label>
                         {uploadHall === "OTHER" ? (
                            <Input 
                                value={uploadRoom} 
                                onChange={(e) => setUploadRoom(e.target.value)}
                                placeholder="Nhập vị trí..."
                                className="h-10"
                            />
                         ) : (
                            <select 
                                className={selectClass}
                                value={uploadRoom}
                                onChange={(e) => setUploadRoom(e.target.value)}
                            >
                                {ROOMS_BY_HALL[uploadHall]?.map(r => <option key={r} value={r}>P. {r}</option>)}
                            </select>
                         )}
                    </div>
                 </div>
              </div>
            </div>

            <DialogFooter>
               <Button variant="outline" onClick={() => setUploadOpen(false)} disabled={uploading}>Hủy</Button>
               <Button onClick={handleUpload} disabled={!selectedFile || uploading} className="bg-primary">
                  {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {uploading ? "Đang tải lên..." : "Bắt đầu quét"}
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AppLayout>
  )
}