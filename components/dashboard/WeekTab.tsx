'use client'

import { useState } from 'react'
import { format, eachDayOfInterval, endOfWeek, isToday, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Megaphone, Loader2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DayDetailModal } from './DayDetailModal'
import { sendReinforcementRequest } from '@/lib/actions/notifications'
import { calcLocationShortages } from '@/lib/utils/location-shortages'
import { toast } from 'sonner'
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
  duty_codes?: {
    id: string
    code: string
    start_time: string | null
    end_time: string | null
  } | null
}

interface WeekTabProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
  weekStart: Date
  dayEvents?: DayEvent[]
  hideLegend?: boolean
}

/** 充足率から severity を判定 */
function getSeverity(assigned: number, required: number): 'safe' | 'almost' | 'warning' | 'danger' {
  if (required === 0) return 'safe'
  const rate = (assigned / required) * 100
  if (rate >= 100) return 'safe'
  if (rate >= 90) return 'almost'
  if (rate >= 70) return 'warning'
  return 'danger'
}

/** severity に応じたバーの色 */
function getBarColor(severity: 'safe' | 'almost' | 'warning' | 'danger'): string {
  switch (severity) {
    case 'safe': return 'bg-green-500'
    case 'almost': return 'bg-amber-500'
    case 'warning': return 'bg-orange-500'
    case 'danger': return 'bg-red-500'
  }
}

/** severity に応じたカードの背景 */
function getCardBg(severity: 'safe' | 'almost' | 'warning' | 'danger'): string {
  switch (severity) {
    case 'safe': return ''
    case 'almost': return 'border-amber-200 bg-amber-50/50'
    case 'warning': return 'border-orange-200 bg-orange-50/50'
    case 'danger': return 'border-red-300 bg-red-50'
  }
}

/** 週間統計を計算するユーティリティ（親コンポーネントでも使う） */
export function calcWeekStats(
  weekDays: Date[],
  getDayRequirement: (d: Date) => number,
  getDayShiftCount: (d: Date) => number,
) {
  const stats = weekDays.reduce(
    (acc, day) => {
      const required = getDayRequirement(day)
      const assigned = getDayShiftCount(day)
      acc.totalRequired += required
      acc.totalAssigned += assigned
      const shortage = required - assigned
      if (shortage > 0) {
        acc.shortageDays++
        if (shortage > acc.maxShortage.count) {
          acc.maxShortage = {
            count: shortage,
            dayLabel: format(day, 'E', { locale: ja }),
          }
        }
      }
      return acc
    },
    { totalRequired: 0, totalAssigned: 0, shortageDays: 0, maxShortage: { count: 0, dayLabel: '' } }
  )
  const fillRate = stats.totalRequired > 0
    ? Math.round((stats.totalAssigned / stats.totalRequired) * 100)
    : 100
  return { ...stats, fillRate }
}

