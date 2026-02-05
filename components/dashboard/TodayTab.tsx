'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, AlertTriangle } from 'lucide-react'

// デモ用の1日あたり必要人数
const DAILY_REQUIRED_STAFF = 43

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

      {/* 配置箇所別テーブル */}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">配置箇所</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">スタッフ</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">時間</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">記号</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {locationEntries.flatMap(([location, locationShifts]) => {
              const sortedShifts = [...locationShifts].sort((a, b) =>
                a.duty_code.start_time.localeCompare(b.duty_code.start_time)
              )
              return sortedShifts.map((shift, idx) => {
                const startTime = shift.duty_code.start_time.slice(0, 5)
                const endTime = shift.duty_code.end_time.slice(0, 5)
                return (
                  <tr
                    key={shift.id}
                    className={shift.status === '確定' ? 'bg-green-50' : 'bg-yellow-50'}
                  >
                    <td className="px-3 py-1.5 text-gray-700">
                      {idx === 0 ? location : ''}
                    </td>
                    <td className="px-3 py-1.5 font-medium text-gray-800">
                      {shift.staff.name}
                    </td>
                    <td className="px-3 py-1.5 text-gray-600">
                      {startTime}-{endTime}
                    </td>
                    <td className="px-3 py-1.5 text-gray-600 font-mono text-xs">
                      {shift.duty_code.code}
                    </td>
                  </tr>
                )
              })
            })}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
