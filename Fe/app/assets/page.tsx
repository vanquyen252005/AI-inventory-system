"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Filter, Download, Edit2, Trash2, Eye } from "lucide-react"
import { useState } from "react"

interface Asset {
  id: string
  name: string
  category: string
  location: string
  status: "active" | "maintenance" | "inactive"
  value: number
  lastScanned?: string
  condition: number
}

const assetsList: Asset[] = [
  {
    id: "AST-001",
    name: "Excavator CAT 320",
    category: "Machinery",
    location: "Site A",
    status: "active",
    value: 125000,
    lastScanned: "2024-01-15",
    condition: 92,
  },
  {
    id: "AST-002",
    name: "Hydraulic Pump",
    category: "Equipment",
    location: "Warehouse B",
    status: "active",
    value: 45000,
    lastScanned: "2024-01-10",
    condition: 78,
  },
  {
    id: "AST-003",
    name: "Welding Machine",
    category: "Equipment",
    location: "Workshop C",
    status: "maintenance",
    value: 32000,
    lastScanned: "2024-01-05",
    condition: 65,
  },
  {
    id: "AST-004",
    name: "Power Generator",
    category: "Equipment",
    location: "Storage D",
    status: "inactive",
    value: 28000,
    lastScanned: "2023-12-20",
    condition: 45,
  },
  {
    id: "AST-005",
    name: "Toolset Pro",
    category: "Tools",
    location: "Workshop C",
    status: "active",
    value: 8500,
    lastScanned: "2024-01-12",
    condition: 88,
  },
]

export default function AssetsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [assets, setAssets] = useState(assetsList)

  const getStatusColor = (status: Asset["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "inactive":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  const getConditionColor = (condition: number) => {
    if (condition >= 80) return "text-green-600"
    if (condition >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Asset Inventory</h1>
            <p className="text-muted-foreground">Manage and track all your assets</p>
          </div>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Asset
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search assets by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Filter className="w-5 h-5" />
              Filter
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="w-5 h-5" />
              Export
            </Button>
          </div>
        </Card>

        {/* Assets Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Asset ID</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Location</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Condition</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Value</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssets.map((asset) => (
                  <tr key={asset.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-primary">{asset.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">{asset.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{asset.category}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{asset.location}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                        {asset.status.charAt(0).toUpperCase() + asset.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-accent"
                            style={{ width: `${asset.condition}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${getConditionColor(asset.condition)}`}>
                          {asset.condition}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-foreground">${asset.value.toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <button className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredAssets.length} of {assets.length} assets
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  )
}
