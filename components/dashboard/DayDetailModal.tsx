'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Users, AlertTriangle, Megaphone, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { sendReinforcementRequest } from '@/lib/actions/notifications'
import { toast } from 'sonner'

// 配置箇所ごとの色設定
const LOCATION_COLORS: Record<string, { rowBg: string; headerBg: string; headerText: string }> = {
  'T3中央': { rowBg: 'bg-primary/5', headerBg: 'bg-primary', headerText: 'text-primary-foreground' },
  'T3北側': { rowBg: 'bg-purple-50', headerBg: 'bg-purple-600', headerText: 'text-white' },
  'T2中央検査場': { rowBg: 'bg-green-50', headerBg: 'bg-green-600', headerText: 'text-white' },
  'T3クリーンバス': { rowBg: 'bg-amber-50', headerBg: 'bg-amber-600', headerText: 'text-white' },
  'T3際際バス': { rowBg: 'bg-rose-50', headerBg: 'bg-rose-600', headerText: 'text-white' },
  'T2クリーンバス': { rowBg: 'bg-cyan-50', headerBg: 'bg-cyan-600', headerText: 'text-white' },
  'T2際際バス': { rowBg: 'bg-orange-50', headerBg: 'bg-orange-600', headerText: 'text-white' },
}

const DEFAULT_COLOR = { rowBg: 'bg-gray-50', headerBg: 'bg-gray-600', headerText: 'text-white' }

// 時間を分に変換
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
  locations?: {
    id: string
    location_name: string
  } | null
  duty_codes?: {
    id: string
    code: string
    start_time: string
    end_time: string
  } | null
}

interface DutyCodeShortage {
  dutyCodeId: string
  dutyCode: string
  startTime: string
  endTime: string
  required: number
  assigned: number
  shortage: number
}

interface DayDetailModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  date: Date
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
}

