'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { BarChart3, CheckCircle2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Shift } from '@/lib/actions/shifts'
import type { ShiftRequestWithStaff } from '@/lib/actions/shift-requests'

interface ShiftProgressBannerProps {
  currentMonth: Date
  shifts: Shift[]
  shiftRequests: ShiftRequestWithStaff[]
  totalRequiredSlots: number
  onReoptimize: () => void
  onConfirm: () => void
  isReoptimizing?: boolean
}

export function ShiftProgressBanner({
  currentMonth,
  shifts,
  shiftRequests,
  totalRequiredSlots,
  onReoptimize,
  onConfirm,
  isReoptimizing = false,
}: ShiftProgressBannerProps) {
  const stats = useMemo(() => {
    // 充足率: 配置済みシフト数 / 必要スロット数
    const filledCount = shifts.length
    const fulfillRate = totalRequiredSlots > 0
      ? Math.round((filledCount / totalRequiredSlots) * 100)
      : 0

    // 希望反映率: (◯配置マッチ + 休み非配置マッチ) / 全希望数
    const relevantRequests = shiftRequests.filter(
      (r) => r.request_type === '◯' || r.request_type === '休'
    )
    let matchCount = 0
    for (const req of relevantRequests) {
      const hasShift = shifts.some(
        (s) => s.staff_id === req.staff_id && s.date === req.date
      )
      if (req.request_type === '◯' && hasShift) matchCount++
      if (req.request_type === '休' && !hasShift) matchCount++
    }
    const requestRate = relevantRequests.length > 0
      ? Math.round((matchCount / relevantRequests.length) * 100)
      : 0

    // 確定済みの数
    const confirmedCount = shifts.filter((s) => s.status === '確定').length
    const pendingCount = shifts.filter((s) => s.status === '予定').length
    const hasUnconfirmed = pendingCount > 0

    return { filledCount, fulfillRate, matchCount, requestRate, relevantRequests: relevantRequests.length, confirmedCount, pendingCount, hasUnconfirmed }
  }, [shifts, shiftRequests, totalRequiredSlots])

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* 左: 月と統計 */}
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-lg font-bold">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </div>

          <div className="flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">充足率</span>
            <span className={`text-sm font-bold ${
              stats.fulfillRate >= 95 ? 'text-green-600' :
              stats.fulfillRate >= 80 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {stats.fulfillRate}%
            </span>
            <span className="text-xs text-muted-foreground">
              ({stats.filledCount}/{totalRequiredSlots})
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">希望反映率</span>
            <span className={`text-sm font-bold ${
              stats.requestRate >= 90 ? 'text-green-600' :
              stats.requestRate >= 70 ? 'text-amber-600' : 'text-red-600'
            }`}>
              {stats.requestRate}%
            </span>
            {stats.relevantRequests > 0 && (
              <span className="text-xs text-muted-foreground">
                ({stats.matchCount}/{stats.relevantRequests})
              </span>
            )}
          </div>

          {stats.confirmedCount > 0 && (
            <div className="text-xs text-muted-foreground">
              確定済み: {stats.confirmedCount}件
            </div>
          )}
        </div>

        {/* 右: ボタン */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReoptimize}
            disabled={isReoptimizing}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isReoptimizing ? 'animate-spin' : ''}`} />
            再最適化
          </Button>
          {stats.hasUnconfirmed && (
            <Button
              size="sm"
              onClick={onConfirm}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              確定する ({stats.pendingCount}件)
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
