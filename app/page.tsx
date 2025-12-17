import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { getStaff } from '@/lib/actions/staff'
import { getLocations } from '@/lib/actions/locations'
import { getDutyCodes } from '@/lib/actions/duty-codes'
import { getShiftsWithDetails } from '@/lib/actions/shifts'
import { getAllLocationRequirements } from '@/lib/actions/location-requirements'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  let staff, locations, dutyCodes, shifts, locationRequirements
  let error = null

  try {
    const today = new Date()
    const currentYearMonth = format(today, 'yyyy-MM')

    // 実際のデータを取得
    ;[staff, locations, dutyCodes, shifts, locationRequirements] = await Promise.all([
      getStaff(),
      getLocations(),
      getDutyCodes(),
      getShiftsWithDetails({ yearMonth: currentYearMonth }),
      getAllLocationRequirements(),
    ])
  } catch (e: any) {
    error = e.message
    staff = []
    locations = []
    dutyCodes = []
    shifts = []
    locationRequirements = []
  }

  const activeStaff = staff.filter((s) => s.is_active)
  const activeLocations = locations.filter((l) => l.is_active)

  // 今月の日数と充足率を計算
  const today = new Date()
  const monthStart = startOfMonth(today)
  const monthEnd = endOfMonth(today)
  const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1

  let totalSlotsNeeded = 0
  let totalSlotsFilled = 0
  let daysWithShortage = 0

  // 各日の充足状況をチェック
  for (let i = 0; i < daysInMonth; i++) {
    const date = addDays(monthStart, i)
    const dateStr = format(date, 'yyyy-MM-dd')

    // この日のシフト
    const dayShifts = shifts.filter((s) => s.date === dateStr)

    // この日の必要人数
    let dayRequiredCount = 0
    locationRequirements.forEach((req) => {
      dayRequiredCount += req.required_staff_count
    })

    totalSlotsNeeded += dayRequiredCount
    totalSlotsFilled += dayShifts.length

    // 人数不足をチェック
    if (dayShifts.length < dayRequiredCount) {
      daysWithShortage++
    }
  }

  const fillRate = totalSlotsNeeded > 0
    ? Math.round((totalSlotsFilled / totalSlotsNeeded) * 100)
    : 0

  // 今週のシフトを取得
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 })
  const thisWeekShifts = shifts.filter((s) => {
    const shiftDate = new Date(s.date)
    return shiftDate >= weekStart && shiftDate <= weekEnd
  }).slice(0, 5) // 最大5件表示

  // 統計データ
  const stats = {
    fillRate,
    warningDays: daysWithShortage,
    totalStaff: staff.length,
    activeStaff: activeStaff.length,
    pendingShifts: shifts.filter((s) => s.status === '予定').length,
    confirmedShifts: shifts.filter((s) => s.status === '確定').length,
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-gray-600 mt-1">シフト管理の概要</p>
      </div>

      {/* エラー表示 */}
      {error && (
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
      )}

      {/* 概要カード（4列） */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 充足率カード */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              今月の充足率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.fillRate >= 90 ? 'text-green-600' : stats.fillRate >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
              {stats.fillRate}%
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full ${stats.fillRate >= 90 ? 'bg-green-600' : stats.fillRate >= 70 ? 'bg-yellow-600' : 'bg-red-600'}`}
                style={{ width: `${stats.fillRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 警告カード */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              人数不足の日
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${stats.warningDays === 0 ? 'text-green-600' : 'text-yellow-600'}`}>
              {stats.warningDays}日
            </div>
            {stats.warningDays > 0 ? (
              <Badge variant="outline" className="mt-2 border-yellow-600 text-yellow-600">
                要対応
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-2 border-green-600 text-green-600">
                問題なし
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* スタッフ数カード */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              稼働スタッフ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeStaff}名</div>
            <p className="text-sm text-gray-500 mt-2">
              全{stats.totalStaff}名中
            </p>
          </CardContent>
        </Card>

        {/* シフトステータス */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              シフトステータス
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">予定</span>
                <span className="text-xl font-bold text-yellow-600">{stats.pendingShifts}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">確定</span>
                <span className="text-xl font-bold text-green-600">{stats.confirmedShifts}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/shifts/create">
              <Button className="w-full">📅 シフト作成</Button>
            </Link>
            <Link href="/shifts">
              <Button variant="outline" className="w-full">
                📋 シフト一覧・確定
              </Button>
            </Link>
            <Link href="/staff">
              <Button variant="outline" className="w-full">
                👥 スタッフ管理
              </Button>
            </Link>
            <Link href="/duty-codes">
              <Button variant="outline" className="w-full">
                🔢 勤務記号管理
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* システム情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              登録スタッフ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-sm text-gray-500 mt-1">
              アクティブ: {activeStaff.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              配属箇所
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations.length}</div>
            <p className="text-sm text-gray-500 mt-1">使用中</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              勤務記号
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dutyCodes.length}</div>
            <p className="text-sm text-gray-500 mt-1">登録済み</p>
          </CardContent>
        </Card>
      </div>

      {/* 今週のシフト */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>今週のシフト</CardTitle>
            <Link href="/shifts">
              <Button variant="outline" size="sm">すべて見る</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {thisWeekShifts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              今週のシフトはまだ登録されていません
            </div>
          ) : (
            <div className="space-y-3">
              {thisWeekShifts.map((shift: any) => (
                <div
                  key={shift.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-900">
                      {format(new Date(shift.date), 'M/d (E)', { locale: ja })}
                    </div>
                    <div className="text-sm text-gray-700">{shift.staff.name}</div>
                    <div className="text-xs text-gray-500">
                      {shift.location.location_name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {shift.duty_code.code} ({shift.duty_code.start_time}-{shift.duty_code.end_time})
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      shift.status === '確定'
                        ? 'border-green-600 text-green-600'
                        : 'border-yellow-600 text-yellow-600'
                    }
                  >
                    {shift.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
