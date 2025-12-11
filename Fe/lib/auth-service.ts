import { getRefreshToken, saveAuth, clearAuth } from "./auth-storage"

const AUTH_API_URL = process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000"

// 1. Định nghĩa Interface chuẩn xác theo Backend
export interface AuthUser {
  id: string
  email: string
  fullName?: string
  role: string
}

export interface Tokens {
  access: {
    token: string
    expires: string
  }
  refresh: {
    token: string
    expires: string
  }
}

export interface AuthResponse {
  user: AuthUser
  tokens: Tokens
}

export interface RegisterPayload {
  email: string
  password: string
  fullName?: string
}

// ---- LOGIN ----
export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    let message = "Đăng nhập thất bại"
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {}
    throw new Error(message)
  }

  // Backend trả về { user, tokens }
  const data = (await res.json()) as AuthResponse
  return data
}

// ---- REGISTER ----
export async function register(payload: RegisterPayload): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let message = "Đăng ký thất bại"
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {}
    throw new Error(message)
  }

  const data = (await res.json()) as AuthResponse
  return data
}

// ---- REFRESH TOKEN (Quan trọng) ----
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return null

  try {
    const res = await fetch(`${AUTH_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })

    if (!res.ok) throw new Error("Refresh failed")

    const data = await res.json()
    
    // --- CẬP NHẬT MỚI: Gọi saveAuth để lưu cả Cookie & Storage ---
    saveAuth(data) 
    
    // Trả về token mới để API Client dùng ngay
    if (data.accessToken) return data.accessToken
    if (data.tokens && data.tokens.access) return data.tokens.access.token
    if (data.access && data.access.token) return data.access.token

    return null
  } catch (error) {
    console.error("Lỗi gia hạn phiên:", error)
    clearAuth()
    if (typeof window !== "undefined") window.location.href = "/login"
    return null
  }
}
export async function loginGoogle(accessToken: string): Promise<AuthResponse> {
  const res = await fetch(`${AUTH_API_URL}/auth/login/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken }),
  })

  if (!res.ok) {
    throw new Error("Đăng nhập Google thất bại")
  }

  return (await res.json()) as AuthResponse
}