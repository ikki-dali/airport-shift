'use client'

import { TrendingUp, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface StatBarProps {
  fillRate: number
  shortageDays: number
}

export function StatBar({ fillRate, shortageDays }: StatBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* 充足率 */}
      <Badge
        variant={fillRate >= 100 ? 'accent' : fillRate >= 90 ? 'success' : fillRate >= 70 ? 'warning' : 'destructive'}
        className="gap-2 px-4 py-2 text-sm"
      >
        <TrendingUp className="h-4 w-4" />
        充足率 {fillRate}%
      </Badge>

      {/* 人手不足 */}
      <Badge
        variant={shortageDays === 0 ? 'success' : shortageDays <= 3 ? 'warning' : 'destructive'}
        className="gap-2 px-4 py-2 text-sm"
      >
        <AlertTriangle className="h-4 w-4" />
        人手不足 {shortageDays}日
      </Badge>
    </div>
  )
}
