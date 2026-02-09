'use client'

import { useState, useCallback } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, addWeeks, addMonths, parseISO, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { CalendarRange, Calendar, ChevronLeft, ChevronRight, TrendingUp, AlertTriangle, Megaphone, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
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
import { sendReinforcementRequest } from '@/lib/actions/notifications'
import { toast } from 'sonner'
import { TodayTab } from './TodayTab'
import { WeekTab, calcWeekStats } from './WeekTab'
import { MonthTab } from './MonthTab'

/** スワイプで辿れる週の数 */
const WEEK_PAGES = 4
/** スワイプで辿れる月の数 */
const MONTH_PAGES = 3

// --- サンプルイベントデータ（ハードコード） ---
export interface DayEvent {
  date: string
  type: 'vip' | 'event' | 'holiday' | 'memo'
  title: string
}

export const DAY_EVENT_STYLES: Record<DayEvent['type'], { dot: string; label: string }> = {
  vip:     { dot: 'bg-amber-500',  label: 'text-amber-700' },
  event:   { dot: 'bg-primary',    label: 'text-primary' },
  holiday: { dot: 'bg-red-500',    label: 'text-red-700' },
  memo:    { dot: 'bg-gray-400',   label: 'text-gray-600' },
}

const SAMPLE_DAY_EVENTS: DayEvent[] = [
  { date: '2026-02-11', type: 'holiday', title: '建国記念の日' },
  { date: '2026-02-14', type: 'vip',     title: 'VIP視察' },
  { date: '2026-02-20', type: 'event',   title: 'T3防災訓練' },
  { date: '2026-02-23', type: 'holiday', title: '天皇誕生日' },
  { date: '2026-02-25', type: 'memo',    title: '設備点検' },
  { date: '2026-03-05', type: 'event',   title: 'T2工事開始' },
  { date: '2026-03-10', type: 'vip',     title: '大臣視察' },
  { date: '2026-03-20', type: 'holiday', title: '春分の日' },
  { date: '2026-03-28', type: 'memo',    title: '年度末棚卸し' },
]

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
  duty_codes: {
    id: string
    code: string
    start_time: string | null
    end_time: string | null
    category: string
  } | null
  locations: {
    id: string
    location_name: string
  } | null
}

interface DashboardTabsProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
  yearMonth: string
  nextYearMonth: string
  todayStr?: string
  settings?: Record<string, string>
  fillRate?: number
  shortageDays?: number
}

