"use client"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Share2, ChevronLeft, Eye, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

interface DetectionItem {
  id: string
  name: string
  confidence: number
  location: string
  severity: "low" | "medium" | "high"
}

const detections: DetectionItem[] = [
  { id: "DET-001", name: "Hydraulic Leak", confidence: 98, location: "Left side cylinder", severity: "high" },
  { id: "DET-002", name: "Wear Pattern", confidence: 92, location: "Bucket teeth", severity: "medium" },
  { id: "DET-003", name: "Rust Spot", confidence: 87, location: "Cabin exterior", severity: "low" },
  { id: "DET-004", name: "Paint Damage", confidence: 84, location: "Main boom", severity: "low" },
]

export default function ScanDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("overview")

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="w-5 h-5 text-red-600" />
      case "medium":
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case "low":
        return <CheckCircle className="w-5 h-5 text-blue-600" />
    }
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/scans">
              <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Scan Results - SCN-001</h1>
              <p className="text-muted-foreground">Excavator CAT 320 • January 15, 2024</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="w-5 h-5" />
              Export
            </Button>
            <Button variant="outline" className="flex items-center gap-2 bg-transparent">
              <Share2 className="w-5 h-5" />
              Share
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Accuracy</p>
            <p className="text-3xl font-bold text-primary">96%</p>
            <p className="text-xs text-green-600 mt-2">High confidence</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Items Detected</p>
            <p className="text-3xl font-bold text-primary">15</p>
            <p className="text-xs text-accent mt-2">Components analyzed</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Issues Found</p>
            <p className="text-3xl font-bold text-orange-600">4</p>
            <p className="text-xs text-orange-600 mt-2">Requiring attention</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground mb-2">Condition Score</p>
            <p className="text-3xl font-bold text-green-600">92%</p>
            <p className="text-xs text-green-600 mt-2">Good condition</p>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-border">
          {["overview", "detections", "measurements"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "text-primary border-primary"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Scan Overview</h3>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-12 h-12 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm">
                Scan visualization and 3D model would be displayed here with interactive controls for examining detected
                components and anomalies.
              </p>
            </Card>
          </div>
        )}

        {activeTab === "detections" && (
          <div className="space-y-4">
            {detections.map((detection) => (
              <Card key={detection.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="mt-1">{getSeverityIcon(detection.severity)}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground mb-1">{detection.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{detection.location}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">Confidence:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-accent"
                              style={{ width: `${detection.confidence}%` }}
                            />
                          </div>
                          <span className="font-semibold text-primary min-w-12">{detection.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getSeverityColor(detection.severity)}`}
                  >
                    {detection.severity.charAt(0).toUpperCase() + detection.severity.slice(1)}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === "measurements" && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Measurements & Specifications</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  "Boom Length",
                  "Arm Length",
                  "Bucket Capacity",
                  "Total Height",
                  "Ground Clearance",
                  "Operating Weight",
                ].map((spec, i) => (
                  <div key={i} className="p-4 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">{spec}</p>
                    <p className="text-lg font-semibold text-foreground">{Math.floor(Math.random() * 100) + 50}m</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
