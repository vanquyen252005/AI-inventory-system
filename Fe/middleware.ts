import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Kiểm tra nếu user có auth token (lưu trong cookie)
  const isAuthenticated = request.cookies.get("auth-token")?.value

  const { pathname } = request.nextUrl

  // Nếu chưa login và cố gắng vào protected routes, redirect về login
  if (!isAuthenticated && pathname !== "/login") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Nếu đã login và vào /login, redirect về dashboard
  if (isAuthenticated && pathname === "/login") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
