"use client"

import type React from "react"
import { logout } from "@/app/actions"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, Package, Video, FileText, LogOut, Menu, X } from "lucide-react"
import { useState } from "react"

interface NavItem {
  name: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { name: "Dashboard", href: "/", icon: <BarChart3 className="w-5 h-5" /> },
  { name: "Assets", href: "/assets", icon: <Package className="w-5 h-5" /> },
  { name: "AI Scans", href: "/scans", icon: <Video className="w-5 h-5" /> },
  { name: "Reports", href: "/reports", icon: <FileText className="w-5 h-5" /> },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(true)

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "block" : "hidden"} md:block fixed md:relative w-64 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all`}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-sidebar-primary flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-sidebar-primary to-sidebar-accent rounded-lg flex items-center justify-center">
                <span className="text-sidebar-primary-foreground text-sm font-black">AI</span>
              </div>
              AssetAI
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/20"
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 w-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="md:hidden">
            {sidebarOpen ? <X /> : <Menu />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">Welcome back</div>
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full" />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">{children}</main>
      </div>
    </div>
  )
}
