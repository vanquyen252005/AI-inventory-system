import { fetchWithAuth } from "./api-client" // Import wrapper

// Removed: import { getAccessToken } from "./auth-storage" 
// Removed: getAuthToken() helper
// Removed: fetchWithAuth() helper (the internal one)

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
  
  // Use new wrapper
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

export async function updateAsset(id: string, payload: any) {
  return fetchWithAuth(`${INVENTORY_API_URL}/assets/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  })
}

export async function deleteAsset(id: string) {
  return fetchWithAuth(`${INVENTORY_API_URL}/assets/${id}`, {
    method: "DELETE",
  })
}
export async function createBulkAssets(assets: CreateAssetPayload[]) {
  return fetchWithAuth(`${INVENTORY_API_URL}/assets/bulk`, {
    method: "POST",
    body: JSON.stringify({ assets }),
  })
}