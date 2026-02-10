'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
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
import { Users, AlertTriangle, CalendarDays, X, Loader2 } from 'lucide-react'
import { updateShift } from '@/lib/actions/shifts'
import { sendReinforcementRequest } from '@/lib/actions/notifications'
import type { LocationShortageInfo } from '@/lib/utils/location-shortages'
import { toast } from 'sonner'

// デフォルトの1日あたり必要人数（DB設定が取得できない場合のフォールバック）
const DEFAULT_REQUIRED_STAFF = 43
const DEFAULT_TIMELINE_START_HOUR = 0
const DEFAULT_TIMELINE_END_HOUR = 24

// 配置箇所ごとの色設定（新ロケーション名対応）
const LOCATION_COLORS: Record<string, { rowBg: string; headerBg: string; headerText: string }> = {
  'T3中央': { rowBg: 'bg-primary/5', headerBg: 'bg-primary', headerText: 'text-primary-foreground' },
  'T3北側': { rowBg: 'bg-purple-50', headerBg: 'bg-purple-600', headerText: 'text-white' },
  'T2中央検査場': { rowBg: 'bg-green-50', headerBg: 'bg-green-600', headerText: 'text-white' },
  'T3クリーンバス': { rowBg: 'bg-amber-50', headerBg: 'bg-amber-600', headerText: 'text-white' },
  'T3際際バス': { rowBg: 'bg-teal-50', headerBg: 'bg-teal-600', headerText: 'text-white' },
  'T2クリーンバス': { rowBg: 'bg-cyan-50', headerBg: 'bg-cyan-600', headerText: 'text-white' },
  'T2際際バス': { rowBg: 'bg-indigo-50', headerBg: 'bg-indigo-600', headerText: 'text-white' },
  // 旧名称も残す（互換性）
  '第1ターミナル': { rowBg: 'bg-primary/5', headerBg: 'bg-primary', headerText: 'text-primary-foreground' },
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

// 勤務中かどうかを判定
function isWorking(startTime: string, endTime: string, currentMinutes: number): boolean {
  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)
  const isOvernight = endMin < startMin

  if (isOvernight) {
    // 日またぎ: 開始〜24:00 または 0:00〜終了
    return currentMinutes >= startMin || currentMinutes <= endMin
  } else {
    return currentMinutes >= startMin && currentMinutes <= endMin
  }
}

// 退勤済みかどうかを判定
function isFinished(startTime: string, endTime: string, currentMinutes: number): boolean {
  const startMin = timeToMinutes(startTime)
  const endMin = timeToMinutes(endTime)
  const isOvernight = endMin < startMin

  if (isOvernight) {
    // 日またぎシフト（例: 19:00-04:00）は今日始まって明日終わるため、
    // 今日中に「退勤済み」にはならない
    return false
  }
  // 通常シフト: 終了時間を過ぎていれば退勤済み
  return currentMinutes > endMin
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

interface LocationShortage {
  locationName: string
  required: number
  assigned: number
  shortage: number
}

// 勤務記号ごとの不足情報
interface DutyCodeShortage {
  dutyCodeId: string
  dutyCode: string
  startTime: string
  endTime: string
  required: number
  assigned: number
  shortage: number
}

interface TodayTabProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
  settings?: Record<string, string>
}

