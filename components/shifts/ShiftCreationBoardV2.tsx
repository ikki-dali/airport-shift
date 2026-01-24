'use client'

import { useState, useCallback } from 'react'
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { Location } from '@/lib/actions/locations'
import type { DutyCode } from '@/lib/actions/duty-codes'
import type { Shift } from '@/lib/actions/shifts'
import { WeekSelector } from './WeekSelector'
import { ShiftCalendarV2 } from './ShiftCalendarV2'
import { StaffSearchModal } from './StaffSearchModal'
import { AIGenerateButton } from './AIGenerateButton'
import { createShift, deleteShift, getShifts } from '@/lib/actions/shifts'
import { validateNewShift, type ConstraintViolation } from '@/lib/validators/shift-validator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, Calendar } from 'lucide-react'
import { ShiftRequestModal } from './ShiftRequestModal'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ShiftCreationBoardV2Props {
  staff: StaffWithRole[]
  locations: Location[]
  dutyCodes: DutyCode[]
  initialShifts: Shift[]
}

interface PendingAdd {
  locationId: string
  locationName: string
  date: string
}

export function ShiftCreationBoardV2({
  staff,
  locations,
  dutyCodes,
  initialShifts,
}: ShiftCreationBoardV2Props) {
  const [selectedWeek, setSelectedWeek] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>(initialShifts)
  const [staffSearchModalOpen, setStaffSearchModalOpen] = useState(false)
  const [pendingAdd, setPendingAdd] = useState<PendingAdd | null>(null)
  const [violations, setViolations] = useState<ConstraintViolation[]>([])
  const [requestModalOpen, setRequestModalOpen] = useState(false)

  // 選択週の日付一覧を生成（月曜始まり）
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 })
  const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // セルの追加ボタンクリック時
  const handleAddClick = useCallback((locationId: string, locationName: string, date: string) => {
    setPendingAdd({ locationId, locationName, date })
    setStaffSearchModalOpen(true)
  }, [])

  // スタッフと勤務記号選択後、シフト作成
  const handleStaffSelect = useCallback(
    async (staffId: string, dutyCodeId: string) => {
      if (!pendingAdd) return

      // 前回の違反表示をクリア
      setViolations([])

      // 制約チェック
      const constraintViolations = await validateNewShift(shifts, {
        staffId,
        locationId: pendingAdd.locationId,
        dutyCodeId,
        date: pendingAdd.date,
      })

      // エラーレベルの違反がある場合は作成を中止
      const errors = constraintViolations.filter((v) => v.type === 'error')
      if (errors.length > 0) {
        setViolations(constraintViolations)
        return
      }

      // 警告のみの場合は表示するが作成を続行
      if (constraintViolations.length > 0) {
        setViolations(constraintViolations)
      }

      try {
        const newShift = await createShift(
          staffId,
          pendingAdd.locationId,
          dutyCodeId,
          pendingAdd.date
        )

        setShifts((prev) => [...prev, newShift])
        setViolations([]) // 成功時に違反をクリア
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'シフト作成に失敗しました')
      } finally {
        setPendingAdd(null)
      }
    },
    [pendingAdd, shifts]
  )

  // シフト削除
  const handleDeleteShift = useCallback(async (shiftId: string) => {
    try {
      await deleteShift(shiftId)
      setShifts((prev) => prev.filter((s) => s.id !== shiftId))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'シフト削除に失敗しました')
    }
  }, [])

  // AI生成成功後のシフト再読み込み
  const handleAISuccess = useCallback(async () => {
    try {
      const updatedShifts = await getShifts()
      setShifts(updatedShifts)
    } catch {
      // リロード失敗は無視
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* ヘッダー：週選択 */}
      <div className="flex items-center justify-between">
        <WeekSelector selectedWeek={selectedWeek} onWeekChange={setSelectedWeek} />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setRequestModalOpen(true)}
            className="gap-2"
          >
            <Calendar className="h-4 w-4" />
            希望設定
          </Button>
          <AIGenerateButton
            weekStart={weekStart}
            weekEnd={weekEnd}
            staff={staff}
            locations={locations}
            dutyCodes={dutyCodes}
            currentShifts={shifts}
            onSuccess={handleAISuccess}
          />
        </div>
      </div>

      {/* 制約違反の表示 */}
      {violations.length > 0 && (
        <div className="space-y-2">
          {violations.map((violation, index) => (
            <Alert
              key={index}
              variant={violation.type === 'error' ? 'destructive' : 'default'}
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>
                {violation.type === 'error' ? 'エラー' : '警告'}
              </AlertTitle>
              <AlertDescription>{violation.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* メインカレンダー（全画面） */}
      <ShiftCalendarV2
        days={daysInWeek}
        locations={locations}
        shifts={shifts}
        staff={staff}
        dutyCodes={dutyCodes}
        onDeleteShift={handleDeleteShift}
        onAddClick={handleAddClick}
      />

      {/* スタッフ検索モーダル */}
      <StaffSearchModal
        open={staffSearchModalOpen}
        onOpenChange={setStaffSearchModalOpen}
        staff={staff}
        dutyCodes={dutyCodes}
        onSelect={handleStaffSelect}
        locationName={pendingAdd?.locationName}
        date={pendingAdd?.date}
        shifts={shifts}
      />

      {/* 希望設定モーダル */}
      <ShiftRequestModal
        open={requestModalOpen}
        onOpenChange={setRequestModalOpen}
        weekDays={daysInWeek}
        staff={staff}
        onSuccess={handleAISuccess}
      />
    </div>
  )
}
