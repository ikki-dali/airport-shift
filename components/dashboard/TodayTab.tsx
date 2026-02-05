'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Users, AlertTriangle } from 'lucide-react'

// デモ用の1日あたり必要人数
const DAILY_REQUIRED_STAFF = 43

// 配置箇所ごとの色設定（新ロケーション名対応）
const LOCATION_COLORS: Record<string, { rowBg: string; headerBg: string; headerText: string }> = {
  'T3中央': { rowBg: 'bg-blue-50', headerBg: 'bg-blue-600', headerText: 'text-white' },
  'T3北側': { rowBg: 'bg-purple-50', headerBg: 'bg-purple-600', headerText: 'text-white' },
  'T2中央検査場': { rowBg: 'bg-green-50', headerBg: 'bg-green-600', headerText: 'text-white' },
  'T3クリーンバス': { rowBg: 'bg-amber-50', headerBg: 'bg-amber-600', headerText: 'text-white' },
  'T3際際バス': { rowBg: 'bg-rose-50', headerBg: 'bg-rose-600', headerText: 'text-white' },
  'T2クリーンバス': { rowBg: 'bg-cyan-50', headerBg: 'bg-cyan-600', headerText: 'text-white' },
  'T2際際バス': { rowBg: 'bg-orange-50', headerBg: 'bg-orange-600', headerText: 'text-white' },
  // 旧名称も残す（互換性）
  '第1ターミナル': { rowBg: 'bg-blue-50', headerBg: 'bg-blue-600', headerText: 'text-white' },
  '第2ターミナル': { rowBg: 'bg-green-50', headerBg: 'bg-green-600', headerText: 'text-white' },
  '第3ターミナル北': { rowBg: 'bg-purple-50', headerBg: 'bg-purple-600', headerText: 'text-white' },
  '第3ターミナル南': { rowBg: 'bg-amber-50', headerBg: 'bg-amber-600', headerText: 'text-white' },
  'バスゲート': { rowBg: 'bg-rose-50', headerBg: 'bg-rose-600', headerText: 'text-white' },
}

const DEFAULT_COLOR = { rowBg: 'bg-gray-50', headerBg: 'bg-gray-600', headerText: 'text-white' }

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

  // タイムライン設定（4:00〜24:00）
  const TIMELINE_START = 4 * 60  // 4:00
  const TIMELINE_END = 24 * 60   // 24:00
  const TIMELINE_HOURS = [4, 8, 12, 16, 20, 24]

  return (
    <div className="space-y-2">
      {/* サマリーバー（コンパクト化） */}
      <div className="flex items-center justify-between bg-gray-100 px-3 py-1.5 text-xs">
        <span className="font-medium text-gray-700">
          {format(today, 'M/d(E)', { locale: ja })}
        </span>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1 font-semibold ${
            isShortageDay ? 'text-red-600' : 'text-green-600'
          }`}>
            <Users className="h-3.5 w-3.5" />
            <span>{totalAssigned}/{requiredStaff}</span>
            {isShortageDay && <span className="text-red-500">(-{shortage})</span>}
          </div>
          <span className="text-gray-500">
            確定{confirmedCount} 仮{pendingCount}
          </span>
        </div>
      </div>

      {/* 人手不足警告（コンパクト化） */}
      {isShortageDay && (
        <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 text-xs text-red-700">
          <AlertTriangle className="h-3 w-3" />
          <span>{shortage}人不足</span>
        </div>
      )}

      {/* Excelシフト表風テーブル（コンパクト化＋タイムラインバー） */}
      <Card className="border">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-1 py-0.5 text-center font-semibold text-gray-600 w-6">#</th>
              <th className="border border-gray-300 px-1.5 py-0.5 text-left font-semibold text-gray-600 w-20">配置</th>
              <th className="border border-gray-300 px-1.5 py-0.5 text-left font-semibold text-gray-600 w-16">氏名</th>
              <th className="border border-gray-300 px-1.5 py-0.5 text-left font-semibold text-gray-600 w-24">時間/記号</th>
              <th className="border border-gray-300 px-1 py-0.5 text-center font-semibold text-gray-600">
                <div className="flex justify-between text-[10px] text-gray-500 min-w-[120px]">
                  {TIMELINE_HOURS.map(h => <span key={h}>{h}</span>)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              let globalIndex = 0
              return locationEntries.map(([location, locationShifts]) => {
                const colors = LOCATION_COLORS[location] || DEFAULT_COLOR
                const sortedShifts = [...locationShifts].sort((a, b) =>
                  a.duty_code.start_time.localeCompare(b.duty_code.start_time)
                )

                return sortedShifts.map((shift, idx) => {
                  globalIndex++
                  const startTime = shift.duty_code.start_time.slice(0, 5)
                  const endTime = shift.duty_code.end_time.slice(0, 5)
                  const isPending = shift.status !== '確定'

                  // タイムラインバー計算
                  const startMin = timeToMinutes(shift.duty_code.start_time)
                  const endMin = timeToMinutes(shift.duty_code.end_time)

                  // 日またぎ判定（終了時間が開始時間より前）
                  const isOvernight = endMin < startMin

                  // 通常シフトのバー計算
                  const barStart = Math.max(0, (startMin - TIMELINE_START) / (TIMELINE_END - TIMELINE_START) * 100)
                  const barWidth = isOvernight
                    ? (TIMELINE_END - startMin) / (TIMELINE_END - TIMELINE_START) * 100  // 開始〜24:00
                    : Math.min(100 - barStart, (endMin - startMin) / (TIMELINE_END - TIMELINE_START) * 100)

                  // 日またぎの場合の翌日部分（4:00〜終了時間）
                  const overnightBarWidth = isOvernight
                    ? Math.max(0, (endMin - TIMELINE_START) / (TIMELINE_END - TIMELINE_START) * 100)
                    : 0

                  return (
                    <tr key={shift.id} className={isPending ? 'bg-yellow-50' : ''}>
                      <td className="border border-gray-300 px-1 py-0.5 text-center text-gray-400">
                        {globalIndex}
                      </td>
                      {idx === 0 ? (
                        <td
                          className={`border border-gray-300 px-1.5 py-0.5 font-semibold ${colors.headerBg} ${colors.headerText}`}
                          rowSpan={locationShifts.length}
                        >
                          <div className="leading-tight">{location}</div>
                          <div className="font-normal opacity-75 text-[10px]">{locationShifts.length}人</div>
                        </td>
                      ) : null}
                      <td className={`border border-gray-300 px-1.5 py-0.5 ${colors.rowBg}`}>
                        {shift.staff.name}
                      </td>
                      <td className={`border border-gray-300 px-1.5 py-0.5 font-mono text-[10px] ${colors.rowBg}`}>
                        {startTime}-{endTime}
                        <span className="text-gray-400 ml-0.5">/{shift.duty_code.code}</span>
                      </td>
                      <td className="border border-gray-300 px-1 py-0.5">
                        <div className="h-2 bg-gray-100 rounded-sm overflow-hidden min-w-[120px] relative">
                          {/* 日またぎの場合: 左端に翌日分（4:00〜終了時間） */}
                          {isOvernight && overnightBarWidth > 0 && (
                            <div
                              className={`absolute h-full rounded-sm ${isPending ? 'bg-yellow-400' : 'bg-blue-400'}`}
                              style={{ left: 0, width: `${overnightBarWidth}%` }}
                            />
                          )}
                          {/* メインバー（通常 or 日またぎの当日分） */}
                          <div
                            className={`absolute h-full rounded-sm ${isPending ? 'bg-yellow-400' : 'bg-blue-400'}`}
                            style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })
              })
            })()}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
