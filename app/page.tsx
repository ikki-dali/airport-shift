import { format, startOfMonth, endOfMonth, addDays } from 'date-fns'
import { getShiftsWithDetails } from '@/lib/actions/shifts'
import { getAllLocationRequirements } from '@/lib/actions/location-requirements'
import { StatBar } from '@/components/dashboard/StatBar'
import { DashboardTabs } from '@/components/dashboard/DashboardTabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let shifts: Awaited<ReturnType<typeof getShiftsWithDetails>> = []
  let locationRequirements: Awaited<ReturnType<typeof getAllLocationRequirements>> = []
  let error: string | null = null

  const today = new Date()
  const currentYearMonth = format(today, 'yyyy-MM')

  try {
    ;[shifts, locationRequirements] = await Promise.all([
      getShiftsWithDetails({ yearMonth: currentYearMonth }),
      getAllLocationRequirements(),
    ])
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : 'Unknown error'
  }

  // 今月の統計を計算
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const daysInMonth =
    Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

  let totalSlotsNeeded = 0
  let totalSlotsFilled = 0
  let shortageDays = 0

  // 各日の充足状況をチェック
  for (let i = 0; i < daysInMonth; i++) {
    const date = addDays(monthStart, i)
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayOfWeek = date.getDay()

    // この日のシフト
    const dayShifts = shifts.filter((s) => s.date === dateStr)

    // この日の必要人数
    let dayRequiredCount = 0
    locationRequirements.forEach((req) => {
      // 特定日指定がある場合
      if (req.specific_date !== null) {
        if (req.specific_date === dateStr) {
          dayRequiredCount += req.required_staff_count
        }
        return
      }
      // 曜日指定がある場合はマッチする場合のみ
      if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) {
        return
      }
      dayRequiredCount += req.required_staff_count
    })

    totalSlotsNeeded += dayRequiredCount
    totalSlotsFilled += dayShifts.length

    // 人数不足をチェック
    if (dayShifts.length < dayRequiredCount) {
      shortageDays++
    }
  }

  const fillRate =
    totalSlotsNeeded > 0 ? Math.round((totalSlotsFilled / totalSlotsNeeded) * 100) : 0

  const pendingShifts = shifts.filter((s) => s.status === '予定').length

  // エラー表示
  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">データベース接続エラー</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{error}</p>
            <p className="text-sm text-gray-600 mt-2">
              環境変数が正しく設定されているか確認してください。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 統計バー */}
      <StatBar
        fillRate={fillRate}
        shortageDays={shortageDays}
        pendingShifts={pendingShifts}
      />

      {/* タブ切り替えコンテンツ */}
      <DashboardTabs
        shifts={shifts}
        locationRequirements={locationRequirements}
        yearMonth={currentYearMonth}
      />
    </div>
  )
}
