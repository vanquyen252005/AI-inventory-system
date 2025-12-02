// src/lib/auth-storage.ts

const ACCESS_TOKEN_KEY = "accessToken"
const REFRESH_TOKEN_KEY = "refreshToken"
const CURRENT_USER_KEY = "currentUser"

export function saveAuth(data: any) {
  if (typeof window === "undefined") return

  // 1. Debug: Xem chính xác data nhận được là gì
  console.log("📥 saveAuth received:", data)

  let accessToken = ""
  let refreshToken = ""
  let user = null

  // TRƯỜNG HỢP 1: Backend trả về phẳng (Như log bạn gửi)
  if (data.accessToken) {
    accessToken = data.accessToken
    refreshToken = data.refreshToken
    user = data.user
  }
  // TRƯỜNG HỢP 2: Backend trả về lồng nhau (Code cũ/Chuẩn REST)
  else if (data.tokens && data.tokens.access) {
    accessToken = data.tokens.access.token
    refreshToken = data.tokens.refresh ? data.tokens.refresh.token : ""
    user = data.user
  }
  
  // 2. Lưu vào Storage & Cookie
  if (accessToken) {
    // Lưu LocalStorage (cho API Client gọi)
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
    if (user) localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))

    // Lưu Cookie (cho Middleware chặn route)
    // Lưu ý: path=/ để toàn bộ trang web đọc được
    document.cookie = `auth-token=${accessToken}; path=/; max-age=86400; SameSite=Lax` 
    document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; path=/; max-age=604800; SameSite=Lax`
    
    console.log("✅ Đã lưu Cookie auth-token:", accessToken.substring(0, 10) + "...")
  } else {
    console.error("❌ Không tìm thấy accessToken trong phản hồi!")
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return

  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)

  // Xóa cookie phải đúng path
  document.cookie = `auth-token=; Max-Age=0; path=/`
  document.cookie = `${REFRESH_TOKEN_KEY}=; Max-Age=0; path=/`
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getCurrentUser() {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(CURRENT_USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}