"use client"

import { useEffect } from "react"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CelebrationToast({ isVisible, accountName, onClose }) {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-2 duration-300">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="p-1 rounded-full bg-success-100">
            <CheckCircle className="w-5 h-5 text-success-600" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-sm">🎉 Account Connected!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {accountName} has been successfully connected to your dashboard.
            </p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="outline" className="text-xs h-7 bg-transparent">
            View Posts
          </Button>
          <Button size="sm" variant="outline" className="text-xs h-7 bg-transparent">
            Schedule Post
          </Button>
        </div>
      </div>
    </div>
  )
}
