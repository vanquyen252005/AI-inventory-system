"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { TrendingUp, Package, Zap, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { redirect } from "next/navigation"


const dashboardData = [
  { month: "Jan", assets: 40, scans: 24 },
  { month: "Feb", assets: 52, scans: 35 },
  { month: "Mar", assets: 48, scans: 42 },
  { month: "Apr", assets: 61, scans: 55 },
  { month: "May", assets: 75, scans: 68 },
  { month: "Jun", assets: 89, scans: 82 },
]

const assetDistribution = [
  { name: "Machinery", value: 35 },
  { name: "Equipment", value: 25 },
  { name: "Tools", value: 20 },
  { name: "Other", value: 20 },
]

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]

export default function Page() {
  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Monitor your asset inventory and AI scanning activities</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Assets</h3>
            <p className="text-2xl font-bold">1,234</p>
            <p className="text-xs text-accent mt-2">+12% from last month</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">AI Scans</h3>
            <p className="text-2xl font-bold">523</p>
            <p className="text-xs text-accent mt-2">+8% from last month</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Success Rate</h3>
            <p className="text-2xl font-bold">94.2%</p>
            <p className="text-xs text-accent mt-2">+2.1% from last month</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <TrendingUp className="w-4 h-4 text-accent" />
            </div>
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Alerts</h3>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-orange-600 mt-2">Needs attention</p>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Chart */}
          <Card className="lg:col-span-2 p-6">
            <h3 className="text-lg font-semibold mb-4">Assets & Scans Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dashboardData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="assets"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  dot={{ fill: "var(--chart-1)", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="scans"
                  stroke="var(--chart-2)"
                  strokeWidth={2}
                  dot={{ fill: "var(--chart-2)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Asset Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Asset Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={assetDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value">
                  {assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="flex gap-3 flex-wrap">
            <Link href="/assets">
              <Button>Browse Assets</Button>
            </Link>
            <Link href="/scans/upload">
              <Button  variant="outline">
                Upload for Scanning
             </Button>
            </Link>
            <Link  href="/reports">
              <Button variant="outline">
                View Reports
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
