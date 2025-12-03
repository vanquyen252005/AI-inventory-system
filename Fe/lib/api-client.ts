import { getAccessToken, clearAuth } from "./auth-storage"
import { refreshAccessToken } from "./auth-service"

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>
}

// Biến "khóa" để ngăn gọi refresh nhiều lần
let isRefreshing = false
let refreshPromise: Promise<string | null> | null = null

export async function fetchWithAuth(url: string, options: FetchOptions = {}) {
  let token = getAccessToken()

  const headers: Record<string, string> = {
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  // Tự động set JSON nếu không phải FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json"
  }

  let response = await fetch(url, { ...options, headers })

  // --- XỬ LÝ KHI TOKEN HẾT HẠN (401) ---
  if (response.status === 401) {
    if (!isRefreshing) {
      // Nếu chưa có ai đang refresh, thì mình làm
      isRefreshing = true
      refreshPromise = refreshAccessToken()
        .then((newToken) => {
          isRefreshing = false
          return newToken
        })
        .catch(() => {
          isRefreshing = false
          return null
        })
    }

    // Tất cả các request 401 đều phải đợi cái Promise này
    const newToken = await refreshPromise

    if (newToken) {
      // Có token mới -> Gọi lại API cũ
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

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `Lỗi API: ${response.status}`)
  }

  return response.json()
}