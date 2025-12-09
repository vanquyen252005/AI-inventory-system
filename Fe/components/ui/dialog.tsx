"use client"

import * as React from "react"
import { X } from "lucide-react"

// Import hàm cn để merge class nếu bạn có (tùy chọn), nếu không dùng string template cũng được
// import { cn } from "@/lib/utils" 

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

// 1. Thêm className vào Interface
interface DialogContentProps {
  children: React.ReactNode
  className?: string
}
interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"> {/* Thêm p-4 để không dính sát lề mobile */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" /* Thêm blur cho đẹp */
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 w-full flex justify-center pointer-events-none">
          {/* Wrapper để content căn giữa */}
          <div className="pointer-events-auto w-full flex justify-center">
            {children}
          </div>
      </div>
    </div>
  )
}

export function DialogContent({ children, className = "" }: DialogContentProps) {
  return (
    <div
      // 2. QUAN TRỌNG: Xóa "max-w-md" cứng ở đây đi. 
      // Để class bên ngoài (max-w-5xl) quyết định độ rộng.
      className={`bg-background border border-border rounded-lg shadow-lg p-6 w-full max-h-[90vh] overflow-y-auto ${className}`}
    >
      {children}
    </div>
  )
}

export function DialogHeader({ children, className = "" }: DialogHeaderProps) {
  return <div className={`mb-4 ${className}"`}>{children}</div>
}

// 3. SỬA LỖI TYPESCRIPT: Thêm prop className vào đây
export function DialogTitle({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return <h2 className={`text-2xl font-semibold text-foreground ${className}`}>{children}</h2>
}

export function DialogDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground mt-1">{children}</p>
}

export function DialogClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      onClick={onClose}
      className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity p-1 hover:bg-muted"
    >
      <X className="h-4 w-4" />
      <span className="sr-only">Close</span>
    </button>
  )
}

export function DialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-2 mt-6">{children}</div>
}