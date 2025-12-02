"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createAsset, updateAsset, type CreateAssetPayload, type Asset } from "@/lib/inventory-service"

const LECTURE_HALLS = [
  { id: "G2", name: "Giảng đường G2" },
  { id: "GD2", name: "Giảng đường 2 (GD2)" },
  { id: "GD3", name: "Giảng đường 3 (GD3)" },
  { id: "GD4", name: "Giảng đường 4 (GD4)" },
  { id: "OTHER", name: "Khu vực khác" }
]

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  assetToEdit?: Asset | null // Thêm prop này để nhận dữ liệu cần sửa
}

export function AssetFormDialog({ open, onOpenChange, onSuccess, assetToEdit }: AssetFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [selectedHall, setSelectedHall] = useState("G2")
  const [roomNumber, setRoomNumber] = useState("")

  const [formData, setFormData] = useState<CreateAssetPayload>({
    name: "",
    category: "",
    location: "",
    status: "active",
    value: 0,
    condition: 100,
    description: "",
  })

  // Effect: Khi mở dialog, nếu có assetToEdit thì điền dữ liệu vào form
  useEffect(() => {
    if (open) {
      if (assetToEdit) {
        // Chế độ SỬA: Parse dữ liệu cũ
        setFormData({
          name: assetToEdit.name,
          category: assetToEdit.category,
          location: assetToEdit.location,
          status: assetToEdit.status,
          value: assetToEdit.value,
          condition: assetToEdit.condition,
          description: assetToEdit.description || "",
        })

        // Logic tách chuỗi Location: "GD2 - 201" -> Hall: GD2, Room: 201
        const parts = assetToEdit.location.split(" - ")
        const foundHall = LECTURE_HALLS.find(h => h.id === parts[0])
        
        if (foundHall && parts.length > 1) {
          setSelectedHall(foundHall.id)
          setRoomNumber(parts.slice(1).join(" - ")) // Ghép phần còn lại nếu có
        } else {
          setSelectedHall("OTHER")
          setRoomNumber(assetToEdit.location)
        }
      } else {
        // Chế độ THÊM MỚI: Reset form
        setFormData({
          name: "",
          category: "",
          location: "",
          status: "active",
          value: 0,
          condition: 100,
          description: "",
        })
        setSelectedHall("G2")
        setRoomNumber("")
      }
      setError(null)
    }
  }, [open, assetToEdit])

  // Cập nhật location khi hall/room thay đổi
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
        // Gọi API Update
        await updateAsset(assetToEdit.id, formData)
      } else {
        // Gọi API Create
        await createAsset(formData)
      }
      
      onSuccess()
      onOpenChange(false)
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra")
    } finally {
      setLoading(false)
    }
  }

  const isEditMode = !!assetToEdit

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Cập nhật Tài sản" : "Thêm Tài sản Mới"}</DialogTitle>
          <DialogDescription>
            {isEditMode ? "Chỉnh sửa thông tin chi tiết của thiết bị." : "Nhập thông tin chi tiết tài sản để thêm vào kho UET."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                Tên thiết bị <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ví dụ: Máy chiếu Panasonic PT-LB306"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Danh mục <span className="text-red-500">*</span>
              </label>
              <Input
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ví dụ: Thiết bị giảng dạy"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Giá trị (VNĐ) <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="number"
                min="0"
                value={formData.value}
                onChange={(e) =>
                  setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg border border-border space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Vị trí đặt tài sản</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Giảng đường <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedHall}
                  onChange={(e) => setSelectedHall(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary"
                >
                  {LECTURE_HALLS.map(hall => (
                    <option key={hall.id} value={hall.id}>{hall.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phòng / Chi tiết <span className="text-red-500">*</span>
                </label>
                <Input
                  required
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  placeholder={selectedHall === 'OTHER' ? "Nhập vị trí cụ thể..." : "Ví dụ: 201, 305..."}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Trạng thái
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "maintenance" | "inactive",
                  })
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
              >
                <option value="active">Đang sử dụng</option>
                <option value="maintenance">Đang bảo trì</option>
                <option value="inactive">Ngừng sử dụng</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tình trạng (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: parseInt(e.target.value) || 100 })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mô tả thêm
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white">
              {loading ? "Đang lưu..." : (isEditMode ? "Lưu thay đổi" : "Thêm mới")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}