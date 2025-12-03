import { fetchWithAuth } from "./api-client"

const INVENTORY_API_URL = process.env.NEXT_PUBLIC_INVENTORY_API_URL || "http://localhost:4001"

export interface DetectionItem {
  class: string
  confidence: number
  box: number[]
  id?: string
}

export interface ScanResult {
  id: string
  scan_code: string
  image_url: string
  scanned_at: string
  status: "processing" | "completed" | "failed"
  device_cnt: number
  location?: string
  result_data?: DetectionItem[]
}

export async function getScans(): Promise<ScanResult[]> {
  return fetchWithAuth(`${INVENTORY_API_URL}/scans`)
}

export async function getScanById(id: string): Promise<ScanResult> {
  return fetchWithAuth(`${INVENTORY_API_URL}/scans/${id}`)
}

// Đã cập nhật: Sử dụng fetchWithAuth để hưởng cơ chế Refresh Token
export async function uploadScan(file: File, location: string): Promise<ScanResult> {
  const formData = new FormData()
  formData.append("file", file)
  formData.append("location", location)

  // Không cần set Header thủ công nữa, api-client tự lo
  return fetchWithAuth(`${INVENTORY_API_URL}/scans/upload`, {
    method: "POST",
    body: formData,
  })
}

export async function updateScanResult(id: string, data: { status: string, result_data: any[] }) {
  return fetchWithAuth(`${INVENTORY_API_URL}/scans/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}