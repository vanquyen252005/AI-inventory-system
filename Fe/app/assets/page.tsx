"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Download, Edit2, Trash2, Eye, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { AssetFormDialog } from "@/components/asset-form-dialog"
import { getAssets, deleteAsset, type Asset } from "@/lib/inventory-service"
// Import useDebounce nếu bạn có, hoặc dùng setTimeout thủ công để tránh gọi API quá nhiều khi gõ

export default function AssetsPage() {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("") // Thay cho selectedHall cũ
  
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [totalAssets, setTotalAssets] = useState(0) // Để hiện tổng số
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  // --- EFFECT: Gọi API khi filter thay đổi ---
  useEffect(() => {
    // Kỹ thuật Debounce: Chỉ gọi API sau khi ngừng gõ 500ms
    const timer = setTimeout(() => {
      loadAssets()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, locationFilter]) // Chạy lại khi search hoặc location thay đổi

  // --- HÀM LOAD DỮ LIỆU TỪ API ---
  const loadAssets = async () => {
    try {
      setLoading(true)
      // Gọi API với tham số filter
      const response = await getAssets({ 
        limit: 100,
        search: searchTerm,      // Gửi tên/ID xuống backend
        location: locationFilter // Gửi phòng xuống backend
      })
      setAssets(response.assets)
      setTotalAssets(response.total)
    } catch (error) {
      console.error("Lỗi tải tài sản:", error)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  // --- ACTIONS ---
  const handleCreate = () => {
    setEditingAsset(null)
    setDialogOpen(true)
  }

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset)
    setDialogOpen(true)
  }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài sản "${name}" không?`)) {
      try {
        await deleteAsset(id)
        loadAssets() // Reload lại sau khi xóa
      } catch (error) {
        alert("Xóa thất bại")
      }
    }
  }

  const handleAssetSaved = () => {
    loadAssets()
  }

  // --- HELPERS UI ---
  const getStatusColor = (status: Asset["status"]) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "maintenance": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getConditionColor = (condition: number) => {
    if (condition >= 80) return "text-green-600"
    if (condition >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý Tài sản UET</h1>
            <p className="text-muted-foreground">Theo dõi trang thiết bị tại các giảng đường</p>
          </div>
          <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2">
            <Plus className="w-5 h-5" /> Thêm mới
          </Button>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 flex-wrap">
            {/* 1. Ô Tìm kiếm Tên/ID */}
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Tìm tên hoặc mã tài sản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 2. Ô Tìm kiếm Phòng (MỚI) */}
            <div className="relative w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Nhập phòng (VD: 301, GD2...)"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="w-5 h-5" /> Xuất Excel
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Đang tải dữ liệu...</div>
            ) : assets.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">Không tìm thấy tài sản nào.</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Mã TS</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tên thiết bị</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Danh mục</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Vị trí</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Chất lượng</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Giá trị</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((asset) => (
                    <tr key={asset.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-primary" title={asset.id}>
                        {asset.id.substring(0, 8)}...
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{asset.name}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{asset.category}</td>
                      <td className="px-6 py-4 text-sm text-foreground flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-muted-foreground" />
                        {asset.location}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                          {asset.status === 'active' ? 'Đang dùng' : asset.status === 'maintenance' ? 'Bảo trì' : 'Hỏng/Mất'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 w-16 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${asset.condition}%` }} />
                          </div>
                          <span className={`text-xs font-semibold ${getConditionColor(asset.condition)}`}>
                            {asset.condition}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(asset.value)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleEdit(asset)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground">
                             <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(asset.id, asset.name)} className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-destructive">
                             <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          
          {/* Footer phân trang */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Hiển thị {assets.length} / {totalAssets} tài sản
            </p>
            {/* Nếu muốn làm phân trang đầy đủ, cần thêm state page/totalPages */}
          </div>
        </Card>

        <AssetFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSuccess={handleAssetSaved}
          assetToEdit={editingAsset}
        />
      </div>
    </AppLayout>
  )
}