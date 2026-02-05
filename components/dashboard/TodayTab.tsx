'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Users, AlertTriangle } from 'lucide-react'

// デモ用の1日あたり必要人数
const DAILY_REQUIRED_STAFF = 43

// 配置箇所ごとの色設定（Excelシフト表風）
const LOCATION_COLORS: Record<string, { rowBg: string; headerBg: string; headerText: string }> = {
  '第1ターミナル': { rowBg: 'bg-blue-50', headerBg: 'bg-blue-600', headerText: 'text-white' },
  '第2ターミナル': { rowBg: 'bg-green-50', headerBg: 'bg-green-600', headerText: 'text-white' },
  '第3ターミナル北': { rowBg: 'bg-purple-50', headerBg: 'bg-purple-600', headerText: 'text-white' },
  '第3ターミナル南': { rowBg: 'bg-amber-50', headerBg: 'bg-amber-600', headerText: 'text-white' },
  'バスゲート': { rowBg: 'bg-rose-50', headerBg: 'bg-rose-600', headerText: 'text-white' },
}

const DEFAULT_COLOR = { rowBg: 'bg-gray-50', headerBg: 'bg-gray-600', headerText: 'text-white' }

interface Shift {
  id: string
  date: string
  status: string
  staff: {
    id: string
    name: string
    employee_number: string
  }
  location: {
    id: string
    location_name: string
  }
  duty_code: {
    id: string
    code: string
    start_time: string
    end_time: string
  }
}

interface LocationRequirement {
  id: string
  location_id: string
  duty_code_id: string
  required_staff_count: number
  day_of_week: number | null
  specific_date: string | null
}

interface TodayTabProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
}

export function TodayTab({ shifts, locationRequirements }: TodayTabProps) {
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const dayOfWeek = today.getDay()

  // 今日のシフトをフィルタ
  const todayShifts = shifts.filter((s) => s.date === todayStr)

  // 今日の必要人数を計算
  const todayRequired = locationRequirements.reduce((sum, req) => {
    if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) return sum
    if (req.specific_date !== null && req.specific_date !== todayStr) return sum
    return sum + req.required_staff_count
  }, 0)

  // 実際の必要人数（設定がなければデフォルト値）
  const requiredStaff = todayRequired > 0 ? todayRequired : DAILY_REQUIRED_STAFF

  // 今日の確定シフト数を計算
  const confirmedCount = todayShifts.filter((s) => s.status === '確定').length
  const pendingCount = todayShifts.length - confirmedCount
  const totalAssigned = todayShifts.length
  const shortage = requiredStaff - totalAssigned
  const isShortageDay = shortage > 0

  // 配置箇所ごとにグルーピング
  const byLocation: Record<string, Shift[]> = {}
  todayShifts.forEach((shift) => {
    const key = shift.location.location_name
    if (!byLocation[key]) byLocation[key] = []
    byLocation[key].push(shift)
  })

  // 配置箇所をソート（人数多い順）
  const locationEntries = Object.entries(byLocation).sort((a, b) => b[1].length - a[1].length)

  if (todayShifts.length === 0) {
    return (
      <Card className="p-6 text-center text-gray-500">
        今日のシフトデータがありません
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {/* サマリーバー */}
      <div className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2">
        <span className="text-sm text-gray-600">
          {format(today, 'M月d日(E)', { locale: ja })}
        </span>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-sm font-medium ${
            isShortageDay ? 'text-red-600' : 'text-green-600'
          }`}>
            <Users className="h-4 w-4" />
            <span>{totalAssigned}/{requiredStaff}人</span>
            {isShortageDay && (
              <span className="text-xs">(-{shortage})</span>
            )}
          </div>
          <div className="flex gap-2 text-xs">
            <span className="text-green-600">確定 {confirmedCount}</span>
            <span className="text-yellow-600">仮 {pendingCount}</span>
          </div>
        </div>
      </div>

      {/* 人手不足警告（ある場合のみ） */}
      {isShortageDay && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          <span>{shortage}人不足しています</span>
        </div>
      )}

      {/* Excelシフト表風テーブル */}
      <Card className="overflow-hidden border">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-2 py-1.5 text-center text-xs font-semibold text-gray-600 w-8">No</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-semibold text-gray-600 w-24">配置</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-semibold text-gray-600">氏名</th>
              <th className="border border-gray-300 px-2 py-1.5 text-left text-xs font-semibold text-gray-600 w-40">勤務時間 / 記号</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let globalIndex = 0
              return locationEntries.map(([location, locationShifts]) => {
                const colors = LOCATION_COLORS[location] || DEFAULT_COLOR
                const sortedShifts = [...locationShifts].sort((a, b) =>
                  a.duty_code.start_time.localeCompare(b.duty_code.start_time)
                )

                return sortedShifts.map((shift, idx) => {
                  globalIndex++
                  const startTime = shift.duty_code.start_time.slice(0, 5)
                  const endTime = shift.duty_code.end_time.slice(0, 5)
                  const isPending = shift.status !== '確定'

                  return (
                    <tr key={shift.id} className={isPending ? 'bg-yellow-100' : ''}>
                      {/* No（連番） */}
                      <td className="border border-gray-300 px-2 py-1 text-center text-xs text-gray-500">
                        {globalIndex}
                      </td>
                      {/* 配置箇所（グループの最初だけ表示、色付きヘッダー） */}
                      {idx === 0 ? (
                        <td
                          className={`border border-gray-300 px-2 py-1 text-xs font-semibold ${colors.headerBg} ${colors.headerText}`}
                          rowSpan={locationShifts.length}
                        >
                          {location}
                          <div className="font-normal opacity-80">({locationShifts.length}人)</div>
                        </td>
                      ) : null}
                      {/* 氏名 */}
                      <td className={`border border-gray-300 px-2 py-1 font-medium ${colors.rowBg}`}>
                        {shift.staff.name}
                      </td>
                      {/* 勤務時間 / 記号 */}
                      <td className={`border border-gray-300 px-2 py-1 font-mono text-xs ${colors.rowBg}`}>
                        {startTime}-{endTime} / {shift.duty_code.code}
                      </td>
                    </tr>
                  )
                })
              })
            })()}
          </tbody>
        </table>
      </Card>

      {/* 凡例 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 bg-yellow-100 border border-gray-300" />
          <span>仮シフト</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-4 h-3 bg-white border border-gray-300" />
          <span>確定シフト</span>
        </div>
      </div>
    </div>
  )
}