export function WeekTab({ shifts, locationRequirements, weekStart, dayEvents = [], hideLegend }: WeekTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [confirmDate, setConfirmDate] = useState<Date | null>(null)
  const [confirmShortage, setConfirmShortage] = useState(0)
  const [isSending, setIsSending] = useState(false)

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // 日ごとの必要人数を計算
  const getDayRequirement = (date: Date): number => {
    const dayOfWeek = getDay(date)
    const dateStr = format(date, 'yyyy-MM-dd')

    return locationRequirements.reduce((sum, req) => {
      if (req.specific_date !== null) {
        if (req.specific_date === dateStr) {
          return sum + req.required_staff_count
        }
        return sum
      }
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

  // 応援要請ボタンハンドラ
  const handleRequestReinforcement = (date: Date, shortage: number) => {
    setConfirmDate(date)
    setConfirmShortage(shortage)
  }

  // 応援要請送信
  const handleSendReinforcement = async () => {
    if (!confirmDate) return
    setIsSending(true)
    try {
      const dateStr = format(confirmDate, 'yyyy-MM-dd')
      const locationShortages = calcLocationShortages(dateStr, locationRequirements, shifts)
      const result = await sendReinforcementRequest({
        date: dateStr,
        shortage: confirmShortage,
        locationShortages,
      })
      if (result.success) {
        toast.success(`${result.sentCount}人に応援依頼を送信しました`)
      } else {
        toast.error(result.error || '送信に失敗しました')
      }
    } catch {
      toast.error('送信に失敗しました')
    } finally {
      setIsSending(false)
      setConfirmDate(null)
    }
  }

  return (
    <div className="space-y-2">
      {/* ===== デスクトップ: 7カラムグリッド（コンパクト） ===== */}
      <div className="hidden md:grid grid-cols-7 gap-1.5">
        {weekDays.map((day) => {
          const dayOfWeek = getDay(day)
          const required = getDayRequirement(day)
          const assigned = getDayShiftCount(day)
          const shortage = required - assigned
          const isShortage = shortage > 0
          const severity = getSeverity(assigned, required)
          const fillPercent = required > 0 ? Math.min(100, Math.round((assigned / required) * 100)) : 100
          const isTodayCell = isToday(day)

          const dateStr = format(day, 'yyyy-MM-dd')
          const events = dayEvents.filter((e) => e.date === dateStr)

          return (
            <Card
              key={day.toISOString()}
              className={`p-2 text-center cursor-pointer hover-lift transition-all ${getCardBg(severity)}`}
              onClick={() => setSelectedDate(day)}
            >
              {/* 曜日 + 日付（コンパクト） */}
              <div
                className={`text-xxs font-medium leading-none ${
                  dayOfWeek === 0
                    ? 'text-red-600'
                    : dayOfWeek === 6
                    ? 'text-navy-600'
                    : 'text-muted-foreground'
                }`}
              >
                {format(day, 'E', { locale: ja })}
              </div>
              <div
                className={`text-sm font-bold leading-tight mx-auto ${
                  isTodayCell
                    ? 'bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center'
                    : dayOfWeek === 0
                    ? 'text-red-600'
                    : dayOfWeek === 6
                    ? 'text-navy-600'
                    : 'text-foreground'
                }`}
              >
                {format(day, 'd')}
              </div>

              {/* 充足バー */}
              <div className="mt-1 mx-0.5">
                <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${getBarColor(severity)} ${
                      severity === 'danger' ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${fillPercent}%` }}
                  />
                </div>
              </div>

              {/* 配置/必要 人数 */}
              <div className="mt-1 text-xxs text-muted-foreground tabular-nums">
                {assigned}/{required}
              </div>

              {/* 不足数 + 要請ボタン */}
              {isShortage && required > 0 && (
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  <span className="text-xxs font-bold text-red-600 leading-none">
                    -{shortage}人
                  </span>
                  <button
                    className="flex items-center gap-0.5 px-1 py-px rounded bg-red-500 hover:bg-red-600 text-white text-xxs font-medium transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRequestReinforcement(day, shortage)
                    }}
                  >
                    <Megaphone className="h-2.5 w-2.5" />
                    要請
                  </button>
                </div>
              )}

              {/* イベント */}
              {events.length > 0 && (
                <div className="mt-1 space-y-px">
                  {events.slice(0, 2).map((ev, idx) => {
                    const style = DAY_EVENT_STYLES[ev.type]
                    return (
                      <div key={idx} className="flex items-center gap-0.5 justify-center">
                        <span className={`w-1 h-1 rounded-full shrink-0 ${style.dot}`} />
                        <span className={`text-xxs leading-tight truncate ${style.label}`}>
                          {ev.title}
                        </span>
                      </div>
                    )
                  })}
                  {events.length > 2 && (
                    <div className="text-xxs text-muted-foreground text-center">+{events.length - 2}</div>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* ===== モバイル: 縦リスト型 ===== */}
      <div className="md:hidden space-y-1.5">
        {weekDays.map((day) => {
          const dayOfWeek = getDay(day)
          const required = getDayRequirement(day)
          const assigned = getDayShiftCount(day)
          const shortage = required - assigned
          const isShortage = shortage > 0
          const severity = getSeverity(assigned, required)
          const fillPercent = required > 0 ? Math.min(100, Math.round((assigned / required) * 100)) : 100
          const isTodayCell = isToday(day)

          const dateStr = format(day, 'yyyy-MM-dd')
          const events = dayEvents.filter((e) => e.date === dateStr)

          return (
            <Card
              key={day.toISOString()}
              className={`p-2 cursor-pointer hover-lift transition-all ${getCardBg(severity)}`}
              onClick={() => setSelectedDate(day)}
            >
              <div className="flex items-center gap-2">
                {/* 曜日 + 日付 */}
                <div className="flex items-center gap-1 shrink-0 w-16">
                  <span
                    className={`text-xxs font-medium ${
                      dayOfWeek === 0
                        ? 'text-red-600'
                        : dayOfWeek === 6
                        ? 'text-navy-600'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {format(day, 'E', { locale: ja })}
                  </span>
                  <span
                    className={`text-xs font-bold ${
                      isTodayCell
                        ? 'bg-primary text-primary-foreground rounded-full w-5 h-5 inline-flex items-center justify-center'
                        : dayOfWeek === 0
                        ? 'text-red-600'
                        : dayOfWeek === 6
                        ? 'text-navy-600'
                        : 'text-foreground'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* 充足バー */}
                <div className="flex-1 min-w-0">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getBarColor(severity)} ${
                        severity === 'danger' ? 'animate-pulse' : ''
                      }`}
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                </div>

                {/* 人数 */}
                <div className="text-xxs text-muted-foreground shrink-0 tabular-nums">
                  {assigned}/{required}
                </div>

                {/* 不足数 */}
                {isShortage && required > 0 && (
                  <span className="text-xxs font-bold text-red-600 shrink-0">
                    -{shortage}
                  </span>
                )}

                {/* 応援要請ボタン */}
                {isShortage && required > 0 && (
                  <button
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-red-500 hover:bg-red-600 text-white text-xxs font-medium transition-colors shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRequestReinforcement(day, shortage)
                    }}
                  >
                    <Megaphone className="h-2.5 w-2.5" />
                    要請
                  </button>
                )}
              </div>

              {/* イベント */}
              {events.length > 0 && (
                <div className="mt-1 flex items-center gap-2 flex-wrap pl-14">
                  {events.slice(0, 3).map((ev, idx) => {
                    const style = DAY_EVENT_STYLES[ev.type]
                    return (
                      <div key={idx} className="flex items-center gap-0.5">
                        <span className={`w-1 h-1 rounded-full shrink-0 ${style.dot}`} />
                        <span className={`text-xxs leading-tight ${style.label}`}>
                          {ev.title}
                        </span>
                      </div>
                    )
                  })}
                  {events.length > 3 && (
                    <span className="text-xxs text-muted-foreground">+{events.length - 3}</span>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* ===== 凡例 ===== */}
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
        </div>
      )}

      {/* ===== 応援依頼確認ダイアログ ===== */}
      <AlertDialog open={!!confirmDate} onOpenChange={(open) => !open && setConfirmDate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>応援依頼を送信しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDate && format(confirmDate, 'M月d日(E)', { locale: ja })} は {confirmShortage}人不足しています。
              <br />
              出勤可能なパートスタッフに応援依頼のプッシュ通知を送信します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendReinforcement}
              disabled={isSending}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                '送信する'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ===== 日別詳細モーダル ===== */}
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
