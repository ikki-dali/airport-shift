'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  Calendar,
  Loader2,
} from 'lucide-react'
import { executeAutoAssign } from '@/lib/actions/auto-assign'
import type { OptimizationResult } from '@/lib/ai/shift-optimizer'

interface AssignmentPreviewProps {
  yearMonth: string
  result: OptimizationResult & {
    warnings: string[]
    conflicts: Array<{
      date: string
      location_id: string
      duty_code_id: string
      message: string
    }>
  }
  onClose: () => void
  onConfirm: () => void
}

export function AssignmentPreview({
  yearMonth,
  result,
  onClose,
  onConfirm,
}: AssignmentPreviewProps) {
  const [isExecuting, setIsExecuting] = useState(false)
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasErrors = !result.validation.isValid
  const hasConflicts = result.conflicts.length > 0
  const hasWarnings = result.warnings.length > 0

  const handleExecute = async () => {
    setIsExecuting(true)
    setError(null)

    try {
      await executeAutoAssign({
        yearMonth,
        overwriteExisting,
      })

      onConfirm()
    } catch (err) {
      console.error('Auto-assign execution error:', err)
      setError(err instanceof Error ? err.message : 'シフト作成に失敗しました')
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasErrors ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            )}
            AI自動割り当て プレビュー
          </DialogTitle>
          <DialogDescription>
            {yearMonth}の自動シフト割り当て結果を確認してください
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 統計サマリー */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Calendar className="h-4 w-4" />
                割り当て数
              </div>
              <div className="text-2xl font-bold">{result.stats.totalAssignments}件</div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                希望充足率
              </div>
              <div className="text-2xl font-bold">
                {result.stats.fulfillmentRate.toFixed(1)}%
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <Users className="h-4 w-4" />
                平均勤務日数
              </div>
              <div className="text-2xl font-bold">
                {result.stats.avgWorkDaysPerStaff.toFixed(1)}日
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                <TrendingUp className="h-4 w-4" />
                合計スコア
              </div>
              <div className="text-2xl font-bold">{result.totalScore}</div>
            </div>
          </div>

          <Separator />

          {/* エラー表示 */}
          {hasErrors && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <h3 className="font-semibold text-red-900">制約違反が検出されました</h3>
              </div>
              <ul className="space-y-1 text-sm text-red-800">
                {result.validation.errors.map((error, i) => (
                  <li key={i} className="ml-4">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* コンフリクト表示 */}
          {hasConflicts && (
            <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">
                  既存シフトとの競合（{result.conflicts.length}件）
                </h3>
              </div>
              <div className="max-h-32 overflow-y-auto">
                <ul className="space-y-1 text-sm text-yellow-800">
                  {result.conflicts.slice(0, 10).map((conflict, i) => (
                    <li key={i} className="ml-4">
                      • {conflict.date}: {conflict.message}
                    </li>
                  ))}
                  {result.conflicts.length > 10 && (
                    <li className="ml-4 text-yellow-700">
                      ... 他 {result.conflicts.length - 10}件
                    </li>
                  )}
                </ul>
              </div>

              <div className="mt-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={overwriteExisting}
                    onChange={(e) => setOverwriteExisting(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-700">
                    既存のシフトを上書きして実行する
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* 警告表示 */}
          {hasWarnings && (
            <div className="rounded-lg border border-blue-300 bg-blue-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-blue-900">警告</h3>
              </div>
              <ul className="space-y-1 text-sm text-blue-800">
                {result.warnings.map((warning, i) => (
                  <li key={i} className="ml-4">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 詳細情報 */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">詳細統計</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">勤務日数 標準偏差:</span>
                <span className="ml-2 font-medium">
                  {result.stats.workDaysStdDev.toFixed(2)}日
                </span>
              </div>
              <div>
                <span className="text-gray-600">処理時間:</span>
                <span className="ml-2 font-medium">
                  {(result.processingTimeMs / 1000).toFixed(2)}秒
                </span>
              </div>
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExecuting}>
            キャンセル
          </Button>
          <Button
            onClick={handleExecute}
            disabled={hasErrors || (hasConflicts && !overwriteExisting) || isExecuting}
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                実行中...
              </>
            ) : (
              <>シフトを作成</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
