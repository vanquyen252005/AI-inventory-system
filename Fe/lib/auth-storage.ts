// src/lib/auth-storage.ts
import type { LoginResponse } from "./auth-service"

const ACCESS_TOKEN_KEY = "accessToken"
const REFRESH_TOKEN_KEY = "refreshToken"
const CURRENT_USER_KEY = "currentUser"

export function saveAuth(data: LoginResponse) {
  if (typeof window === "undefined") return

  const { accessToken, refreshToken, user } = data

  // localStorage
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))

  // cookie (simple) – nếu bạn muốn middleware hoặc server đọc
  document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/`
  document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; path=/`
}

export function clearAuth() {
  if (typeof window === "undefined") return

  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(CURRENT_USER_KEY)

  document.cookie = `${ACCESS_TOKEN_KEY}=; Max-Age=0; path=/`
  document.cookie = `${REFRESH_TOKEN_KEY}=; Max-Age=0; path=/`
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
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
