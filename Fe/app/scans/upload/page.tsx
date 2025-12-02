"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UploadCloud, FileVideo, FileImage, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { uploadScan } from "@/lib/scan-service"

const LECTURE_HALLS = [
  { id: "G2", name: "Giảng đường G2" },
  { id: "GD2", name: "Giảng đường 2 (GD2)" },
  { id: "GD3", name: "Giảng đường 3 (GD3)" },
  { id: "GD4", name: "Giảng đường 4 (GD4)" },
  { id: "OTHER", name: "Khu vực khác" }
]

export default function UploadScanPage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // State location
  const [selectedHall, setSelectedHall] = useState("G2")
  const [roomNumber, setRoomNumber] = useState("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      
      // Tạo preview nếu là ảnh
      if (selectedFile.type.startsWith("image/")) {
        setPreview(URL.createObjectURL(selectedFile))
      } else {
        setPreview(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setIsUploading(true)
      
      // Format location chuẩn UET: "GD2 - 201"
      const location = selectedHall === "OTHER" 
        ? roomNumber 
        : `${selectedHall} - ${roomNumber}`

      await uploadScan(file, location)
      
      // Upload xong chuyển về trang danh sách
      router.push("/scans")
    } catch (error) {
      console.error(error)
      alert("Lỗi tải lên: " + (error instanceof Error ? error.message : "Vui lòng thử lại"))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto">
        <div className="mb-6">
          <Link href="/scans" className="text-muted-foreground hover:text-primary flex items-center gap-2 mb-4 text-sm">
            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Tải lên dữ liệu quét</h1>
          <p className="text-muted-foreground">Upload video hoặc hình ảnh phòng học để AI nhận diện thiết bị.</p>
        </div>

        <Card className="p-8">
          {/* Khu vực chọn File */}
          <div className="border-2 border-dashed border-border rounded-xl p-10 flex flex-col items-center justify-center text-center hover:bg-muted/30 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*,video/*" 
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            {file ? (
              <div className="space-y-4">
                {preview ? (
                  <div className="relative w-full max-w-xs mx-auto aspect-video rounded-lg overflow-hidden border border-border">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600">
                    <FileVideo className="w-10 h-10" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                  Chọn file khác
                </Button>
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4">
                  <UploadCloud className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Kéo thả hoặc Click để tải lên</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Hỗ trợ định dạng hình ảnh (JPG, PNG) và video (MP4). Dung lượng tối đa 50MB.
                </p>
              </>
            )}
          </div>

          {/* Form chọn vị trí */}
          <div className="mt-8 space-y-6">
            <h3 className="text-lg font-semibold">Thông tin vị trí quét</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Khu vực / Giảng đường
                </label>
                <select
                  value={selectedHall}
                  onChange={(e) => setSelectedHall(e.target.value)}
                  className="w-full h-11 px-3 rounded-md border border-input bg-background text-foreground text-sm"
                >
                  {LECTURE_HALLS.map(hall => (
                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Số phòng / Chi tiết
                </label>
                <Input 
                  placeholder="Ví dụ: 301, Phòng máy 1..." 
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => router.back()}>Hủy bỏ</Button>
              <Button 
                onClick={handleUpload} 
                disabled={!file || !roomNumber || isUploading}
                className="min-w-[140px] bg-primary hover:bg-primary/90"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang tải lên...
                  </>
                ) : (
                  "Bắt đầu Quét AI"
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}