import { getAccessToken, clearAuth } from "./auth-storage"
import { refreshAccessToken } from "./auth-service"

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

export async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  let token = getAccessToken()

  // 1. Gắn Access Token vào Header
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // 2. Gọi API lần đầu
  let response = await fetch(url, { ...options, headers })

  // 3. Nếu lỗi 401 (Hết hạn) -> Thử Refresh Token
  if (response.status === 401) {
    console.log("Token hết hạn. Đang thử gia hạn...")
    
    // Gọi hàm refresh đã viết ở Bước 1
    const newToken = await refreshAccessToken()
    
    if (newToken) {
      // Refresh thành công -> Gọi lại API ban đầu với token mới
      headers.Authorization = `Bearer ${newToken}`
      response = await fetch(url, { ...options, headers })
    } else {
      // Refresh thất bại -> Logout và chuyển về Login
      clearAuth()
      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }
      throw new Error("Phiên đăng nhập đã hết hạn")
    }
  }

  // 4. Xử lý các lỗi khác
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Lỗi API: ${response.status}`)
  }

  return response.json()
}