'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  formatPay,
  getWarningLevelLabel,
  getWarningLevelColor,
  type WarningLevel,
} from '@/lib/payroll/calculator'
import { Filter } from 'lucide-react'

interface StaffPayrollTableProps {
  annualSummaries: any[]
  monthlyRecords: any[]
  yearMonth: string
}

export function StaffPayrollTable({
  annualSummaries,
  monthlyRecords,
  yearMonth,
}: StaffPayrollTableProps) {
  const [filterLevel, setFilterLevel] = useState<WarningLevel | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // 月次記録をマップ化
  const monthlyMap = new Map(
    monthlyRecords.map((r) => [r.staff_id, r])
  )

  // フィルタリング
  let filteredData = annualSummaries

  if (filterLevel !== 'all') {
    filteredData = filteredData.filter((s) => s.warning_level === filterLevel)
  }

  if (searchQuery) {
    filteredData = filteredData.filter(
      (s) =>
        s.staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.staff.employee_number.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  // 警告レベル順にソート（exceeded → warning → caution → safe）
  const levelOrder = { exceeded: 0, warning: 1, caution: 2, safe: 3 }
  filteredData.sort(
    (a, b) => levelOrder[a.warning_level] - levelOrder[b.warning_level]
  )

  return (
    <Card className="overflow-hidden">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-600" />
            <span className="font-medium text-sm">フィルター:</span>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">全て</option>
              <option value="exceeded">🔴 超過</option>
              <option value="warning">🟠 警告</option>
              <option value="caution">⚠️ 注意</option>
              <option value="safe">✅ 安全</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="スタッフ名・社員番号で検索"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 w-64"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left p-3 text-xs font-semibold text-gray-700 min-w-[120px]">
                スタッフ
              </th>
              <th className="text-right p-3 text-xs font-semibold text-gray-700 min-w-[100px]">
                年間累計
              </th>
              <th className="text-right p-3 text-xs font-semibold text-gray-700 min-w-[100px]">
                残額
              </th>
              <th className="text-center p-3 text-xs font-semibold text-gray-700 min-w-[100px]">
                ステータス
              </th>
              <th className="text-right p-3 text-xs font-semibold text-gray-700 min-w-[100px]">
                今月給与
              </th>
              <th className="text-right p-3 text-xs font-semibold text-gray-700 min-w-[80px]">
                今月時間
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-8 text-gray-400">
                  該当するスタッフがいません
                </td>
              </tr>
            ) : (
              filteredData.map((summary) => {
                const monthly = monthlyMap.get(summary.staff_id)
                const totalPay = summary.total_pay || 0
                const remainingAmount = summary.remaining_amount || 0
                const warningLevel = summary.warning_level as WarningLevel

                return (
                  <tr key={summary.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3">
                      <div className="font-medium text-sm">{summary.staff.name}</div>
                      <div className="text-xs text-gray-500">
                        {summary.staff.employee_number}
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium text-sm">
                      {formatPay(totalPay)}
                    </td>
                    <td className="p-3 text-right text-sm">
                      <span
                        className={
                          remainingAmount < 50000
                            ? 'text-red-600 font-medium'
                            : 'text-gray-700'
                        }
                      >
                        {formatPay(Math.max(0, remainingAmount))}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium border ${getWarningLevelColor(
                            warningLevel
                          )}`}
                        >
                          {getWarningLevelLabel(warningLevel)}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-medium text-sm">
                      {monthly ? formatPay(monthly.total_pay) : '-'}
                    </td>
                    <td className="p-3 text-right text-sm text-gray-600">
                      {monthly ? `${Number(monthly.total_hours).toFixed(1)}h` : '-'}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
        表示中: {filteredData.length}人 / 全{annualSummaries.length}人
      </div>
    </Card>
  )
}
