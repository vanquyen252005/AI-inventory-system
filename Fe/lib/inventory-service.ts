// lib/inventory-service.ts
import { getAccessToken } from "./auth-storage"

export interface Asset {
  id: string
  name: string
  category: string
  location: string
  status: "active" | "maintenance" | "inactive"
  value: number
  lastScanned?: string
  condition: number
  description?: string
}

export interface CreateAssetPayload {
  name: string
  category: string
  location: string
  status?: "active" | "maintenance" | "inactive"
  value: number
  condition?: number
  description?: string
}

export interface AssetsResponse {
  assets: Asset[]
  total: number
  page: number
  limit: number
}

const INVENTORY_API_URL =
  process.env.NEXT_PUBLIC_INVENTORY_API_URL || "http://localhost:4001"

// Get auth token from storage
function getAuthToken(): string | null {
  return getAccessToken()
}

// Helper to make authenticated requests
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getAuthToken()
  
  if (!token) {
    throw new Error("No authentication token found. Please login first.")
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...options.headers,
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  if (!res.ok) {
    let message = "Request failed"
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      // ignore
    }
    
    // If unauthorized, might be token issue
    if (res.status === 401) {
      console.error("Authentication failed. Token:", token.substring(0, 20) + "...")
    }
    
    throw new Error(message)
  }

  return res.json()
}

// ---- ASSETS ----
export async function getAssets(params?: {
  search?: string
  category?: string
  status?: string
  page?: number
  limit?: number
}): Promise<AssetsResponse> {
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.append("search", params.search)
  if (params?.category) queryParams.append("category", params.category)
  if (params?.status) queryParams.append("status", params.status)
  if (params?.page) queryParams.append("page", params.page.toString())
  if (params?.limit) queryParams.append("limit", params.limit.toString())

  const url = `${INVENTORY_API_URL}/assets?${queryParams.toString()}`
  return fetchWithAuth(url)
}

export async function getAssetById(id: string): Promise<Asset> {
  return fetchWithAuth(`${INVENTORY_API_URL}/assets/${id}`)
}

export async function createAsset(payload: CreateAssetPayload): Promise<Asset> {
  return fetchWithAuth(`${INVENTORY_API_URL}/assets`, {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateAsset(
  id: string,
  payload: Partial<CreateAssetPayload>
): Promise<Asset> {
  return fetchWithAuth(`${INVENTORY_API_URL}/assets/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteAsset(id: string): Promise<void> {
  await fetchWithAuth(`${INVENTORY_API_URL}/assets/${id}`, {
    method: "DELETE",
  })
}

