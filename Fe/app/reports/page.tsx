"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
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
import { Download, Printer, RefreshCcw, DollarSign, Wrench, Package, Scan } from "lucide-react"
import { useEffect, useState } from "react"
import { getSummary, getTrends, getDistribution, type SummaryStats, type ChartData, type DistributionData } from "@/lib/report-service"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

export default function ReportsPage() {
  const [summary, setSummary] = useState<SummaryStats | null>(null)
  const [trends, setTrends] = useState<ChartData[]>([])
  const [distribution, setDistribution] = useState<DistributionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [summaryData, trendsData, distData] = await Promise.all([
        getSummary(),
        getTrends(),
        getDistribution()
      ])
      
      setSummary(summaryData)
      setTrends(trendsData)
      setDistribution(distData)
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error)
    } finally {
      setLoading(false)
    }
  }

  // Format tiền tệ VNĐ
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value)
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Báo cáo Thống kê</h1>
            <p className="text-muted-foreground mt-1">Tổng hợp số liệu tài sản và hoạt động kiểm kê AI</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> 
              Cập nhật
            </Button>
            <Button className="bg-primary hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng tài sản</p>
                <h3 className="text-2xl font-bold">{summary?.totalAssets || 0}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-green-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tổng giá trị</p>
                <h3 className="text-xl font-bold truncate max-w-[150px]" title={formatCurrency(summary?.totalValue || 0)}>
                  {summary ? (summary.totalValue / 1000000).toFixed(0) : 0} Tr
                </h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-purple-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                <Scan className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Lượt quét AI</p>
                <h3 className="text-2xl font-bold">{summary?.totalScans || 0}</h3>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-l-4 border-l-orange-500 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cần bảo trì</p>
                <h3 className="text-2xl font-bold">{summary?.maintenanceCount || 0}</h3>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Chart 1: Hoạt động quét theo tháng */}
          <Card className="p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6">Tần suất Quét AI (6 tháng qua)</h3>
            <div className="h-[300px] w-full">
              {trends.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="scans" name="Lượt quét" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Chưa có dữ liệu quét
                </div>
              )}
            </div>
          </Card>

          {/* Chart 2: Phân bố loại tài sản */}
          <Card className="p-6 shadow-sm">
            <h3 className="text-lg font-semibold mb-6">Phân bố Tài sản theo Danh mục</h3>
            <div className="h-[300px] w-full flex flex-col md:flex-row items-center">
              {distribution.length > 0 ? (
                <>
                  <div className="flex-1 h-full min-w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {distribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="w-full md:w-48 space-y-3 mt-4 md:mt-0">
                    {distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                          <span className="truncate max-w-[100px]" title={item.name}>{item.name}</span>
                        </div>
                        <span className="font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                  Chưa có dữ liệu tài sản
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}