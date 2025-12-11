"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createAsset, updateAsset, type CreateAssetPayload, type Asset } from "@/lib/inventory-service"

// 1. DANH MỤC TÀI SẢN (Giữ nguyên)
export const ASSET_CATEGORIES = [
  "Thiết bị giảng dạy",
  "Thiết bị điện tử",
  "Nội thất",
  "Máy móc & Công cụ", 
  "Vật tư văn phòng",
  "Âm thanh & Ánh sáng",
  "Khác"
];

// 2. CẤU TRÚC PHÒNG CỐ ĐỊNH (Hardcode)
// Bạn có thể thêm bớt phòng tùy ý tại đây
const ROOMS_BY_HALL: Record<string, string[]> = {
  "G2": ["101", "102", "201", "202", "301", "302", "305", "Phòng Giáo Viên"],
  "GD2": ["201", "202", "301", "302", "401", "402", "Hội trường lớn"],
  "GD3": ["101", "102", "201", "202", "301", "302"],
  "GD4": ["401 (Lab)", "402 (Lab)", "403", "404", "405"],
};

// Danh sách tòa nhà lấy từ key của object trên + Mục Khác
const LECTURE_HALLS = [
  { id: "G2", name: "Giảng đường G2" },
  { id: "GD2", name: "Giảng đường 2 (GD2)" },
  { id: "GD3", name: "Giảng đường 3 (GD3)" },
  { id: "GD4", name: "Giảng đường 4 (GD4)" },
  { id: "OTHER", name: "Khu vực khác / Ngoài trời" }
]

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  assetToEdit?: Asset | null
}

export function AssetFormDialog({ open, onOpenChange, onSuccess, assetToEdit }: AssetFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedHall, setSelectedHall] = useState("G2")
  const [roomNumber, setRoomNumber] = useState("") // Đây sẽ lưu tên phòng (VD: "201")

  const [formData, setFormData] = useState<CreateAssetPayload>({
    name: "",
    category: ASSET_CATEGORIES[0],
    location: "",
    status: "active",
    value: 0,
    condition: 100,
    description: "",
  })

  // --- EFFECT: LOAD DATA KHI EDIT ---
  useEffect(() => {
    if (open) {
      if (assetToEdit) {
        // 1. Fill thông tin cơ bản
        setFormData({
          name: assetToEdit.name,
          category: assetToEdit.category,
          location: assetToEdit.location,
          status: assetToEdit.status,
          value: assetToEdit.value,
          condition: assetToEdit.condition,
          description: assetToEdit.description || "",
        })

        // 2. Logic tách Location: "GD2 - 201"
        let foundHallId = "OTHER";
        let foundRoom = assetToEdit.location;

        // Tìm xem location cũ có thuộc tòa nhà nào không
        for (const hallId of Object.keys(ROOMS_BY_HALL)) {
           if (assetToEdit.location.startsWith(hallId + " - ")) {
              foundHallId = hallId;
              foundRoom = assetToEdit.location.substring(hallId.length + 3); // Lấy phần đuôi sau "GD2 - "
              break;
           }
        }
        
        setSelectedHall(foundHallId)
        setRoomNumber(foundRoom)

      } else {
        // RESET FORM KHI TẠO MỚI
        setFormData({
          name: "",
          category: ASSET_CATEGORIES[0],
          location: "",
          status: "active",
          value: 0,
          condition: 100,
          description: "",
        })
        setSelectedHall("G2")
        // Mặc định chọn phòng đầu tiên của G2
        setRoomNumber(ROOMS_BY_HALL["G2"][0])
      }
      setError(null)
    }
  }, [open, assetToEdit])

  // --- EFFECT: CẬP NHẬT LOCATION KHI CHỌN PHÒNG ---
  useEffect(() => {
    // Nếu đổi tòa nhà, tự động reset về phòng đầu tiên của tòa đó (trừ khi là OTHER)
    if (selectedHall !== "OTHER" && ROOMS_BY_HALL[selectedHall]) {
       // Chỉ reset nếu phòng hiện tại không nằm trong danh sách của tòa mới
       if (!ROOMS_BY_HALL[selectedHall].includes(roomNumber)) {
          setRoomNumber(ROOMS_BY_HALL[selectedHall][0]);
       }
    }
  }, [selectedHall])

  // Ghép chuỗi Location cuối cùng để gửi lên Server
  useEffect(() => {
    if (selectedHall === "OTHER") {
      setFormData(prev => ({ ...prev, location: roomNumber }))
    } else {
      setFormData(prev => ({ ...prev, location: `${selectedHall} - ${roomNumber}` }))
    }
  }, [selectedHall, roomNumber])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (assetToEdit) {
        await updateAsset(assetToEdit.id, formData)
      } else {
        await createAsset(formData)
      }
      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  const isEditMode = !!assetToEdit
  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Cập nhật Tài sản" : "Thêm Tài sản Mới"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Chỉnh sửa thông tin chi tiết." : "Nhập thông tin tài sản để thêm vào kho."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Tên thiết bị <span className="text-red-500">*</span></label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="VD: Máy chiếu Panasonic..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Danh mục <span className="text-red-500">*</span></label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className={selectClass}
              >
                {ASSET_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Giá trị (VNĐ)</label>
              <Input
                required type="number" min="0"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* --- KHU VỰC CHỌN VỊ TRÍ --- */}
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
               📍 Vị trí đặt tài sản
            </h4>
            <div className="grid grid-cols-2 gap-4">
              {/* Cột 1: Chọn Tòa nhà */}
              <div>
                <label className="block text-sm font-medium mb-1">Khu vực / Tòa nhà</label>
                <select
                  value={selectedHall}
                  onChange={(e) => setSelectedHall(e.target.value)}
                  className={selectClass}
                >
                  {LECTURE_HALLS.map(hall => (
                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Cột 2: Chọn Phòng (Logic động) */}
              <div>
                <label className="block text-sm font-medium mb-1">Phòng cụ thể</label>
                
                {selectedHall === "OTHER" ? (
                  // Nếu là OTHER -> Cho nhập tay
                  <Input
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="Nhập vị trí..."
                  />
                ) : (
                  // Nếu là Tòa nhà cố định -> Dropdown danh sách phòng
                  <select
                    required
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    className={selectClass}
                  >
                    {ROOMS_BY_HALL[selectedHall]?.map(room => (
                      <option key={room} value={room}>P. {room}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className={selectClass}
              >
                <option value="active">Đang sử dụng</option>
                <option value="maintenance">Đang bảo trì</option>
                <option value="inactive">Hỏng / Mất</option>
              </select>
            </div>

        
<div>
  <label className="block text-sm font-medium mb-1">Tình trạng (%)</label>
  <Input
    type="number" min="0" max="100"
    // SỬA 1: Dùng (?? "") để nếu là undefined/null thì hiện rỗng, còn 0 vẫn hiện 0
    value={formData.condition ?? ""} 
    
    // SỬA 2: Nếu value rỗng thì set là undefined, ngược lại mới parse số
    onChange={(e) => {
      const val = e.target.value;
      setFormData({ 
        ...formData, 
        condition: val === "" ? undefined : parseInt(val) 
      });
    }}
  />
</div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả thêm</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Hủy bỏ</Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white">
              {loading ? "Đang lưu..." : (isEditMode ? "Lưu thay đổi" : "Thêm mới")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}