export function DayDetailModal({
  open,
  onOpenChange,
  date,
  shifts,
  locationRequirements,
}: DayDetailModalProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isSending, setIsSending] = useState(false)

  const dateStr = format(date, 'yyyy-MM-dd')
  const dayOfWeek = date.getDay()

  // 応援依頼を送信
  const handleSendReinforcementRequest = async () => {
    setIsSending(true)
    try {
      const result = await sendReinforcementRequest({
        date: dateStr,
        shortage,
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
      setShowConfirmDialog(false)
    }
  }

  // その日のシフトをフィルタ
  const dayShifts = shifts.filter((s) => s.date === dateStr)

  // その日の必要人数を計算
  const dayRequired = locationRequirements.reduce((sum, req) => {
    if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) return sum
    if (req.specific_date !== null && req.specific_date !== dateStr) return sum
    return sum + req.required_staff_count
  }, 0)

  const totalAssigned = dayShifts.length
  const confirmedCount = dayShifts.filter((s) => s.status === '確定').length
  const pendingCount = dayShifts.length - confirmedCount
  const shortage = dayRequired - totalAssigned
  const isShortageDay = shortage > 0

  // 配置箇所ごとにグルーピング
  const byLocation: Record<string, Shift[]> = {}
  dayShifts.forEach((shift) => {
    const key = shift.location.location_name
    if (!byLocation[key]) byLocation[key] = []
    byLocation[key].push(shift)
  })

  // 配置箇所をソート（人数多い順）
  // 配置場所の固定順序
  const LOCATION_ORDER = [
    'T3中央',
    'T3北側', 
    'T2中央検査場',
    'T3クリーンバス',
    'T3際際バス',
    'T2クリーンバス',
    'T2際際バス',
  ]
  const locationEntries = Object.entries(byLocation).sort((a, b) => {
    const aIndex = LOCATION_ORDER.indexOf(a[0])
    const bIndex = LOCATION_ORDER.indexOf(b[0])
    // 定義されていない場所は末尾に
    if (aIndex === -1 && bIndex === -1) return a[0].localeCompare(b[0])
    if (aIndex === -1) return 1
    if (bIndex === -1) return -1
    return aIndex - bIndex
  })

  // 配置箇所ごとの必要人数合計を計算
  const locationRequiredMap = new Map<string, number>()
  locationRequirements.forEach((req) => {
    if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) return
    if (req.specific_date !== null && req.specific_date !== dateStr) return
    if (!req.locations) return

    const locationName = req.locations.location_name
    const current = locationRequiredMap.get(locationName) || 0
    locationRequiredMap.set(locationName, current + req.required_staff_count)
  })

  // 配置箇所ごとの不足を計算
  const locationShortageMap = new Map<string, number>()
  locationRequiredMap.forEach((required, locationName) => {
    const assigned = byLocation[locationName]?.length || 0
    const shortageCount = required - assigned
    if (shortageCount > 0) {
      locationShortageMap.set(locationName, shortageCount)
    }
  })

  // 配置箇所・勤務記号ごとの不足を詳細に計算
  const locationDutyCodeShortageMap = new Map<string, DutyCodeShortage[]>()
  locationRequirements.forEach((req) => {
    if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) return
    if (req.specific_date !== null && req.specific_date !== dateStr) return
    if (!req.locations || !req.duty_codes) return

    const locationName = req.locations.location_name
    const dutyCode = req.duty_codes

    // この配置箇所・勤務記号のシフト数をカウント
    const assignedCount = (byLocation[locationName] || []).filter(
      (shift) => shift.duty_code.id === req.duty_code_id
    ).length

    const shortageCount = req.required_staff_count - assignedCount
    if (shortageCount > 0) {
      const shortages = locationDutyCodeShortageMap.get(locationName) || []
      for (let i = 0; i < shortageCount; i++) {
        shortages.push({
          dutyCodeId: dutyCode.id,
          dutyCode: dutyCode.code,
          startTime: dutyCode.start_time || '00:00',
          endTime: dutyCode.end_time || '00:00',
          required: req.required_staff_count,
          assigned: assignedCount,
          shortage: shortageCount,
        })
      }
      locationDutyCodeShortageMap.set(locationName, shortages)
    }
  })

  // タイムライン設定（0:00〜24:00）
  const TIMELINE_START = 0
  const TIMELINE_END = 24 * 60
  const TIMELINE_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>
            {format(date, 'yyyy年M月d日(E)', { locale: ja })} の配置
          </DialogTitle>
          {isShortageDay && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowConfirmDialog(true)}
              disabled={isSending}
              className="gap-1"
            >
              <Megaphone className="h-4 w-4" />
              応援を求める
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-3">
          {/* サマリー */}
          <div className="flex items-center justify-between bg-muted px-3 py-2 rounded text-sm">
            <div className={`flex items-center gap-2 font-semibold ${
              isShortageDay ? 'text-red-600' : 'text-green-600'
            }`}>
              <Users className="h-4 w-4" />
              <span>{totalAssigned}/{dayRequired}人</span>
              {isShortageDay && <span className="text-red-500">(-{shortage})</span>}
            </div>
            <span className="text-muted-foreground text-xs">
              確定{confirmedCount} 仮{pendingCount}
            </span>
          </div>

          {/* 人手不足警告 */}
          {isShortageDay && (
            <div className="flex items-center gap-2 bg-red-50 px-3 py-2 rounded text-sm text-red-700">
              <AlertTriangle className="h-4 w-4" />
              <span>{shortage}人不足</span>
            </div>
          )}

          {dayShifts.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              この日のシフトデータがありません
            </div>
          ) : (
            /* Excel風テーブル */
            <div className="border rounded overflow-hidden">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-muted">
                    <th className="border border-gray-200 px-1 py-1 text-center font-semibold text-muted-foreground w-6">#</th>
                    <th className="border border-gray-200 px-2 py-1 text-left font-semibold text-muted-foreground w-24">配置</th>
                    <th className="border border-gray-200 px-2 py-1 text-center font-semibold text-muted-foreground min-w-[100px]">氏名</th>
                    <th className="border border-gray-200 px-1 py-1 text-left font-semibold text-muted-foreground w-[130px]">時間/記号</th>
                    <th className="border border-gray-200 px-1 py-1 text-center font-semibold text-muted-foreground w-8">状態</th>
                    <th className="border border-gray-200 px-1 py-1 text-center font-semibold text-muted-foreground min-w-[180px]">
                      <div className="flex justify-between text-xxs text-muted-foreground">
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

                      const dutyCodeShortages = locationDutyCodeShortageMap.get(location) || []
                      const shortageCount = dutyCodeShortages.length
                      const totalRows = locationShifts.length + shortageCount

                      const shiftRows = sortedShifts.map((shift, idx) => {
                        globalIndex++
                        const startTime = shift.duty_code.start_time.slice(0, 5)
                        const endTime = shift.duty_code.end_time.slice(0, 5)
                        const isPending = shift.status !== '確定'

                        const startMin = timeToMinutes(shift.duty_code.start_time)
                        const endMin = timeToMinutes(shift.duty_code.end_time)
                        const isOvernight = endMin < startMin

                        const barStart = Math.max(0, (startMin - TIMELINE_START) / (TIMELINE_END - TIMELINE_START) * 100)
                        const barWidth = isOvernight
                          ? (TIMELINE_END - startMin) / (TIMELINE_END - TIMELINE_START) * 100
                          : Math.min(100 - barStart, (endMin - startMin) / (TIMELINE_END - TIMELINE_START) * 100)

                        const overnightBarWidth = isOvernight
                          ? Math.max(0, (endMin - TIMELINE_START) / (TIMELINE_END - TIMELINE_START) * 100)
                          : 0

                        return (
                          <tr key={shift.id} className={isPending ? 'bg-yellow-50' : ''}>
                            <td className="border border-gray-200 px-1 py-1 text-center text-gray-400">
                              {globalIndex}
                            </td>
                            {idx === 0 ? (
                              <td
                                className={`border border-gray-200 px-2 py-1 font-semibold ${colors.headerBg} ${colors.headerText}`}
                                rowSpan={totalRows}
                              >
                                <div className="leading-tight">{location}</div>
                                <div className="font-normal opacity-75 text-xxs">{locationShifts.length}人</div>
                              </td>
                            ) : null}
                            <td className={`border border-gray-200 px-2 py-1 text-center ${colors.rowBg} min-w-[100px]`} title={shift.staff.name}>
                              {shift.staff.name}
                            </td>
                            <td className={`border border-gray-200 px-1 py-1 font-mono text-xxs ${colors.rowBg} w-[130px]`}>
                              {startTime}-{endTime}<span className="text-gray-400">/{shift.duty_code.code}</span>
                            </td>
                            <td className="border border-gray-200 px-1 py-1 text-center">
                              {isPending ? (
                                <span className="text-yellow-600">仮</span>
                              ) : (
                                <span className="text-green-600">確</span>
                              )}
                            </td>
                            <td className="border border-gray-200 px-1 py-1 min-w-[180px]">
                              <div className="h-2.5 bg-gray-100 rounded-sm overflow-hidden w-full relative">
                                {isOvernight && overnightBarWidth > 0 && (
                                  <div
                                    className={`absolute h-full rounded-sm ${isPending ? 'bg-yellow-400' : 'bg-primary/60'}`}
                                    style={{ left: 0, width: `${overnightBarWidth}%` }}
                                  />
                                )}
                                <div
                                  className={`absolute h-full rounded-sm ${isPending ? 'bg-yellow-400' : 'bg-primary/60'}`}
                                  style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        )
                      })

                      const shortageRows: React.ReactNode[] = dutyCodeShortages
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map((shortage, i) => {
                          globalIndex++
                          const sStartTime = shortage.startTime.slice(0, 5)
                          const sEndTime = shortage.endTime.slice(0, 5)
                          const sStartMin = timeToMinutes(shortage.startTime)
                          const sEndMin = timeToMinutes(shortage.endTime)
                          const sIsOvernight = sEndMin < sStartMin
                          const sBarStart = Math.max(0, (sStartMin - TIMELINE_START) / (TIMELINE_END - TIMELINE_START) * 100)
                          const sBarWidth = sIsOvernight
                            ? (TIMELINE_END - sStartMin) / (TIMELINE_END - TIMELINE_START) * 100
                            : Math.min(100 - sBarStart, (sEndMin - sStartMin) / (TIMELINE_END - TIMELINE_START) * 100)
                          const sOvernightBarWidth = sIsOvernight
                            ? Math.max(0, (sEndMin - TIMELINE_START) / (TIMELINE_END - TIMELINE_START) * 100)
                            : 0

                          return (
                            <tr key={`shortage-${location}-${i}`} className="bg-red-50">
                              <td className="border border-gray-200 px-1 py-1 text-center text-red-400">
                                {globalIndex}
                              </td>
                              <td className="border border-gray-200 px-2 py-1 text-red-600">
                                <span className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  要員不足
                                </span>
                              </td>
                              <td className="border border-gray-200 px-1 py-1 font-mono text-xxs text-red-600">
                                {sStartTime}-{sEndTime}<span className="text-red-400">/{shortage.dutyCode}</span>
                              </td>
                              <td className="border border-gray-200 px-1 py-1 text-center text-red-400">-</td>
                              <td className="border border-gray-200 px-1 py-1 min-w-[180px]">
                                <div className="h-2.5 bg-gray-100 rounded-sm overflow-hidden w-full relative">
                                  {sIsOvernight && sOvernightBarWidth > 0 && (
                                    <div
                                      className="absolute h-full rounded-sm bg-red-300 border border-dashed border-red-500"
                                      style={{ left: 0, width: `${sOvernightBarWidth}%` }}
                                    />
                                  )}
                                  <div
                                    className="absolute h-full rounded-sm bg-red-300 border border-dashed border-red-500"
                                    style={{ left: `${sBarStart}%`, width: `${sBarWidth}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          )
                        })

                      return [...shiftRows, ...shortageRows]
                    })
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </DialogContent>

      {/* 応援依頼確認ダイアログ */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>応援依頼を送信しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {format(date, 'M月d日(E)', { locale: ja })} は {shortage}人不足しています。
              <br />
              出勤可能なパートスタッフに応援依頼のプッシュ通知を送信します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSending}>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendReinforcementRequest}
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
    </Dialog>
  )
}