/** ページ送りヘッダー */
function PageHeader({
  icon,
  label,
  dateRange,
  page,
  totalPages,
  onPrev,
  onNext,
  badges,
  action,
}: {
  icon: React.ReactNode
  label: string
  dateRange: string
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
  badges?: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2 min-w-0 flex-wrap">
        {icon}
        <h2 className="text-lg font-semibold text-foreground whitespace-nowrap">{label}</h2>
        <span className="text-sm text-muted-foreground whitespace-nowrap">{dateRange}</span>
        {badges}
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        {action}
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={page === 0}
            className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="前へ"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="text-xs text-muted-foreground tabular-nums min-w-[40px] text-center">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={onNext}
            disabled={page === totalPages - 1}
            className="p-1.5 rounded-md hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label="次へ"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}

export function DashboardTabs({
  shifts,
  locationRequirements,
  yearMonth,
  nextYearMonth,
  todayStr,
  settings,
  fillRate,
  shortageDays,
}: DashboardTabsProps) {
  const today = todayStr ? parseISO(todayStr) : new Date()
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 })

  // --- 週ページ ---
  const [weekPage, setWeekPage] = useState(0)
  const prevWeek = useCallback(() => setWeekPage((p) => Math.max(0, p - 1)), [])
  const nextWeek = useCallback(() => setWeekPage((p) => Math.min(WEEK_PAGES - 1, p + 1)), [])

  const currentWeekStart = addWeeks(thisWeekStart, weekPage)
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

  const weekLabel = weekPage === 0 ? 'This Week' : weekPage === 1 ? 'Next Week' : `+${weekPage}週`
  const weekDateRange = `${format(currentWeekStart, 'M/d(E)', { locale: ja })}〜${format(currentWeekEnd, 'M/d(E)', { locale: ja })}`

  // --- 週統計（ヘッダーバッジ用） ---
  const weekDaysForStats = eachDayOfInterval({ start: currentWeekStart, end: currentWeekEnd })
  const getWeekDayReq = (date: Date): number => {
    const dow = getDay(date)
    const ds = format(date, 'yyyy-MM-dd')
    return locationRequirements.reduce((sum, req) => {
      if (req.specific_date !== null) return req.specific_date === ds ? sum + req.required_staff_count : sum
      if (req.day_of_week !== null && req.day_of_week !== dow) return sum
      return sum + req.required_staff_count
    }, 0)
  }
  const getWeekDayCount = (date: Date): number => {
    const ds = format(date, 'yyyy-MM-dd')
    return shifts.filter((s) => s.date === ds).length
  }
  const wStats = calcWeekStats(weekDaysForStats, getWeekDayReq, getWeekDayCount)

  const weekBadges = (
    <div className="flex items-center gap-1.5">
      <Badge
        variant={wStats.fillRate >= 100 ? 'accent' : wStats.fillRate >= 90 ? 'success' : wStats.fillRate >= 70 ? 'warning' : 'destructive'}
        className="gap-1 px-2 py-0.5 text-xs"
      >
        <TrendingUp className="h-3 w-3" />
        {wStats.fillRate}%
      </Badge>
      {wStats.shortageDays > 0 && (
        <Badge
          variant={wStats.shortageDays <= 2 ? 'warning' : 'destructive'}
          className="gap-1 px-2 py-0.5 text-xs"
        >
          <AlertTriangle className="h-3 w-3" />
          不足{wStats.shortageDays}日
        </Badge>
      )}
    </div>
  )

  // --- 月ページ ---
  const [monthPage, setMonthPage] = useState(0)
  const prevMonth = useCallback(() => setMonthPage((p) => Math.max(0, p - 1)), [])
  const nextMonth = useCallback(() => setMonthPage((p) => Math.min(MONTH_PAGES - 1, p + 1)), [])

  const [year, month] = yearMonth.split('-').map(Number)
  const currentMonthDate = addMonths(new Date(year, month - 1), monthPage)
  const currentYearMonth = format(currentMonthDate, 'yyyy-MM')
  const currentMonthLabel = format(currentMonthDate, 'yyyy年M月', { locale: ja })

  const monthLabel = monthPage === 0 ? 'This Month' : monthPage === 1 ? 'Next Month' : `+${monthPage}ヶ月`

  // --- 表示中の月の統計＋不足日リスト ---
  const currentMonthStart = startOfMonth(currentMonthDate)
  const currentMonthEnd = endOfMonth(currentMonthDate)
  const currentMonthDays = eachDayOfInterval({ start: currentMonthStart, end: currentMonthEnd })

  const monthDayStats = currentMonthDays.map((day) => {
    const dow = getDay(day)
    const ds = format(day, 'yyyy-MM-dd')
    const required = locationRequirements.reduce((sum, req) => {
      if (req.specific_date !== null) return req.specific_date === ds ? sum + req.required_staff_count : sum
      if (req.day_of_week !== null && req.day_of_week !== dow) return sum
      return sum + req.required_staff_count
    }, 0)
    const assigned = shifts.filter((s) => s.date === ds).length
    const shortage = required - assigned
    return { date: day, dateStr: ds, required, assigned, shortage }
  })

  const monthShortageDays = monthDayStats.filter((d) => d.shortage > 0)
  const currentMonthTotalRequired = monthDayStats.reduce((s, d) => s + d.required, 0)
  const currentMonthTotalAssigned = monthDayStats.reduce((s, d) => s + d.assigned, 0)
  const currentMonthFillRate = currentMonthTotalRequired > 0
    ? Math.round((currentMonthTotalAssigned / currentMonthTotalRequired) * 100)
    : 100
  const currentMonthShortageDayCount = monthShortageDays.length

  // --- 一斉応援要請ステート ---
  const [showBulkReinforcement, setShowBulkReinforcement] = useState(false)
  const [isSendingBulk, setIsSendingBulk] = useState(false)

  const handleBulkReinforcement = async () => {
    setIsSendingBulk(true)
    try {
      const results = await Promise.all(
        monthShortageDays.map((d) =>
          sendReinforcementRequest({ date: d.dateStr, shortage: d.shortage })
        )
      )
      const totalSent = results.reduce((sum, r) => sum + (r.sentCount || 0), 0)
      const failCount = results.filter((r) => !r.success).length
      if (failCount === 0) {
        toast.success(`${monthShortageDays.length}日分、計${totalSent}人に応援依頼を送信しました`)
      } else {
        toast.warning(`${monthShortageDays.length - failCount}日分送信成功、${failCount}日分失敗`)
      }
    } catch {
      toast.error('一斉応援依頼の送信に失敗しました')
    } finally {
      setIsSendingBulk(false)
      setShowBulkReinforcement(false)
    }
  }

  // 統計バッジ（全ページ対応）
  const monthBadges = (
    <div className="flex items-center gap-1.5">
      <Badge
        variant={currentMonthFillRate >= 100 ? 'accent' : currentMonthFillRate >= 90 ? 'success' : currentMonthFillRate >= 70 ? 'warning' : 'destructive'}
        className="gap-1 px-2 py-0.5 text-xs"
      >
        <TrendingUp className="h-3 w-3" />
        {currentMonthFillRate}%
      </Badge>
      {currentMonthShortageDayCount > 0 && (
        <Badge
          variant={currentMonthShortageDayCount <= 3 ? 'warning' : 'destructive'}
          className="gap-1 px-2 py-0.5 text-xs"
        >
          <AlertTriangle className="h-3 w-3" />
          不足{currentMonthShortageDayCount}日
        </Badge>
      )}
    </div>
  )

  // 一斉要請ボタン（右側・ページネーション横）
  const monthAction = monthShortageDays.length > 0 ? (
    <button
      onClick={() => setShowBulkReinforcement(true)}
      className="flex items-center gap-1 px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-medium transition-colors"
    >
      <Megaphone className="h-3 w-3" />
      一斉要請
    </button>
  ) : null

  return (
    <div className="space-y-8">
      {/* Today セクション */}
      <section>
        <TodayTab
          shifts={shifts}
          locationRequirements={locationRequirements}
          settings={settings}
        />
      </section>

      {/* 週セクション：フル幅のまま左右でめくれる */}
      <section>
        <PageHeader
          icon={<CalendarRange className="h-5 w-5 text-primary shrink-0" />}
          label={weekLabel}
          dateRange={weekDateRange}
          page={weekPage}
          totalPages={WEEK_PAGES}
          onPrev={prevWeek}
          onNext={nextWeek}
          badges={weekBadges}
        />
        <WeekTab
          shifts={shifts}
          locationRequirements={locationRequirements}
          weekStart={currentWeekStart}
          dayEvents={SAMPLE_DAY_EVENTS}
          hideLegend
        />
      </section>

      {/* 月セクション：フル幅のまま左右でめくれる */}
      <section>
        <PageHeader
          icon={<Calendar className="h-5 w-5 text-primary shrink-0" />}
          label={monthLabel}
          dateRange={currentMonthLabel}
          page={monthPage}
          totalPages={MONTH_PAGES}
          onPrev={prevMonth}
          onNext={nextMonth}
          badges={monthBadges}
          action={monthAction}
        />
        <MonthTab
          shifts={shifts}
          locationRequirements={locationRequirements}
          yearMonth={currentYearMonth}
          dayEvents={SAMPLE_DAY_EVENTS}
          hideLegend
        />
      </section>

      {/* 一斉応援要請 確認ダイアログ */}
      <AlertDialog open={showBulkReinforcement} onOpenChange={setShowBulkReinforcement}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>一斉応援依頼を送信しますか？</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-2">
                  {currentMonthLabel} の不足 {monthShortageDays.length}日分をまとめて送信します。
                </p>
                <div className="max-h-40 overflow-y-auto border rounded p-2 space-y-1 text-sm">
                  {monthShortageDays.map((d) => (
                    <div key={d.dateStr} className="flex items-center justify-between">
                      <span>{format(d.date, 'M/d(E)', { locale: ja })}</span>
                      <span className="text-red-600 font-medium">-{d.shortage}人</span>
                    </div>
                  ))}
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingBulk}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkReinforcement}
              disabled={isSendingBulk}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSendingBulk ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                `${monthShortageDays.length}日分を一斉送信`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
