import { getAccessToken, clearAuth } from "./auth-storage"
import { refreshAccessToken } from "./auth-service"

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

export async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  let token = getAccessToken()

  // 1. Chuẩn bị Header
  const headers: Record<string, string> = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // LOGIC MỚI: Chỉ thêm Content-Type: application/json nếu KHÔNG PHẢI là FormData
  // Nếu là FormData, để trình duyệt tự set (để có boundary)
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  // 2. Gọi API lần đầu
  let response = await fetch(url, { ...options, headers })

  // 3. Nếu lỗi 401 (Hết hạn) -> Thử Refresh Token
  if (response.status === 401) {
    console.log("Token hết hạn khi gọi API. Đang thử gia hạn...")
    
    const newToken = await refreshAccessToken()
    
    if (newToken) {
      // Refresh thành công -> Gọi lại API với token mới
      headers.Authorization = `Bearer ${newToken}`
      response = await fetch(url, { ...options, headers })
    } else {
      // Refresh thất bại -> Logout
      clearAuth()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new Error("Phiên đăng nhập đã hết hạn")
    }
  }

  // 4. Xử lý lỗi chung
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Lỗi API: ${response.status}`)
  }

  return response.json()
}