"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, Eye, Download, Trash2, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

interface Scan {
  id: string
  assetName: string
  uploadedAt: string
  status: "processing" | "completed" | "failed"
  accuracy: number
  detectedItems: number
  fileName: string
}

const scansList: Scan[] = [
  {
    id: "SCN-001",
    assetName: "Excavator CAT 320",
    uploadedAt: "2024-01-15 10:30",
    status: "completed",
    accuracy: 96,
    detectedItems: 15,
    fileName: "excavator_scan_001.mp4",
  },
  {
    id: "SCN-002",
    assetName: "Hydraulic Pump",
    uploadedAt: "2024-01-14 14:22",
    status: "completed",
    accuracy: 89,
    detectedItems: 8,
    fileName: "pump_inspection.mp4",
  },
  {
    id: "SCN-003",
    assetName: "Welding Machine",
    uploadedAt: "2024-01-14 09:15",
    status: "processing",
    accuracy: 0,
    detectedItems: 0,
    fileName: "welding_machine_scan.mp4",
  },
  {
    id: "SCN-004",
    assetName: "Power Generator",
    uploadedAt: "2024-01-13 16:45",
    status: "completed",
    accuracy: 92,
    detectedItems: 12,
    fileName: "generator_scan.mp4",
  },
  {
    id: "SCN-005",
    assetName: "Toolset Pro",
    uploadedAt: "2024-01-13 11:30",
    status: "failed",
    accuracy: 0,
    detectedItems: 0,
    fileName: "toolset_scan.mp4",
  },
]

export default function ScansPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [scans, setScans] = useState(scansList)

  const getStatusColor = (status: Scan["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600"
      case "processing":
        return "text-blue-600"
      case "failed":
        return "text-red-600"
    }
  }

  const getStatusBg = (status: Scan["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-50 dark:bg-green-900/20"
      case "processing":
        return "bg-blue-50 dark:bg-blue-900/20"
      case "failed":
        return "bg-red-50 dark:bg-red-900/20"
    }
  }

  const getStatusIcon = (status: Scan["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case "processing":
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-600" />
    }
  }

  const filteredScans = scans.filter(
    (scan) =>
      scan.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scan.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <AppLayout>
      <div className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">AI Scans</h1>
            <p className="text-muted-foreground">View and manage all asset scans</p>
          </div>
          <Link href="/scans/upload">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Scan
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card className="p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search scans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </Card>

        {/* Scans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScans.map((scan) => (
            <Card key={scan.id} className={`overflow-hidden ${getStatusBg(scan.status)}`}>
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground text-lg mb-1">{scan.assetName}</h3>
                    <p className="text-xs text-muted-foreground">{scan.id}</p>
                  </div>
                  {getStatusIcon(scan.status)}
                </div>

                {/* Details */}
                <div className="space-y-3 mb-4 pb-4 border-b border-border">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">File:</span>
                    <span className="font-medium text-foreground text-right truncate">{scan.fileName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uploaded:</span>
                    <span className="font-medium text-foreground">{scan.uploadedAt}</span>
                  </div>

                  {scan.status === "completed" && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy:</span>
                        <span className="font-medium text-green-600">{scan.accuracy}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Detected Items:</span>
                        <span className="font-medium text-primary">{scan.detectedItems}</span>
                      </div>
                    </>
                  )}

                  {scan.status === "processing" && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Processing...</span>
                        <span className="text-xs text-blue-600 font-medium">75%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full w-3/4 bg-gradient-to-r from-blue-500 to-blue-600 animate-pulse" />
                      </div>
                    </div>
                  )}

                  {scan.status === "failed" && (
                    <p className="text-sm text-red-600">Processing failed - Please try again</p>
                  )}
                </div>

                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${getStatusColor(scan.status)} bg-current/10`}
                  >
                    {scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}
                  </span>
                  <div className="flex gap-2">
                    {scan.status === "completed" && (
                      <>
                        <Link href={`/scans/${scan.id}`}>
                          <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {filteredScans.length === 0 && (
          <Card className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No scans found</h3>
            <p className="text-muted-foreground mb-4">Try a different search or create a new scan</p>
            <Link href="/scans/upload">
              <Button className="bg-primary hover:bg-primary/90">Start Scanning</Button>
            </Link>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
