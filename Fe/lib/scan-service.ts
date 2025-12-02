import { fetchWithAuth } from "./api-client"
import { getAccessToken } from "./auth-storage" // Still needed for raw fetch in upload

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

// NOTE: Upload is special because it uses FormData, not JSON.
// We keep manual fetch but can wrap token logic if desired.
// For simplicity, we keep manual fetch here but make sure it handles errors.
export async function uploadScan(file: File, location: string): Promise<ScanResult> {
  // We grab token manually here because fetchWithAuth defaults to Content-Type: application/json
  const token = getAccessToken()
  
  const formData = new FormData()
  formData.append("file", file)
  formData.append("location", location)

  const res = await fetch(`${INVENTORY_API_URL}/scans/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type, let browser set multipart/form-data boundary
    },
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || "Upload failed")
  }

  return res.json()
}

export async function updateScanResult(id: string, data: { status: string, result_data: any[] }) {
  return fetchWithAuth(`${INVENTORY_API_URL}/scans/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}