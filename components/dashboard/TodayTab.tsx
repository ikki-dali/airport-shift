'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Users, AlertTriangle } from 'lucide-react'

// デモ用の1日あたり必要人数
const DAILY_REQUIRED_STAFF = 43

// 配置箇所ごとの色設定
const LOCATION_COLORS: Record<string, { bg: string; border: string; header: string }> = {
  '第1ターミナル': { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100 text-blue-800' },
  '第2ターミナル': { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100 text-green-800' },
  '第3ターミナル北': { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100 text-purple-800' },
  '第3ターミナル南': { bg: 'bg-orange-50', border: 'border-orange-200', header: 'bg-orange-100 text-orange-800' },
  'バスゲート': { bg: 'bg-pink-50', border: 'border-pink-200', header: 'bg-pink-100 text-pink-800' },
}

const DEFAULT_COLOR = { bg: 'bg-gray-50', border: 'border-gray-200', header: 'bg-gray-100 text-gray-800' }

// 時間を分に変換（タイムラインバー用）
function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

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

      {/* 配置箇所別カード */}
      <div className="grid gap-3 md:grid-cols-2">
        {locationEntries.map(([location, locationShifts]) => {
          const colors = LOCATION_COLORS[location] || DEFAULT_COLOR
          const sortedShifts = [...locationShifts].sort((a, b) =>
            a.duty_code.start_time.localeCompare(b.duty_code.start_time)
          )

          return (
            <Card key={location} className={`overflow-hidden border-2 ${colors.border}`}>
              {/* 配置箇所ヘッダー */}
              <div className={`px-3 py-2 font-semibold text-sm ${colors.header}`}>
                {location}
                <span className="ml-2 font-normal opacity-75">({locationShifts.length}人)</span>
              </div>

              {/* スタッフリスト */}
              <div className={colors.bg}>
                {sortedShifts.map((shift, idx) => {
                  const startTime = shift.duty_code.start_time.slice(0, 5)
                  const endTime = shift.duty_code.end_time.slice(0, 5)
                  const startMin = timeToMinutes(shift.duty_code.start_time)
                  const endMin = timeToMinutes(shift.duty_code.end_time)
                  // 6:00-23:00 を 0-100% にマッピング
                  const dayStart = 6 * 60  // 6:00
                  const dayEnd = 23 * 60   // 23:00
                  const barStart = Math.max(0, (startMin - dayStart) / (dayEnd - dayStart) * 100)
                  const barWidth = Math.min(100 - barStart, (endMin - startMin) / (dayEnd - dayStart) * 100)

                  return (
                    <div
                      key={shift.id}
                      className={`px-3 py-1.5 border-b last:border-b-0 ${
                        idx % 2 === 0 ? 'bg-white/50' : 'bg-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-sm">
                        <span className={`w-2 h-2 rounded-full ${
                          shift.status === '確定' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <span className="font-medium text-gray-800 min-w-[5rem]">
                          {shift.staff.name}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {startTime}-{endTime}
                        </span>
                        <span className="text-gray-500 font-mono text-xs">
                          {shift.duty_code.code}
                        </span>
                      </div>
                      {/* タイムラインバー */}
                      <div className="mt-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            shift.status === '確定' ? 'bg-green-400' : 'bg-yellow-400'
                          }`}
                          style={{ marginLeft: `${barStart}%`, width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
