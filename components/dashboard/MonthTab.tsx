'use client'

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'

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

interface MonthTabProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
  yearMonth: string
}

export function MonthTab({ shifts, locationRequirements, yearMonth }: MonthTabProps) {
  const [year, month] = yearMonth.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, month - 1))
  const monthEnd = endOfMonth(new Date(year, month - 1))
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // 月の開始曜日を取得（0=日曜）
  const startDayOfWeek = getDay(monthStart)
  // 月曜開始にするための調整（0=月曜, ..., 6=日曜）
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1

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

  // カレンダーのセルを生成
  const calendarCells: (Date | null)[] = []
  // 月の前の空白
  for (let i = 0; i < adjustedStartDay; i++) {
    calendarCells.push(null)
  }
  // 月の日付
  daysInMonth.forEach((day) => {
    calendarCells.push(day)
  })
  // 週を埋めるための空白
  while (calendarCells.length % 7 !== 0) {
    calendarCells.push(null)
  }

  // 曜日ヘッダー（月曜開始）
  const weekDays = ['月', '火', '水', '木', '金', '土', '日']

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        {format(monthStart, 'yyyy年M月', { locale: ja })}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {weekDays.map((day, i) => (
                  <th
                    key={i}
                    className={`border-b-2 border-gray-300 p-2 text-xs font-semibold ${
                      i === 5
                        ? 'bg-blue-50 text-blue-600'
                        : i === 6
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-50 text-gray-700'
                    }`}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from(
                { length: Math.ceil(calendarCells.length / 7) },
                (_, weekIndex) => (
                  <tr key={weekIndex}>
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const cellIndex = weekIndex * 7 + dayIndex
                      const day = calendarCells[cellIndex]

                      if (!day) {
                        return (
                          <td
                            key={dayIndex}
                            className="border border-gray-200 bg-gray-50 p-2"
                          />
                        )
                      }

                      const dayOfWeek = getDay(day)
                      const required = getDayRequirement(day)
                      const assigned = getDayShiftCount(day)
                      const isShortage = assigned < required && required > 0
                      const isTodayCell = isToday(day)

                      return (
                        <td
                          key={dayIndex}
                          className={`border border-gray-200 p-2 align-top min-h-[80px] ${
                            isShortage
                              ? 'bg-red-50'
                              : dayOfWeek === 0
                              ? 'bg-red-50/50'
                              : dayOfWeek === 6
                              ? 'bg-blue-50/50'
                              : 'bg-white'
                          } ${isTodayCell ? 'ring-2 ring-inset ring-blue-500' : ''}`}
                        >
                          <div className="space-y-1">
                            {/* 日付 */}
                            <div
                              className={`text-sm font-semibold ${
                                dayOfWeek === 0
                                  ? 'text-red-600'
                                  : dayOfWeek === 6
                                  ? 'text-blue-600'
                                  : 'text-gray-700'
                              }`}
                            >
                              {format(day, 'd')}
                            </div>

                            {/* 人数表示 */}
                            {required > 0 && (
                              <div
                                className={`text-xs font-medium rounded px-1 py-0.5 inline-block ${
                                  isShortage
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-green-200 text-green-800'
                                }`}
                              >
                                {assigned}/{required}
                              </div>
                            )}

                            {/* 不足表示 */}
                            {isShortage && (
                              <div className="text-xs text-red-600 font-medium">
                                -{required - assigned}
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 凡例 */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-red-50 border border-red-200" />
          人手不足
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded bg-green-200" />
          充足
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded ring-2 ring-blue-500" />
          今日
        </div>
      </div>
    </div>
  )
}
