'use client'

import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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

interface WeekTabProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
}

export function WeekTab({ shifts, locationRequirements }: WeekTabProps) {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // 月曜開始
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // 日ごとの必要人数を計算
  const getDayRequirement = (date: Date): number => {
    const dayOfWeek = getDay(date)
    const dateStr = format(date, 'yyyy-MM-dd')

    return locationRequirements.reduce((sum, req) => {
      // 特定日指定がある場合
      if (req.specific_date !== null) {
        if (req.specific_date === dateStr) {
          return sum + req.required_staff_count
        }
        return sum
      }
      // 曜日指定がある場合はマッチする場合のみ
      if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) {
        return sum
      }
      return sum + req.required_staff_count
    }, 0)
  }

  // 日ごとのシフト数を計算
  const getDayShiftCount = (date: Date): number => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return shifts.filter((s) => s.date === dateStr).length
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        {format(weekStart, 'yyyy年M月d日', { locale: ja })} 〜{' '}
        {format(weekEnd, 'M月d日', { locale: ja })}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dayOfWeek = getDay(day)
          const required = getDayRequirement(day)
          const assigned = getDayShiftCount(day)
          const isShortage = assigned < required
          const todayClass = isToday(day) ? 'ring-2 ring-blue-500' : ''

          return (
            <Card
              key={day.toISOString()}
              className={`p-3 text-center ${todayClass} ${
                isShortage ? 'border-red-300 bg-red-50' : ''
              }`}
            >
              {/* 曜日 */}
              <div
                className={`text-xs font-medium ${
                  dayOfWeek === 0
                    ? 'text-red-600'
                    : dayOfWeek === 6
                    ? 'text-blue-600'
                    : 'text-gray-600'
                }`}
              >
                {format(day, 'E', { locale: ja })}
              </div>

              {/* 日付 */}
              <div
                className={`text-lg font-bold ${
                  dayOfWeek === 0
                    ? 'text-red-600'
                    : dayOfWeek === 6
                    ? 'text-blue-600'
                    : 'text-gray-900'
                }`}
              >
                {format(day, 'd')}
              </div>

              {/* 人数 */}
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    isShortage
                      ? 'border-red-600 bg-red-100 text-red-700'
                      : 'border-green-600 bg-green-100 text-green-700'
                  }`}
                >
                  {assigned}/{required}
                </Badge>
              </div>

              {/* 不足表示 */}
              {isShortage && required > 0 && (
                <div className="mt-1 text-xs font-medium text-red-600">
                  -{required - assigned}名
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* 凡例 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded border border-red-300 bg-red-50" />
          人手不足
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded ring-2 ring-blue-500" />
          今日
        </div>
      </div>
    </div>
  )
}
