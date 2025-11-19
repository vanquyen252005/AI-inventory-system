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

const AUTH_API_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL || "http://localhost:4000"

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
      // ignore parse error
    }
    throw new Error(message)
  }

  const data = (await res.json()) as LoginResponse
  return data
}

// Optional nếu sau này cần gọi /auth/register, /auth/me, /auth/refresh...
// export async function register(...) {}
// export async function getMe(...) {}