export function TodayTab({ shifts, locationRequirements, settings }: TodayTabProps) {
  const router = useRouter()
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const dayOfWeek = today.getDay()

  // 欠勤マーク用state
  const [cancelledShiftIds, setCancelledShiftIds] = useState<Set<string>>(new Set())
  const [absenceTarget, setAbsenceTarget] = useState<{ shiftId: string; staffName: string } | null>(null)
  const [showAbsenceConfirm, setShowAbsenceConfirm] = useState(false)
  const [showReinforcementDialog, setShowReinforcementDialog] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSendingReinforcement, setIsSendingReinforcement] = useState(false)

  // 現在時刻（分）
  const currentMinutes = today.getHours() * 60 + today.getMinutes()

  // 今日のシフトをフィルタ
  const todayShifts = shifts.filter((s) => s.date === todayStr)

  // 今日の必要人数を計算
  const todayRequired = locationRequirements.reduce((sum, req) => {
    if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) return sum
    if (req.specific_date !== null && req.specific_date !== todayStr) return sum
    return sum + req.required_staff_count
  }, 0)

  // 実際の必要人数（設定がなければDB設定値またはデフォルト値）
  const defaultRequiredStaff = settings?.default_required_staff
    ? parseInt(settings.default_required_staff, 10)
    : DEFAULT_REQUIRED_STAFF
  const requiredStaff = todayRequired > 0 ? todayRequired : defaultRequiredStaff

  const totalAssigned = todayShifts.length
  const shortage = requiredStaff - totalAssigned
  const isShortageDay = shortage > 0

  // 勤務中の人数をカウント
  const workingCount = todayShifts.filter((s) =>
    isWorking(s.duty_code.start_time, s.duty_code.end_time, currentMinutes)
  ).length

  // 退勤済みの人数をカウント
  const finishedCount = todayShifts.filter((s) =>
    isFinished(s.duty_code.start_time, s.duty_code.end_time, currentMinutes)
  ).length

  // 配置箇所ごとにグルーピング
  const byLocation: Record<string, Shift[]> = {}
  todayShifts.forEach((shift) => {
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
    // 今日に適用される要件かチェック
    if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) return
    if (req.specific_date !== null && req.specific_date !== todayStr) return
    if (!req.locations) return

    const locationName = req.locations.location_name
    const current = locationRequiredMap.get(locationName) || 0
    locationRequiredMap.set(locationName, current + req.required_staff_count)
  })

  // 配置箇所ごとの不足を計算（シンプルに合計人数で比較）
  const locationShortageMap = new Map<string, LocationShortage>()
  locationRequiredMap.forEach((required, locationName) => {
    const assigned = byLocation[locationName]?.length || 0
    const shortageCount = required - assigned
    if (shortageCount > 0) {
      locationShortageMap.set(locationName, {
        locationName,
        required,
        assigned,
        shortage: shortageCount,
      })
    }
  })

  // 配置箇所・勤務記号ごとの不足を詳細に計算
  const locationDutyCodeShortageMap = new Map<string, DutyCodeShortage[]>()
  locationRequirements.forEach((req) => {
    // 今日に適用される要件かチェック
    if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) return
    if (req.specific_date !== null && req.specific_date !== todayStr) return
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
      // 不足数分だけエントリを追加
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

  // 欠勤ボタン押下 → 確認ダイアログ表示
  const handleAbsenceClick = (shiftId: string, staffName: string) => {
    setAbsenceTarget({ shiftId, staffName })
    setShowAbsenceConfirm(true)
  }

  // 欠勤確定
  const handleAbsenceConfirm = async () => {
    if (!absenceTarget) return
    setIsProcessing(true)
    try {
      // 楽観的更新: 即座にUIに反映
      setCancelledShiftIds((prev) => new Set(prev).add(absenceTarget.shiftId))
      await updateShift(absenceTarget.shiftId, { status: 'キャンセル' })
      toast.success(`${absenceTarget.staffName}さんを欠勤にしました`)
      setShowAbsenceConfirm(false)
      // 不足があれば応援要請ダイアログを表示
      if (shortage >= 0) {
        setShowReinforcementDialog(true)
      }
    } catch {
      // 失敗時は楽観的更新を巻き戻し
      setCancelledShiftIds((prev) => {
        const next = new Set(prev)
        next.delete(absenceTarget.shiftId)
        return next
      })
      toast.error('欠勤処理に失敗しました')
      setShowAbsenceConfirm(false)
    } finally {
      setIsProcessing(false)
    }
  }

  // 応援要請送信
  const handleSendReinforcement = async () => {
    setIsSendingReinforcement(true)
    try {
      // 配置箇所別の不足情報を構築
      const locationShortages: LocationShortageInfo[] = Array.from(locationDutyCodeShortageMap.entries()).map(
        ([locationName, shortages]) => ({
          locationName,
          shortage: locationShortageMap.get(locationName)?.shortage || shortages.length,
          dutyDetails: shortages.map((s) => ({
            dutyCode: s.dutyCode,
            startTime: s.startTime,
            endTime: s.endTime,
            shortage: s.shortage,
          })),
        })
      )
      const result = await sendReinforcementRequest({
        date: todayStr,
        shortage: shortage + cancelledShiftIds.size,
        locationShortages,
      })
      if (result.success) {
        toast.success(`${result.sentCount}人に応援依頼を送信しました`)
      } else {
        toast.error(result.error || '送信に失敗しました')
      }
    } catch {
      toast.error('応援依頼の送信に失敗しました')
    } finally {
      setIsSendingReinforcement(false)
      setShowReinforcementDialog(false)
      router.refresh()
    }
  }

  if (todayShifts.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground">
        今日のシフトデータがありません
      </Card>
    )
  }

  // タイムライン設定（DB設定値またはデフォルト値）
  const timelineStartHour = settings?.timeline_start_hour
    ? parseInt(settings.timeline_start_hour, 10)
    : DEFAULT_TIMELINE_START_HOUR
  const timelineEndHour = settings?.timeline_end_hour
    ? parseInt(settings.timeline_end_hour, 10)
    : DEFAULT_TIMELINE_END_HOUR
  const TIMELINE_START = timelineStartHour * 60
  const TIMELINE_END = timelineEndHour * 60
  // 3時間間隔のタイムライン目盛りを生成
  const TIMELINE_HOURS: number[] = []
  for (let h = timelineStartHour; h <= timelineEndHour; h += 3) {
    TIMELINE_HOURS.push(h)
  }
  if (TIMELINE_HOURS[TIMELINE_HOURS.length - 1] !== timelineEndHour) {
    TIMELINE_HOURS.push(timelineEndHour)
  }

  // 現在時刻の位置（%）- 整数に丸めてハイドレーションエラーを防ぐ
  const currentTimePosition = Math.round(Math.max(0, Math.min(100,
    (currentMinutes - TIMELINE_START) / (TIMELINE_END - TIMELINE_START) * 100
  )))

  return (
    <div className="space-y-2">
      {/* Today ヘッダー + サマリー（1行にまとめ） */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Today</h2>
          <span className="text-sm text-muted-foreground ml-1">
            {format(today, 'M/d(E)', { locale: ja })}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          {isShortageDay && (
            <div className="flex items-center gap-1 text-red-600 font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{shortage}人不足</span>
            </div>
          )}
          <div className={`flex items-center gap-1 font-semibold ${
            isShortageDay ? 'text-red-600' : 'text-green-600'
          }`}>
            <Users className="h-3.5 w-3.5" />
            <span>{totalAssigned}/{requiredStaff}</span>
          </div>
          <span className="text-green-600 font-medium">
            勤務中 {workingCount}人
          </span>
          {finishedCount > 0 && (
            <span className="text-gray-400 font-medium">
              退勤済 {finishedCount}人
            </span>
          )}
        </div>
      </div>

      {/* Excelシフト表風テーブル（コンパクト化＋タイムラインバー） */}
      <Card className="border">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-muted">
              <th className="border border-gray-200 px-1 py-0.5 text-center font-semibold text-muted-foreground w-6">#</th>
              <th className="border border-gray-200 px-1.5 py-0.5 text-left font-semibold text-muted-foreground w-20">配置</th>
              <th className="border border-gray-200 px-1.5 py-0.5 text-center font-semibold text-muted-foreground min-w-[100px]">氏名</th>
              <th className="border border-gray-200 px-1 py-0.5 text-left font-semibold text-muted-foreground w-[130px]">時間/記号</th>
              <th className="border border-gray-200 px-1 py-0.5 text-center font-semibold text-muted-foreground min-w-[200px]">
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

                // この配置箇所の不足詳細（勤務記号ごと）
                const dutyCodeShortages = locationDutyCodeShortageMap.get(location) || []
                const shortageCount = dutyCodeShortages.length
                const totalRows = locationShifts.length + shortageCount

                // 通常のシフト行
                const shiftRows = sortedShifts.map((shift, idx) => {
                  globalIndex++
                  const startTime = shift.duty_code.start_time.slice(0, 5)
                  const endTime = shift.duty_code.end_time.slice(0, 5)
                  const isCancelled = cancelledShiftIds.has(shift.id) || shift.status === 'キャンセル'
                  const isCurrentlyWorking = !isCancelled && isWorking(shift.duty_code.start_time, shift.duty_code.end_time, currentMinutes)
                  const isDone = !isCancelled && isFinished(shift.duty_code.start_time, shift.duty_code.end_time, currentMinutes)

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

                  // 行スタイル: キャンセル=赤取り消し、勤務中=緑背景、退勤済み=グレーアウト
                  const rowClassName = isCancelled
                    ? 'bg-red-50 opacity-60'
                    : isCurrentlyWorking
                      ? 'bg-green-50'
                      : isDone
                        ? 'opacity-50'
                        : ''

                  return (
                    <tr key={shift.id} className={rowClassName}>
                      <td className="border border-gray-200 px-1 py-0.5 text-center text-gray-400">
                        {globalIndex}
                      </td>
                      {idx === 0 ? (
                        <td
                          className={`border border-gray-200 px-1.5 py-0.5 font-semibold ${colors.headerBg} ${colors.headerText}`}
                          rowSpan={totalRows}
                        >
                          <div className="leading-tight">{location}</div>
                          <div className="font-normal opacity-75 text-xxs">{locationShifts.length}人</div>
                        </td>
                      ) : null}
                      <td className={`border border-gray-200 px-1.5 py-0.5 text-center ${isCancelled ? 'bg-red-50' : colors.rowBg} min-w-[100px] group/name`} title={shift.staff.name}>
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 text-red-500">
                            <span className="line-through">{shift.staff.name}</span>
                            <span className="text-xxs font-semibold">欠勤</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 relative">
                            {isCurrentlyWorking && (
                              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
                            )}
                            {shift.staff.name}
                            <button
                              onClick={() => handleAbsenceClick(shift.id, shift.staff.name)}
                              className="absolute -right-0.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-100 text-red-500 items-center justify-center text-xxs hidden group-hover/name:inline-flex hover:bg-red-200 transition-colors"
                              title="欠勤にする"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        )}
                      </td>
                      <td className={`border border-gray-200 px-1 py-0.5 font-mono text-xxs ${colors.rowBg} w-[130px]`}>
                        {startTime}-{endTime}<span className="text-gray-400">/{shift.duty_code.code}</span>
                      </td>
                      <td className="border border-gray-200 px-1 py-0.5 min-w-[200px]">
                        <div className="h-2 bg-gray-100 rounded-sm overflow-visible w-full relative">
                          {/* 現在時刻の縦線 */}
                          <div
                            className="absolute w-px bg-red-500 z-10"
                            style={{ left: `${currentTimePosition}%`, top: '-2px', bottom: '-2px' }}
                          />
                          {/* 日またぎの場合: 左端に翌日分（4:00〜終了時間） */}
                          {isOvernight && overnightBarWidth > 0 && (
                            <div
                              className={`absolute h-full rounded-sm ${isCurrentlyWorking ? 'bg-green-400' : 'bg-primary/60'}`}
                              style={{ left: 0, width: `${overnightBarWidth}%` }}
                            />
                          )}
                          {/* メインバー（通常 or 日またぎの当日分） */}
                          <div
                            className={`absolute h-full rounded-sm ${isCurrentlyWorking ? 'bg-green-400' : 'bg-primary/60'}`}
                            style={{ left: `${barStart}%`, width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  )
                })

                // 不足分の行を追加（勤務記号情報付き）
                const shortageRows: React.ReactNode[] = dutyCodeShortages
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((shortage, i) => {
                    globalIndex++
                    const startTime = shortage.startTime.slice(0, 5)
                    const endTime = shortage.endTime.slice(0, 5)

                    // タイムラインバー計算
                    const startMin = timeToMinutes(shortage.startTime)
                    const endMin = timeToMinutes(shortage.endTime)
                    const isOvernight = endMin < startMin
                    const barStart = Math.max(0, (startMin - TIMELINE_START) / (TIMELINE_END - TIMELINE_START) * 100)
                    const barWidth = isOvernight
                      ? (TIMELINE_END - startMin) / (TIMELINE_END - TIMELINE_START) * 100
                      : Math.min(100 - barStart, (endMin - startMin) / (TIMELINE_END - TIMELINE_START) * 100)
                    const overnightBarWidth = isOvernight
                      ? Math.max(0, (endMin - TIMELINE_START) / (TIMELINE_END - TIMELINE_START) * 100)
                      : 0

                    return (
                      <tr key={`shortage-${location}-${shortage.dutyCodeId}-${i}`} className="bg-red-50">
                        <td className="border border-gray-200 px-1 py-0.5 text-center text-red-400">
                          {globalIndex}
                        </td>
                        <td className="border border-gray-200 px-1.5 py-0.5 text-red-600 min-w-[100px]">
                          <span className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            要員不足
                          </span>
                        </td>
                        <td className="border border-gray-200 px-1 py-0.5 font-mono text-xxs text-red-600 w-[130px]">
                          {startTime}-{endTime}<span className="text-red-400">/{shortage.dutyCode}</span>
                        </td>
                        <td className="border border-gray-200 px-1 py-0.5 min-w-[200px]">
                          <div className="h-2 bg-gray-100 rounded-sm w-full relative overflow-visible">
                            {/* 現在時刻の縦線 */}
                            <div
                              className="absolute w-px bg-red-500 z-10"
                              style={{ left: `${currentTimePosition}%`, top: '-2px', bottom: '-2px' }}
                            />
                            {/* 日またぎの場合 */}
                            {isOvernight && overnightBarWidth > 0 && (
                              <div
                                className="absolute h-full rounded-sm bg-red-300 opacity-60"
                                style={{ left: 0, width: `${overnightBarWidth}%`, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)' }}
                              />
                            )}
                            {/* メインバー（破線風） */}
                            <div
                              className="absolute h-full rounded-sm bg-red-300 opacity-60"
                              style={{ left: `${barStart}%`, width: `${barWidth}%`, backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.5) 2px, rgba(255,255,255,0.5) 4px)' }}
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
      </Card>

      {/* 欠勤確認ダイアログ */}
      <AlertDialog open={showAbsenceConfirm} onOpenChange={setShowAbsenceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>欠勤にしますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {absenceTarget?.staffName}さんを欠勤にします。
              <br />
              この操作はシフトのステータスを「キャンセル」に変更します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>戻る</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAbsenceConfirm}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  処理中...
                </>
              ) : (
                '欠勤にする'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 応援要請ダイアログ */}
      <AlertDialog open={showReinforcementDialog} onOpenChange={setShowReinforcementDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>応援を要請しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              {absenceTarget?.staffName}さんが欠勤になりました。
              <br />
              出勤可能なパートスタッフに応援依頼のプッシュ通知を送信します。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSendingReinforcement}>今はしない</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendReinforcement}
              disabled={isSendingReinforcement}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSendingReinforcement ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  送信中...
                </>
              ) : (
                '要請する'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
