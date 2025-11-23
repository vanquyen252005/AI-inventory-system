"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createAsset, type CreateAssetPayload } from "@/lib/inventory-service"

interface AssetFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AssetFormDialog({ open, onOpenChange, onSuccess }: AssetFormDialogProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<CreateAssetPayload>({
    name: "",
    category: "",
    location: "",
    status: "active",
    value: 0,
    condition: 100,
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await createAsset(formData)
      onSuccess()
      onOpenChange(false)
      // Reset form
      setFormData({
        name: "",
        category: "",
        location: "",
        status: "active",
        value: 0,
        condition: 100,
        description: "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create asset")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogClose onClose={() => onOpenChange(false)} />
        <DialogHeader>
          <DialogTitle>Add New Asset</DialogTitle>
          <DialogDescription>Enter the details for the new asset</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Excavator CAT 320"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              placeholder="e.g., Machinery, Equipment, Tools"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Location <span className="text-red-500">*</span>
            </label>
            <Input
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Site A, Warehouse B"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as "active" | "maintenance" | "inactive",
                  })
                }
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-foreground text-sm"
              >
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Condition (%)
              </label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.condition}
                onChange={(e) =>
                  setFormData({ ...formData, condition: parseInt(e.target.value) || 100 })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Value ($) <span className="text-red-500">*</span>
            </label>
            <Input
              required
              type="number"
              min="0"
              step="0.01"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
              }
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description..."
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm resize-none"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90">
              {loading ? "Creating..." : "Create Asset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

