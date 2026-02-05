'use client'

import { TrendingUp, AlertTriangle, Clock } from 'lucide-react'

interface StatBarProps {
  fillRate: number
  shortageDays: number
  pendingShifts: number
}

export function StatBar({ fillRate, shortageDays, pendingShifts }: StatBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 充足率 */}
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
          fillRate >= 90
            ? 'bg-green-100 text-green-800'
            : fillRate >= 70
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        <TrendingUp className="h-4 w-4" />
        充足率 {fillRate}%
      </div>

      {/* 人手不足 */}
      <div
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${
          shortageDays === 0
            ? 'bg-green-100 text-green-800'
            : shortageDays <= 3
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        <AlertTriangle className="h-4 w-4" />
        人手不足 {shortageDays}日
      </div>

      {/* 承認待ち */}
      {pendingShifts > 0 && (
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-medium text-blue-800">
          <Clock className="h-4 w-4" />
          承認待ち {pendingShifts}件
        </div>
      )}
    </div>
  )
}
