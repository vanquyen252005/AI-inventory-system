"use client"

import type React from "react"

import { AppLayout } from "@/components/layout/app-layout"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, FileVideo, AlertCircle, CheckCircle2, X } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadComplete, setUploadComplete] = useState(false)
  const [assetId, setAssetId] = useState("")

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setSelectedFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !assetId) return

    setIsUploading(true)
    setUploadProgress(0)

    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      setUploadProgress(i)
    }

    setIsUploading(false)
    setUploadComplete(true)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i]
  }

  return (
    <AppLayout>
      <div className="p-8 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Upload Video for Scanning</h1>
          <p className="text-muted-foreground">Upload a video of your asset for AI-powered analysis</p>
        </div>

        <div className="space-y-6">
          {!uploadComplete ? (
            <>
              {/* Asset Selection */}
              <Card className="p-6">
                <label className="block text-sm font-semibold text-foreground mb-3">Select Asset</label>
                <Input
                  type="text"
                  placeholder="Search or select an asset ID"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-muted-foreground mt-2">Enter an asset ID (e.g., AST-001)</p>
              </Card>

              {/* File Upload */}
              <Card className="p-6">
                <label className="block text-sm font-semibold text-foreground mb-4">Upload Video</label>

                {!selectedFile ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                      isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Upload
                      className={`w-12 h-12 mx-auto mb-4 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <h3 className="font-semibold text-foreground mb-1">Drag and drop your video here</h3>
                    <p className="text-sm text-muted-foreground mb-4">or</p>
                    <label className="inline-block">
                      <Button>Browse Files</Button>
                      <input type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
                    </label>
                    <p className="text-xs text-muted-foreground mt-4">Supported formats: MP4, MOV, AVI (Max 500MB)</p>
                  </div>
                ) : (
                  <div className="border border-border rounded-lg p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileVideo className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{selectedFile.name}</h4>
                          <p className="text-sm text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedFile(null)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {!isUploading && (
                      <Button
                        onClick={() => {
                          const input = document.createElement("input")
                          input.type = "file"
                          input.accept = "video/*"
                          input.onchange = (e: any) => {
                            if (e.target.files?.length) {
                              setSelectedFile(e.target.files[0])
                            }
                          }
                          input.click()
                        }}
                        variant="outline"
                        className="mt-4"
                      >
                        Change File
                      </Button>
                    )}
                  </div>
                )}
              </Card>

              {/* Upload Button */}
              {selectedFile && (
                <div className="space-y-4">
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Uploading...</span>
                        <span className="font-semibold text-primary">{uploadProgress}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleUpload}
                    disabled={isUploading || !assetId}
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                  >
                    {isUploading ? "Uploading..." : "Start Analysis"}
                  </Button>
                </div>
              )}

              {/* Info Box */}
              <Card className="p-6 bg-accent/5 border-accent/20">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">Processing Information</h4>
                    <p className="text-sm text-muted-foreground">
                      Our AI will analyze the video for object detection, condition assessment, and component
                      identification. Processing typically takes 2-5 minutes.
                    </p>
                  </div>
                </div>
              </Card>
            </>
          ) : (
            <Card className="p-12 text-center">
              <div className="inline-block">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Upload Successful!</h2>
              <p className="text-muted-foreground mb-6">
                Your video has been uploaded and is now being processed. You'll receive a notification when the analysis
                is complete.
              </p>
              <div className="space-y-3 mb-6 text-left max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asset:</span>
                  <span className="font-semibold text-foreground">{assetId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">File:</span>
                  <span className="font-semibold text-foreground">{selectedFile?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold text-primary">Processing</span>
                </div>
              </div>
              <div className="flex gap-3 justify-center">
                <Link href="/scans">
                  <Button className="bg-primary hover:bg-primary/90">Xem danh sách quét</Button>
                </Link>
                <Link  href="/scans/upload">
                  <Button
                  variant="outline"
                  onClick={() => {
                    setUploadComplete(false)
                    setSelectedFile(null)
                    setAssetId("")
                  }}
                >
                  Upload Another
                </Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
