// src/lib/auth-service.ts

export interface AuthUser {
  id: string
  email: string
  fullName?: string
  role: string
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export interface RegisterPayload {
  email: string
  password: string
  fullName?: string
}

export interface RegisterResponse {
  id: string
  email: string
  fullName?: string
  role: string
  createdAt: string
}

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000"

// ---- LOGIN ----
export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${AUTH_API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    let message = "Login failed. Please check your credentials."
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const data = (await res.json()) as LoginResponse
  return data
}

// ---- REGISTER ----
export async function register(payload: RegisterPayload): Promise<RegisterResponse> {
  const res = await fetch(`${AUTH_API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let message = "Register failed. Please try again."
    try {
      const data = await res.json()
      if (data?.message) message = data.message
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const data = (await res.json()) as RegisterResponse
  return data
}
