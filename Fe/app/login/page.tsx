"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { login, loginGoogle } from "@/lib/auth-service" // Import loginGoogle
import { saveAuth } from "@/lib/auth-storage"

// --- GOOGLE IMPORTS ---
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
// import FacebookLogin from 'react-facebook-login/dist/facebook-login-render-props';

// 1. Tạo component nút Google Login riêng (vì phải dùng hook useGoogleLogin)
const GoogleLoginButton = ({ onSuccess, onError, isLoading }: any) => {
  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // TokenResponse chứa access_token
      onSuccess(tokenResponse.access_token); 
    },
    onError: () => onError("Đăng nhập Google thất bại"),
  });

  return (
    <Button 
      variant="outline" 
      type="button" 
      onClick={() => login()}
      disabled={isLoading}
      className="h-10 bg-transparent hover:bg-red-50 text-red-600 border-red-200"
    >
      <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Google
    </Button>
  );
};

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Xử lý login thường
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    try {
      const data = await login(email, password)
      saveAuth(data)
      router.push("/")
    } catch (err: any) {
      setError(err.message || "Lỗi đăng nhập.")
    } finally {
      setIsLoading(false)
    }
  }

  // Xử lý login Google thành công
  const handleGoogleSuccess = async (accessToken: string) => {
    setIsLoading(true);
    try {
      const data = await loginGoogle(accessToken);
      saveAuth(data);
      router.push("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý login Facebook thành công
  // const handleFacebookSuccess = async (response: any) => {
  //   if (response.accessToken) {
  //     setIsLoading(true);
  //     try {
  //       const data = await loginFacebook(response.accessToken);
  //       saveAuth(data);
  //       router.push("/");
  //     } catch (err: any) {
  //       setError(err.message);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };

  return (
    // 2. Wrap toàn bộ bằng GoogleOAuthProvider
    <GoogleOAuthProvider clientId="1079832745079-hs6h163e9a63m09pvi3t765idebj6j7l.apps.googleusercontent.com"> 
      <div className="min-h-screen bg-linear-to-br from-background to-muted flex items-center justify-center p-4">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10">
          <Card className="p-8 shadow-xl">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-linear-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-black">UET</span>
                </div>
                <h1 className="text-2xl font-bold text-foreground">UET Asset Manager</h1>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Chào mừng trở lại</h2>
              <p className="text-muted-foreground text-sm">
                Đăng nhập tài khoản trường để tiếp tục
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 text-destructive text-sm px-3 py-2">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input type="email" placeholder="name@vnu.edu.vn" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-11" required />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 pl-10 pr-10 border border-border rounded-lg bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-border" />
                  <span className="text-muted-foreground">Ghi nhớ đăng nhập</span>
                </label>
                <Link href="#" className="text-primary hover:underline">Quên mật khẩu?</Link>
              </div>

              <Button type="submit" disabled={isLoading} className="w-full h-11 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground font-medium flex items-center justify-center gap-2">
                {isLoading ? "Đang xử lý..." : (<>Đăng nhập <ArrowRight className="w-4 h-4" /></>)}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-sm"><span className="px-2 bg-card text-muted-foreground">hoặc tiếp tục với</span></div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* 3. Button Google đã tách component */}
              <GoogleLoginButton 
                onSuccess={handleGoogleSuccess} 
                onError={(msg: string) => setError(msg)} 
                isLoading={isLoading} 
              />

              {/* Button Facebook */}
              {/* <FacebookLogin
                appId="YOUR_FACEBOOK_APP_ID"
                autoLoad={false}
                fields="name,email,picture"
                callback={handleFacebookSuccess}
                render={(renderProps: any) => (
                  <Button variant="outline" type="button" onClick={renderProps.onClick} disabled={isLoading} className="h-10 bg-transparent hover:bg-blue-50 text-blue-600 border-blue-200">
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c6.627 0 12 5.373 12 12s-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0zm0 2c5.514 0 10 4.486 10 10s-4.486 10-10 10S2 17.514 2 12 6.486 2 12 2zm3.35 8.75h-2.13v6.541h-2.922v-6.541H8.34v-2.665h2.015V7.079c0-1.622.43-2.6 2.009-2.6.576 0 1.082.043 1.212.062v2.105h-.83c-.655 0-.775.3-.775.744v.975h1.549l-.202 2.375z" />
                    </svg>
                    Facebook
                  </Button>
                )}
              /> */}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Bạn chưa có tài khoản? <Link href="/register" className="text-primary font-medium hover:underline">Đăng ký ngay</Link>
            </p>
          </Card>
        </div>
      </div>
    </GoogleOAuthProvider>
  )
}