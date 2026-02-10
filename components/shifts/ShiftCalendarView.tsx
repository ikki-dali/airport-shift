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

interface ShiftCalendarViewProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
  yearMonth: string
  onDayClick?: (date: string) => void
}

export function ShiftCalendarView({
  shifts,
  locationRequirements,
  yearMonth,
  onDayClick,
}: ShiftCalendarViewProps) {
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

  // 日ごとのシフト統計を計算
  const getDayStats = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayShifts = shifts.filter((s) => s.date === dateStr)
    return {
      total: dayShifts.length,
      confirmed: dayShifts.filter((s) => s.status === '確定').length,
      pending: dayShifts.filter((s) => s.status === '予定' || s.status === '仮').length,
    }
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
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {weekDays.map((day, i) => (
                  <th
                    key={i}
                    className={`border-b-2 border-gray-200 p-3 text-sm font-semibold ${
                      i === 5
                        ? 'bg-navy-50 text-navy-600'
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
                            className="border border-gray-200 bg-gray-50 p-3 h-24"
                          />
                        )
                      }

                      const dayOfWeek = getDay(day)
                      const required = getDayRequirement(day)
                      const stats = getDayStats(day)
                      const isShortage = stats.total < required && required > 0
                      const isTodayCell = isToday(day)
                      const dateStr = format(day, 'yyyy-MM-dd')

                      return (
                        <td
                          key={dayIndex}
                          onClick={() => onDayClick?.(dateStr)}
                          className={`border border-gray-200 p-3 align-top h-24 transition-colors ${
                            isShortage
                              ? 'bg-red-50 hover:bg-red-100'
                              : dayOfWeek === 0
                              ? 'bg-red-50/30 hover:bg-red-50'
                              : dayOfWeek === 6
                              ? 'bg-navy-50/30 hover:bg-navy-50'
                              : 'bg-white hover:bg-gray-50'
                          } ${isTodayCell ? 'ring-2 ring-inset ring-ring' : ''} ${
                            onDayClick ? 'cursor-pointer' : ''
                          }`}
                        >
                          <div className="space-y-1">
                            {/* 日付 */}
                            <div
                              className={`text-sm font-bold ${
                                dayOfWeek === 0
                                  ? 'text-red-600'
                                  : dayOfWeek === 6
                                  ? 'text-navy-600'
                                  : 'text-gray-700'
                              }`}
                            >
                              {format(day, 'd')}
                            </div>

                            {/* 人数表示 */}
                            {required > 0 && (
                              <div
                                className={`text-xs font-semibold rounded px-1.5 py-0.5 inline-block ${
                                  isShortage
                                    ? 'bg-red-200 text-red-800'
                                    : 'bg-green-200 text-green-800'
                                }`}
                              >
                                {stats.total}/{required}人
                              </div>
                            )}

                            {/* ステータス内訳 */}
                            {stats.total > 0 && (
                              <div className="flex gap-1 flex-wrap">
                                {stats.confirmed > 0 && (
                                  <span className="text-xs bg-green-100 text-green-700 px-1 rounded">
                                    確{stats.confirmed}
                                  </span>
                                )}
                                {stats.pending > 0 && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                                    仮{stats.pending}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* 不足表示 */}
                            {isShortage && (
                              <div className="text-xs text-red-600 font-bold">
                                {required - stats.total}人不足
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
      <div className="flex items-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-50 border border-red-200" />
          <span>人手不足</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-green-200" />
          <span>充足</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">確</span>
          <span>確定</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">仮</span>
          <span>仮・予定</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded ring-2 ring-ring" />
          <span>今日</span>
        </div>
      </div>
    </div>
  )
}
