import React from "react";
import { Asset } from "@/lib/inventory-service"; // Đảm bảo import đúng type Asset

interface AssetPrintTemplateProps {
  roomName: string;
  assets: Asset[];
}

// Dùng forwardRef để thư viện in có thể tham chiếu tới component này
export const AssetPrintTemplate = React.forwardRef<HTMLDivElement, AssetPrintTemplateProps>(
  ({ roomName, assets }, ref) => {
    return (
      <div ref={ref} className="p-8 bg-white text-black print-container">
        {/* Header khi in (chỉ hiện trang đầu) */}
        <div className="mb-6 text-center border-b-2 border-black pb-2">
          <h1 className="text-2xl font-bold uppercase">Danh sách tài sản - Phòng {roomName}</h1>
          <p className="text-sm">Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
        </div>

        {/* Lưới tem nhãn: Grid 2 cột hoặc 3 cột tùy khổ giấy */}
        <div className="grid grid-cols-2 gap-4">
          {assets.map((asset, index) => (
            <div 
              key={asset.id} 
              className="border-2 border-black p-4 rounded-lg flex flex-col justify-between h-[180px] relative page-break-inside-avoid"
            >
              {/* Logo/Header tem */}
              <div className="flex justify-between items-start border-b border-gray-400 pb-2 mb-2">
                <span className="font-bold text-lg">UET ASSET</span>
                <span className="text-xs font-mono bg-black text-white px-1 py-0.5 rounded">
                    {asset.id.substring(0, 8).toUpperCase()}
                </span>
              </div>

              {/* Nội dung chính */}
              <div className="flex-1 space-y-1">
                <h3 className="font-bold text-xl line-clamp-2 leading-tight">{asset.name}</h3>
                <p className="text-sm"><span className="font-semibold">Loại:</span> {asset.category}</p>
                <p className="text-sm"><span className="font-semibold">Vị trí:</span> {asset.location}</p>
                <p className="text-sm"><span className="font-semibold">Tình trạng:</span> {asset.condition}%</p>
              </div>
            </div>
          ))}
        </div>

        {/* CSS ẩn khi in để tránh nhảy trang linh tinh */}
        <style jsx global>{`
          @media print {
            @page {
              size: A4;
              margin: 20mm;
            }
            .page-break-inside-avoid {
              break-inside: avoid;
            }
          }
        `}</style>
      </div>
    );
  }
);

AssetPrintTemplate.displayName = "AssetPrintTemplate";