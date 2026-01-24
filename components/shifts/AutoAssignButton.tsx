'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Wand2, Loader2 } from 'lucide-react'
import { AssignmentPreview } from './AssignmentPreview'
import { previewAutoAssign } from '@/lib/actions/auto-assign'
import type { OptimizationResult } from '@/lib/ai/shift-optimizer'

interface AutoAssignButtonProps {
  yearMonth: string
  locationIds?: string[]
  onAssignmentComplete?: () => void
}

interface PreviewResult extends OptimizationResult {
  warnings: string[]
  conflicts: Array<{
    date: string
    location_id: string
    duty_code_id: string
    message: string
  }>
}

export function AutoAssignButton({
  yearMonth,
  locationIds,
  onAssignmentComplete,
}: AutoAssignButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [previewResult, setPreviewResult] = useState<PreviewResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleAutoAssign = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await previewAutoAssign({
        yearMonth,
        locationIds,
        overwriteExisting: false,
      })

      setPreviewResult(result)
      setShowPreview(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : '自動割り当てに失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClosePreview = () => {
    setShowPreview(false)
    setPreviewResult(null)
  }

  const handleAssignmentComplete = () => {
    setShowPreview(false)
    setPreviewResult(null)
    onAssignmentComplete?.()
  }

  return (
    <>
      <Button
        onClick={handleAutoAssign}
        disabled={isLoading}
        variant="default"
        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            最適化中...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            AI自動割り当て
          </>
        )}
      </Button>

      {error && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {showPreview && previewResult && (
        <AssignmentPreview
          yearMonth={yearMonth}
          result={previewResult}
          onClose={handleClosePreview}
          onConfirm={handleAssignmentComplete}
        />
      )}
    </>
  )
}
