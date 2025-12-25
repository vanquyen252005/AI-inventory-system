"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog" 
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Plus, Edit2, Trash2, MapPin, Box, Monitor, Armchair, ArrowRightLeft, X, Save, Image as ImageIcon } from "lucide-react" 
import { useState, useEffect, useMemo } from "react"
import { AssetFormDialog, ASSET_CATEGORIES } from "@/components/asset-form-dialog"
import { getAssets, deleteAsset, updateAsset, type Asset } from "@/lib/inventory-service"
import { cn } from "@/lib/utils"
import { useRef } from "react" // Thêm useRef
import { useReactToPrint } from "react-to-print" // Thêm hook in ấn
import { Printer } from "lucide-react" // Thêm icon máy in
import { AssetPrintTemplate } from "@/components/asset-print-template"

// --- CONSTANTS ---
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

// --- TYPES ---
type RoomSummary = {
  roomName: string;
  fullLocation: string;
  assets: Asset[];
  categoryCounts: Record<string, number>;
  totalValue: number;
}

export default function AssetsPage() {
  // --- STATE ---
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all") 
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  
  // Dialog State
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<RoomSummary | null>(null)
  
  // State xem ảnh bằng chứng
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);

  // Move Asset State
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [assetToMove, setAssetToMove] = useState<Asset | null>(null)
  
  const [moveHall, setMoveHall] = useState("G2")   
  const [moveRoom, setMoveRoom] = useState("")     
  
  const printComponentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Danh_sach_tai_san_${selectedRoom?.roomName}`,
  });

  // --- FETCH DATA ---
  useEffect(() => {
    const timer = setTimeout(() => loadAssets(), 500)
    return () => clearTimeout(timer)
  }, [searchTerm, categoryFilter])

  const loadAssets = async () => {
    try {
      setLoading(true)
      const response = await getAssets({ 
        limit: 1000, 
        search: searchTerm,
        category: categoryFilter === "all" ? undefined : categoryFilter 
      })
      setAssets(response.assets)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  // --- GROUPING LOGIC ---
  const buildingGroups = useMemo(() => {
    const groups: Record<string, Record<string, RoomSummary>> = {};

    assets.forEach(asset => {
      let building = "Khu vực khác";
      let room = "Chưa phân loại";
      const loc = asset.location || "";
      
      if (loc.includes(" - ")) {
        const parts = loc.split(" - ");
        if (parts.length >= 2) {
            const hallId = parts[0].trim();
            const isKnownHall = LECTURE_HALLS.some(h => h.id === hallId);
            if (isKnownHall) {
                building = hallId;
                room = parts.slice(1).join(" - ").trim();
            } else {
                building = loc; 
            }
        }
      } else if (loc) {
        building = loc;
      }

      if (!groups[building]) groups[building] = {};
      if (!groups[building][room]) {
        groups[building][room] = {
          roomName: room,
          fullLocation: loc,
          assets: [],
          categoryCounts: {},
          totalValue: 0,
        };
      }

      const currentRoom = groups[building][room];
      currentRoom.assets.push(asset);
      currentRoom.totalValue += Number(asset.value || 0);
      
      const cat = asset.category || "Khác";
      currentRoom.categoryCounts[cat] = (currentRoom.categoryCounts[cat] || 0) + 1;
    });

    return Object.entries(groups)
      .map(([buildingName, roomsObj]) => ({
        buildingName,
        rooms: Object.values(roomsObj).sort((a, b) => a.roomName.localeCompare(b.roomName))
      }))
      .sort((a, b) => a.buildingName.localeCompare(b.buildingName));

  }, [assets]);

  useEffect(() => {
    if (selectedRoom) {
      for (const group of buildingGroups) {
        const freshRoom = group.rooms.find(r => 
          r.roomName === selectedRoom.roomName && 
          r.fullLocation === selectedRoom.fullLocation 
        );
        
        if (freshRoom) {
          setSelectedRoom(freshRoom);
          return;
        }
      }
    }
  }, [buildingGroups, selectedRoom]);

  // --- ACTIONS ---
  const handleCreate = () => { setEditingAsset(null); setCreateDialogOpen(true); }
  const handleEdit = (asset: Asset) => { setEditingAsset(asset); setCreateDialogOpen(true); }

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Xóa tài sản "${name}"?`)) {
      await deleteAsset(id); loadAssets();
      if (selectedRoom) {
         setSelectedRoom(prev => prev ? ({ ...prev, assets: prev.assets.filter(a => a.id !== id) }) : null);
      }
    }
  }

  // --- LOGIC DI CHUYỂN TÀI SẢN ---
  const openMoveDialog = (asset: Asset) => {
    setAssetToMove(asset);
    
    let foundHallId = "OTHER";
    let foundRoom = asset.location || "";

    for (const hall of LECTURE_HALLS) {
       if (asset.location && asset.location.startsWith(hall.id + " - ")) {
          foundHallId = hall.id;
          foundRoom = asset.location.substring(hall.id.length + 3);
          break;
       }
    }
    
    setMoveHall(foundHallId);
    setMoveRoom(foundRoom);
    setMoveDialogOpen(true);
  }

  useEffect(() => {
    if (moveDialogOpen && moveHall !== "OTHER" && ROOMS_BY_HALL[moveHall]) {
       if (!ROOMS_BY_HALL[moveHall].includes(moveRoom)) {
          setMoveRoom(ROOMS_BY_HALL[moveHall][0]);
       }
    }
  }, [moveHall, moveDialogOpen])

  const handleMoveSubmit = async () => {
    if (!assetToMove) return;
    
    let finalLocation = moveRoom;
    if (moveHall !== "OTHER") {
        finalLocation = `${moveHall} - ${moveRoom}`;
    }

    if (!finalLocation.trim()) {
        alert("Vui lòng nhập/chọn phòng đích.");
        return;
    }
    
    try {
      await updateAsset(assetToMove.id, { location: finalLocation });
      alert(`Đã chuyển "${assetToMove.name}" sang ${finalLocation}`);
      setMoveDialogOpen(false);
      setAssetToMove(null);
      await loadAssets();
      
      if (selectedRoom) {
         setSelectedRoom(prev => prev ? ({
             ...prev,
             assets: prev.assets.filter(a => a.id !== assetToMove.id)
         }) : null);
      }
    } catch (error) {
      alert("Lỗi khi di chuyển tài sản");
    }
  }

  // --- HELPERS ---
  const getCategoryIcon = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes("máy tính") || cat.includes("pc")) return <Monitor className="w-3 h-3" />;
    if (cat.includes("ghế") || cat.includes("bàn") || cat.includes("nội thất")) return <Armchair className="w-3 h-3" />;
    return <Box className="w-3 h-3" />;
  }

  const getStatusColor = (status: string) => {
    if (status === 'active') return "text-green-600 bg-green-50 border-green-200";
    if (status === 'maintenance') return "text-orange-600 bg-orange-50 border-orange-200";
    return "text-red-600 bg-red-50 border-red-200";
  }

  // --- RENDER MODAL XEM ẢNH ---
  const renderEvidenceModal = () => {
      if(!viewingAsset || !viewingAsset.evidence_url) return null;

      // Xử lý URL
      let imgUrl = viewingAsset.evidence_url;
      if (imgUrl && !imgUrl.startsWith('http')) {
          imgUrl = `${process.env.NEXT_PUBLIC_INVENTORY_API_URL}/${imgUrl}`;
      }

      // Xử lý BBox
      let box = viewingAsset.evidence_bbox;
      if (typeof box === 'string') {
          try { box = JSON.parse(box); } catch(e) {}
      }

      const boxStyle: React.CSSProperties = (Array.isArray(box)) ? {
        position: 'absolute',
        left: `${box[0] * 100}%`,
        top: `${box[1] * 100}%`,
        width: `${(box[2] - box[0]) * 100}%`,
        height: `${(box[3] - box[1]) * 100}%`,
        border: '3px solid #ef4444', 
        zIndex: 20
      } : {};

      return (
        <div className="relative w-full aspect-video bg-black flex items-center justify-center rounded overflow-hidden">
             <button onClick={() => setViewingAsset(null)} className="absolute top-2 right-2 z-50 bg-black/60 hover:bg-red-600 text-white p-2 rounded-full transition-colors">
                <X className="w-5 h-5"/>
             </button>
             <img src={imgUrl} className="w-full h-full object-contain" />
             {Array.isArray(box) && <div style={boxStyle}></div>}
        </div>
      )
  }

  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <AppLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sơ đồ tài sản</h1>
            <p className="text-slate-500 text-sm">Quản lý thiết bị theo từng giảng đường</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select 
              className={`w-40 ${selectClass}`}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">Tất cả danh mục</option>
              {ASSET_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Tìm tên, mã TS..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="w-4 h-4 mr-1" /> Thêm
            </Button>
          </div>
        </div>

        {/* MAIN GRID */}
        {loading ? (
           <div className="py-20 text-center text-slate-400">Đang tải dữ liệu...</div>
        ) : assets.length === 0 ? (
           <div className="py-20 text-center text-slate-400 border-2 border-dashed rounded-xl">Không có dữ liệu</div>
        ) : (
          <div className="space-y-10">
            {buildingGroups.map((group) => (
              <div key={group.buildingName} className="animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wide">{group.buildingName}</h2>
                  <div className="h-px bg-slate-200 flex-1 ml-4" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.rooms.map((room) => (
                    <Card 
                      key={room.roomName}
                      onClick={() => setSelectedRoom(room)}
                      className="group cursor-pointer hover:border-blue-300 hover:shadow-md transition-all duration-200 relative overflow-hidden border-slate-200 bg-white"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 group-hover:bg-blue-600 transition-colors" />
                      <div className="p-4 pl-5">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-xl font-bold text-slate-800">P. {room.roomName}</h3>
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-700">
                            {room.assets.length}
                          </Badge>
                        </div>
                        <div className="space-y-1.5">
                          {Object.entries(room.categoryCounts).slice(0, 3).map(([cat, count]) => (
                            <div key={cat} className="flex items-center justify-between text-sm">
                              <span className="flex items-center gap-2 text-slate-600">
                                {getCategoryIcon(cat)} <span className="truncate max-w-[120px]">{cat}</span>
                              </span>
                              <span className="font-semibold text-slate-900">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* DIALOG CHI TIẾT PHÒNG */}
        <Dialog open={!!selectedRoom} onOpenChange={(open) => !open && setSelectedRoom(null)}>
          <DialogContent className="max-w-[95vw] md:max-w-5xl w-full max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-white">
            {selectedRoom && (
              <>
                <DialogHeader className="p-6 pb-4 border-b bg-slate-50 flex flex-row items-center justify-between sticky top-0 z-10">
                   <div>
                      <DialogTitle className="text-xl font-bold flex items-center gap-2">
                         Phòng {selectedRoom.roomName}
                      </DialogTitle>
                      <p className="text-sm text-slate-500 mt-1">
                         {selectedRoom.fullLocation} • Tổng: <span className="font-semibold">{new Intl.NumberFormat('vi-VN').format(selectedRoom.totalValue)} ₫</span>
                      </p>
                   </div>
                   <div className="flex items-center gap-2">
                      {/* NÚT IN TEM - MỚI THÊM */}
                      <Button variant="outline" onClick={handlePrint} className="gap-2 border-slate-300 text-slate-700 hover:bg-white hover:text-blue-600">
                          <Printer className="w-4 h-4" /> In tem nhãn
                      </Button>

                      <Button variant="ghost" size="icon" onClick={() => setSelectedRoom(null)} className="h-9 w-9 rounded-full hover:bg-slate-200">
                          <X className="w-5 h-5" />
                      </Button>
                    </div>
                </DialogHeader>
                <div style={{ display: "none" }}>
                    <AssetPrintTemplate 
                        ref={printComponentRef} 
                        roomName={selectedRoom.roomName} 
                        assets={selectedRoom.assets} 
                    />
                </div>
                <ScrollArea className="flex-1 p-0">
                  <table className="w-full text-sm text-left">
                     <thead className="bg-slate-50/80 backdrop-blur text-xs uppercase text-slate-500 font-semibold sticky top-0 z-10 shadow-sm">
                        <tr>
                           <th className="py-3 px-6 w-24">Mã TS</th>
                           <th className="py-3 px-4">Tên thiết bị</th>
                           <th className="py-3 px-4">Loại</th>
                           <th className="py-3 px-4 text-center">Tình trạng</th>
                           <th className="py-3 px-4 text-center">Ảnh</th>
                           <th className="py-3 px-6 text-right">Giá trị</th>
                           <th className="py-3 px-4 text-right">Thao tác</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {selectedRoom.assets.map((asset) => (
                           <tr key={asset.id} className="hover:bg-blue-50/50 group transition-colors">
                              <td className="py-3 px-6 font-mono text-xs text-slate-400 select-all">{asset.id.substring(0, 8)}</td>
                              <td className="py-3 px-4 font-medium text-slate-700">{asset.name}</td>
                              <td className="py-3 px-4 text-slate-500">{asset.category}</td>
                              <td className="py-3 px-4 text-center">
                                 <Badge variant="outline" className={cn("font-normal border-0", getStatusColor(asset.status))}>
                                    {asset.condition}%
                                 </Badge>
                              </td>
                              {/* CỘT XEM ẢNH */}
                              <td className="py-3 px-4 text-center">
                                  {asset.evidence_url ? (
                                      <Button variant="ghost" size="sm" onClick={() => setViewingAsset(asset)} className="h-8 w-8 p-0 hover:bg-blue-100 rounded-full">
                                          <ImageIcon className="w-4 h-4 text-blue-600" />
                                      </Button>
                                  ) : <span className="text-muted-foreground text-xs">-</span>}
                              </td>
                              <td className="py-3 px-6 text-right font-mono text-slate-600">
                                 {new Intl.NumberFormat('vi-VN').format(asset.value || 0)}
                              </td>
                              <td className="py-3 px-4 text-right">
                                 <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-blue-600 hover:bg-blue-50" title="Di chuyển" onClick={() => openMoveDialog(asset)}>
                                       <ArrowRightLeft className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-slate-900" onClick={() => handleEdit(asset)}>
                                       <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(asset.id, asset.name)}>
                                       <Trash2 className="w-4 h-4" />
                                    </Button>
                                 </div>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
                </ScrollArea>
                
                <div className="p-4 border-t bg-slate-50 flex justify-end">
                   <Button variant="outline" onClick={() => setSelectedRoom(null)}>Đóng</Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* DIALOG XEM ẢNH BẰNG CHỨNG */}
        <Dialog open={!!viewingAsset} onOpenChange={(o)=>!o && setViewingAsset(null)}>
            <DialogContent className="max-w-4xl w-full p-0 bg-black border-zinc-800">
                {renderEvidenceModal()}
            </DialogContent>
        </Dialog>

        {/* DIALOG DI CHUYỂN (MOVE) */}
        <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>Di chuyển tài sản</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="p-3 bg-slate-100 rounded-md text-sm text-slate-600 border border-slate-200">
                <span className="block text-xs uppercase text-slate-400 font-semibold mb-1">Tài sản</span>
                <span className="font-bold text-slate-900 text-base">{assetToMove?.name}</span>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs">Từ:</span>
                    <Badge variant="outline" className="bg-white text-slate-600 font-mono text-xs">{assetToMove?.location}</Badge>
                </div>
              </div>

              <div className="space-y-3">
                 <h4 className="text-sm font-semibold text-slate-900">Chọn vị trí mới</h4>
                 <div className="grid grid-cols-2 gap-3">
                    {/* Chọn Tòa nhà */}
                    <div>
                        <label className="text-xs text-slate-500 mb-1.5 block">Tòa nhà / Khu vực</label>
                        <select 
                            className={selectClass}
                            value={moveHall}
                            onChange={(e) => setMoveHall(e.target.value)}
                        >
                            {LECTURE_HALLS.map(hall => (
                                <option key={hall.id} value={hall.id}>{hall.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Chọn Phòng */}
                    <div>
                        <label className="text-xs text-slate-500 mb-1.5 block">Phòng / Chi tiết</label>
                        {moveHall === "OTHER" ? (
                             <Input 
                                value={moveRoom}
                                onChange={(e) => setMoveRoom(e.target.value)}
                                placeholder="Nhập vị trí..."
                                className="h-10"
                             />
                        ) : (
                             <select 
                                className={selectClass}
                                value={moveRoom}
                                onChange={(e) => setMoveRoom(e.target.value)}
                            >
                                {ROOMS_BY_HALL[moveHall]?.map(r => (
                                    <option key={r} value={r}>P. {r}</option>
                                ))}
                            </select>
                        )}
                    </div>
                 </div>
                 
                 <div className="p-2 bg-blue-50 text-blue-700 text-xs rounded border border-blue-100 flex items-center justify-center gap-2">
                    <ArrowRightLeft className="w-3 h-3" />
                    Sẽ chuyển đến: <strong>{moveHall === "OTHER" ? moveRoom : `${moveHall} - ${moveRoom}`}</strong>
                 </div>
              </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Hủy</Button>
               <Button onClick={handleMoveSubmit} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" /> Xác nhận chuyển
               </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AssetFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={loadAssets}
          assetToEdit={editingAsset}
        />
      </div>
    </AppLayout>
  )
}