'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { DayDetailModal } from './DayDetailModal'
import type { DayEvent } from './DashboardTabs'
import { DAY_EVENT_STYLES } from './DashboardTabs'

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
  locations?: {
    id: string
    location_name: string
  } | null
}

interface MonthTabProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
  yearMonth: string
  /** 日別イベント */
  dayEvents?: DayEvent[]
  /** 凡例を非表示（親で1回だけ表示する場合） */
  hideLegend?: boolean
}

/** 充足率から severity を判定（WeekTab と統一） */
function getSeverity(assigned: number, required: number): 'safe' | 'almost' | 'warning' | 'danger' {
  if (required === 0) return 'safe'
  const rate = (assigned / required) * 100
  if (rate >= 100) return 'safe'
  if (rate >= 90) return 'almost'
  if (rate >= 70) return 'warning'
  return 'danger'
}

/** severity に応じたセル背景色 */
function getCellBg(severity: 'safe' | 'almost' | 'warning' | 'danger', dayOfWeek: number): string {
  switch (severity) {
    case 'safe':
      return dayOfWeek === 0 ? 'bg-red-50/50' : dayOfWeek === 6 ? 'bg-navy-50/50' : 'bg-card'
    case 'almost':
      return 'bg-amber-50 hover:bg-amber-100/80'
    case 'warning':
      return 'bg-orange-50 hover:bg-orange-100/80'
    case 'danger':
      return 'bg-red-50 hover:bg-red-100/80'
  }
}

/** severity に応じたバッジ色 */
function getBadgeColor(severity: 'safe' | 'almost' | 'warning' | 'danger'): string {
  switch (severity) {
    case 'safe': return 'bg-green-200 text-green-800'
    case 'almost': return 'bg-amber-200 text-amber-800'
    case 'warning': return 'bg-orange-200 text-orange-800'
    case 'danger': return 'bg-red-200 text-red-800'
  }
}

export function MonthTab({ shifts, locationRequirements, yearMonth, dayEvents = [], hideLegend }: MonthTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {weekDays.map((day, i) => (
                  <th
                    key={i}
                    className={`border-b border-border p-2 text-xs font-semibold ${
                      i === 5
                        ? 'bg-navy-50 text-navy-600'
                        : i === 6
                        ? 'bg-red-50 text-red-600'
                        : 'bg-muted/50 text-muted-foreground'
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
                            className="border border-border bg-muted/50 p-2"
                          />
                        )
                      }

                      const dayOfWeek = getDay(day)
                      const required = getDayRequirement(day)
                      const assigned = getDayShiftCount(day)
                      const isShortage = assigned < required && required > 0
                      const severity = getSeverity(assigned, required)
                      const isTodayCell = isToday(day)

                      return (
                        <td
                          key={dayIndex}
                          className={`border border-border p-2 align-top h-24 overflow-hidden cursor-pointer hover:bg-muted/50 transition-colors ${
                            getCellBg(severity, dayOfWeek)
                          }`}
                          onClick={() => setSelectedDate(day)}
                        >
                          <div className="space-y-1">
                            {/* 日付 */}
                            <span
                              className={`text-sm font-semibold inline-flex items-center justify-center ${
                                isTodayCell
                                  ? 'bg-primary text-primary-foreground rounded-full w-6 h-6'
                                  : dayOfWeek === 0
                                  ? 'text-red-600'
                                  : dayOfWeek === 6
                                  ? 'text-navy-600'
                                  : 'text-foreground'
                              }`}
                            >
                              {format(day, 'd')}
                            </span>

                            {/* 人数表示 */}
                            {required > 0 && (
                              <div
                                className={`text-xs font-medium rounded px-1 py-0.5 inline-block ${getBadgeColor(severity)}`}
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

                            {/* イベントラベル */}
                            {(() => {
                              const dateStr = format(day, 'yyyy-MM-dd')
                              const events = dayEvents.filter((e) => e.date === dateStr)
                              if (events.length === 0) return null
                              return (
                                <div className="space-y-0.5">
                                  {events.slice(0, 2).map((ev, idx) => {
                                    const style = DAY_EVENT_STYLES[ev.type]
                                    return (
                                      <div key={idx} className="flex items-center gap-0.5">
                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                                        <span className={`text-xxs leading-tight truncate ${style.label}`}>
                                          {ev.title}
                                        </span>
                                      </div>
                                    )
                                  })}
                                  {events.length > 2 && (
                                    <div className="text-xxs text-muted-foreground">+{events.length - 2}</div>
                                  )}
                                </div>
                              )
                            })()}
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

      {!hideLegend && (
        <div className="flex items-center gap-3 text-xxs text-muted-foreground flex-wrap">
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-4 rounded-full bg-green-500" />
            充足
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-4 rounded-full bg-amber-500" />
            あと少し
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-4 rounded-full bg-orange-500" />
            要注意
          </div>
          <div className="flex items-center gap-1">
            <div className="h-1.5 w-4 rounded-full bg-red-500" />
            危険
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded ring-2 ring-ring" />
            今日
          </div>
        </div>
      )}

      {/* 日別詳細モーダル */}
      {selectedDate && (
        <DayDetailModal
          open={!!selectedDate}
          onOpenChange={(open) => !open && setSelectedDate(null)}
          date={selectedDate}
          shifts={shifts}
          locationRequirements={locationRequirements}
        />
      )}
    </div>
  )
}
