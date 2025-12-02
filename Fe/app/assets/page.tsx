"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Download, Edit2, Trash2, Eye, MapPin } from "lucide-react"
import { useState, useEffect } from "react"
import { AssetFormDialog } from "@/components/asset-form-dialog"
import { getAssets, deleteAsset, type Asset } from "@/lib/inventory-service" // Thêm deleteAsset

export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedHall, setSelectedHall] = useState("ALL")
  
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  
  // State quản lý dialog và item đang sửa
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)

  useEffect(() => {
    loadAssets()
  }, [])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const response = await getAssets({ limit: 100 })
      setAssets(response.assets)
    } catch (error) {
      console.error("Lỗi tải tài sản:", error)
      setAssets([])
    } finally {
      setLoading(false)
    }
  }

  // --- HÀM XỬ LÝ MỚI ---

  // 1. Mở form thêm mới
  const handleCreate = () => {
    setEditingAsset(null) // Đảm bảo không dính dữ liệu cũ
    setDialogOpen(true)
  }

  // 2. Mở form chỉnh sửa
  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset) // Gán item cần sửa
    setDialogOpen(true)
  }

  // 3. Xử lý xóa
  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài sản "${name}" không? hành động này không thể hoàn tác.`)) {
      try {
        await deleteAsset(id)
        // Xóa thành công thì load lại danh sách
        loadAssets()
      } catch (error) {
        alert("Xóa thất bại: " + (error instanceof Error ? error.message : "Lỗi không xác định"))
      }
    }
  }

  const handleAssetSaved = () => {
    loadAssets() // Load lại danh sách sau khi thêm hoặc sửa
  }

  // ---------------------

  const getStatusColor = (status: Asset["status"]) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "maintenance": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "inactive": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getStatusText = (status: Asset["status"]) => {
    switch (status) {
      case "active": return "Đang dùng";
      case "maintenance": return "Bảo trì";
      case "inactive": return "Ngừng dùng";
      default: return status;
    }
  }

  const getConditionColor = (condition: number) => {
    if (condition >= 80) return "text-green-600"
    if (condition >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesHall = selectedHall === "ALL" 
      ? true 
      : asset.location.startsWith(selectedHall)

    return matchesSearch && matchesHall
  })

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Quản lý Tài sản UET</h1>
            <p className="text-muted-foreground">Theo dõi trang thiết bị tại các giảng đường</p>
          </div>
          {/* Nút thêm mới gọi hàm handleCreate */}
          <Button
            onClick={handleCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Thêm mới
          </Button>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc mã tài sản..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <select 
                className="h-10 px-3 rounded-md border border-input bg-background text-sm min-w-[180px]"
                value={selectedHall}
                onChange={(e) => setSelectedHall(e.target.value)}
              >
                <option value="ALL">Tất cả khu vực</option>
                <option value="GD2">Giảng đường 2 (GD2)</option>
                <option value="GD3">Giảng đường 3 (GD3)</option>
                <option value="GD4">Giảng đường 4 (GD4)</option>
                <option value="G2">Giảng đường G2</option>
              </select>
            </div>

            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="w-5 h-5" />
              Xuất Excel
            </Button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">Đang tải dữ liệu...</p>
              </div>
            ) : filteredAssets.length === 0 ? (
              <div className="p-12 text-center">
                <p className="text-muted-foreground">
                  {searchTerm || selectedHall !== "ALL" 
                    ? "Không tìm thấy tài sản phù hợp." 
                    : "Chưa có tài sản nào. Hãy thêm mới!"}
                </p>
              </div>
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
                  {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-primary">{asset.id.substring(0, 8)}...</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{asset.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{asset.category}</td>
                    <td className="px-6 py-4 text-sm text-foreground flex items-center gap-2">
                       <MapPin className="w-3 h-3 text-muted-foreground" />
                       {asset.location}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                        {getStatusText(asset.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 w-16 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent"
                            style={{ width: `${asset.condition}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${getConditionColor(asset.condition)}`}>
                          {asset.condition}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(asset.value)}
                    </td>
                    
                    {/* --- CÁC NÚT THAO TÁC ĐÃ ĐƯỢC GẮN SỰ KIỆN --- */}
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        {/* Nút Xem (tạm thời dùng chung Edit) */}
                        <button 
                          onClick={() => handleEdit(asset)}
                          className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" 
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        {/* Nút Sửa */}
                        <button 
                          onClick={() => handleEdit(asset)}
                          className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors" 
                          title="Sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        {/* Nút Xóa */}
                        <button 
                          onClick={() => handleDelete(asset.id, asset.name)}
                          className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors" 
                          title="Xóa"
                        >
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

          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Hiển thị {filteredAssets.length} trên tổng số {assets.length} tài sản
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Trước</Button>
              <Button variant="outline" size="sm">Sau</Button>
            </div>
          </div>
        </Card>

        {/* Dialog nhận thêm prop assetToEdit */}
        <AssetFormDialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if(!open) setEditingAsset(null) // Reset khi đóng
          }}
          onSuccess={handleAssetSaved}
          assetToEdit={editingAsset} 
        />
      </div>
    </AppLayout>
  )
}