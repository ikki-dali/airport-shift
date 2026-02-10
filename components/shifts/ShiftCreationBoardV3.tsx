'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays, startOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
  DragEndEvent,
  DragStartEvent,
} from '@dnd-kit/core'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { Location } from '@/lib/actions/locations'
import type { DutyCode } from '@/lib/actions/duty-codes'
import type { Shift } from '@/lib/actions/shifts'
import type { ShiftRequestWithStaff } from '@/lib/actions/shift-requests'
import { AIGenerateButton } from './AIGenerateButton'
import { AssignmentPreview } from './AssignmentPreview'
import { StaffSelectorModal } from './StaffSelectorModal'
import { DeleteShiftModal } from './DeleteShiftModal'
import { DraggableSlot } from './DraggableSlot'
import { ShiftRequestsPanel } from './ShiftRequestsPanel'
import { ShiftProgressBanner } from './ShiftProgressBanner'
import { ConfirmMonthDialog } from './ConfirmMonthDialog'
import { deleteShift, deleteStaffShiftsByDateRange, updateShift, getStaffShiftByDate, confirmMonthShifts } from '@/lib/actions/shifts'
import { previewAutoAssign } from '@/lib/actions/auto-assign'
import type { OptimizationResult } from '@/lib/ai/shift-optimizer'
import { toast } from 'sonner'

interface ShiftCreationBoardV3Props {
  staff: StaffWithRole[]
  locations: Location[]
  dutyCodes: DutyCode[]
  shifts: Shift[]
  locationRequirements: any[]
  shiftRequests: ShiftRequestWithStaff[]
}

interface SlotData {
  shiftId?: string
  staffId?: string
  staffName?: string
  dutyCodeDisplay?: string
  isEmpty: boolean
}

export function ShiftCreationBoardV3({
  staff,
  locations,
  dutyCodes,
  shifts,
  locationRequirements,
  shiftRequests,
}: ShiftCreationBoardV3Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1) // 月の初日
  })

  const [requestsPanelOpen, setRequestsPanelOpen] = useState(false)
  const [staffSelectorOpen, setStaffSelectorOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{
    date: string
    locationId: string
    locationName: string
    dutyCodeId: string
    dutyCodeDisplay: string
    currentShiftId?: string
    currentStaffId?: string
  } | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [shiftToDelete, setShiftToDelete] = useState<{
    shiftId: string
    staffId: string
    staffName: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeShift, setActiveShift] = useState<{
    shiftId: string
    staffName: string
  } | null>(null)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [isReoptimizing, setIsReoptimizing] = useState(false)
  const [reoptimizePreview, setReoptimizePreview] = useState<(OptimizationResult & { warnings: string[]; conflicts: any[] }) | null>(null)
  const [showReoptimizePreview, setShowReoptimizePreview] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px移動したらドラッグ開始
      },
    })
  )

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  const handleDeleteShift = async (
    shiftId: string,
    staffId: string,
    staffName: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation() // スロットのクリックイベントを防ぐ
    setShiftToDelete({ shiftId, staffId, staffName })
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async (deleteAllWeek: boolean) => {
    if (!shiftToDelete) return

    setIsDeleting(true)
    try {
      if (deleteAllWeek) {
        // 期間全体のシフトを削除
        const result = await deleteStaffShiftsByDateRange(
          shiftToDelete.staffId,
          periodStartDate,
          periodEndDate
        )
        toast.success(`${result.deletedCount}件のシフトを削除しました`)
      } else {
        // 単一のシフトを削除
        await deleteShift(shiftToDelete.shiftId)
        toast.success('シフトを削除しました')
      }
      handleRefresh()
      setDeleteModalOpen(false)
      setShiftToDelete(null)
    } catch {
      toast.error('シフトの削除に失敗しました')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenStaffSelector = (
    date: string,
    locationId: string,
    locationName: string,
    dutyCodeId: string,
    dutyCodeDisplay: string,
    currentShiftId?: string,
    currentStaffId?: string
  ) => {
    setSelectedSlot({
      date,
      locationId,
      locationName,
      dutyCodeId,
      dutyCodeDisplay,
      currentShiftId,
      currentStaffId,
    })
    setStaffSelectorOpen(true)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const data = active.data.current
    if (data?.shift) {
      setActiveShift({
        shiftId: data.shift.shiftId,
        staffName: data.shift.staffName,
      })
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveShift(null)

    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData?.shift || !overData?.slot) return

    const shiftId = activeData.shift.shiftId
    const staffId = activeData.shift.staffId
    const newDate = overData.slot.date
    const newLocationId = overData.slot.locationId
    const newDutyCodeId = overData.slot.dutyCodeId

    try {
      // 移動先の日に既にこのスタッフのシフトが存在するかチェック
      const existingShift = await getStaffShiftByDate(staffId, newDate)

      // 既存のシフトがあり、それが移動しようとしているシフト自身でない場合はエラー
      if (existingShift && existingShift.id !== shiftId) {
        toast.error('このスタッフは移動先の日に既にシフトが入っています')
        return
      }

      await updateShift(shiftId, {
        date: newDate,
        location_id: newLocationId,
        duty_code_id: newDutyCodeId,
      })
      toast.success('シフトを移動しました')
      handleRefresh()
    } catch {
      toast.error('シフトの移動に失敗しました')
    }
  }

  const handleConfirmMonth = async () => {
    try {
      const ym = format(currentMonth, 'yyyy-MM')
      await confirmMonthShifts(ym)
      toast.success('シフトを確定しました')
      handleRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'シフトの確定に失敗しました')
    }
  }

  const handleReoptimize = async () => {
    setIsReoptimizing(true)
    try {
      const ym = format(currentMonth, 'yyyy-MM')
      const result = await previewAutoAssign({
        yearMonth: ym,
        overwriteExisting: false,
      })
      setReoptimizePreview(result)
      setShowReoptimizePreview(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '再最適化に失敗しました')
    } finally {
      setIsReoptimizing(false)
    }
  }

  const handleReoptimizeComplete = () => {
    setShowReoptimizePreview(false)
    setReoptimizePreview(null)
    handleRefresh()
  }

  // 月の全日付を生成（その月の日数分）
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()
  
  const displayDays = Array.from({ length: daysInMonth }, (_, i) =>
    addDays(currentMonth, i)
  )

  const periodStartDate = format(currentMonth, 'yyyy-MM-dd')
  const periodEndDate = format(addDays(currentMonth, daysInMonth - 1), 'yyyy-MM-dd')

  // その期間のシフトをフィルタ
  const periodShifts = shifts.filter(
    (s) => s.date >= periodStartDate && s.date <= periodEndDate
  )

  // その期間のシフト希望をフィルタ
  const periodRequests = shiftRequests.filter(
    (r) => r.date >= periodStartDate && r.date <= periodEndDate
  )

  // 月を移動
  const goToPreviousMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToCurrentMonth = () => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
  }

  // テーブル行用のデータを構造化（フラット化）
  interface TableRow {
    locationId: string
    locationName: string
    locationCode: string
    dutyCodeId: string
    dutyCode: string
    dutyCodeDisplay: string
    requiredCount: number
    slots: Record<string, SlotData[]>
  }

  const tableRows: TableRow[] = []

  locations.forEach((location) => {
    // この配置箇所の要件を取得
    const requirements = locationRequirements.filter(
      (r) => r.location_id === location.id
    )

    // 勤務記号ごとに行を作成
    requirements.forEach((req) => {
      const dutyCode = dutyCodes.find((dc) => dc.id === req.duty_code_id)
      const requiredCount = req.required_staff_count

      // 日付ごとのスロットを作成
      const slots: Record<string, SlotData[]> = {}

      displayDays.forEach((day) => {
        const dateStr = format(day, 'yyyy-MM-dd')

        // その日・その配置箇所・その勤務記号のシフトを取得
        const dayShifts = periodShifts.filter(
          (s) =>
            s.date === dateStr &&
            s.location_id === location.id &&
            s.duty_code_id === req.duty_code_id
        )

        // 必要人数分のスロットを作成
        const daySlots: SlotData[] = []

        // 割り当て済みスタッフをスロットに配置
        dayShifts.forEach((shift) => {
          const staffMember = staff.find((st) => st.id === shift.staff_id)
          daySlots.push({
            shiftId: shift.id,
            staffId: shift.staff_id,
            staffName: staffMember?.name || '不明',
            dutyCodeDisplay: dutyCode?.code || '',
            isEmpty: false,
          })
        })

        // 不足分を空きスロットで埋める
        while (daySlots.length < requiredCount) {
          daySlots.push({ isEmpty: true })
        }

        slots[dateStr] = daySlots
      })

      tableRows.push({
        locationId: location.id,
        locationName: location.location_name,
        locationCode: location.code,
        dutyCodeId: req.duty_code_id,
        dutyCode: dutyCode?.code || '不明',
        dutyCodeDisplay: `${dutyCode?.code} (${dutyCode?.start_time}-${dutyCode?.end_time})`,
        requiredCount,
        slots,
      })
    })
  })

  // 必要スロット総数を計算
  const totalRequiredSlots = tableRows.reduce(
    (sum, row) => sum + row.requiredCount * displayDays.length,
    0
  )

  // スタッフ×日付の希望マップを作成（quality判定用）
  const requestMap = new Map<string, string>()
  periodRequests.forEach((r) => {
    requestMap.set(`${r.staff_id}_${r.date}`, r.request_type)
  })

  // スロットのquality判定
  const getSlotQuality = (
    staffId: string | undefined,
    date: string,
    isEmpty: boolean
  ): 'good' | 'warning' | 'unfilled' | undefined => {
    if (isEmpty) return 'unfilled'
    if (!staffId) return undefined
    const key = `${staffId}_${date}`
    const requestType = requestMap.get(key)
    if (requestType === '休') return 'warning'
    if (requestType === '◯') return 'good'
    return undefined
  }

  return (
    <DndContext
      id="shift-creation-board"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
      {/* サマリーバナー */}
      <ShiftProgressBanner
        currentMonth={currentMonth}
        shifts={periodShifts}
        shiftRequests={periodRequests}
        totalRequiredSlots={totalRequiredSlots}
        onReoptimize={handleReoptimize}
        onConfirm={() => setConfirmDialogOpen(true)}
        isReoptimizing={isReoptimizing}
      />

      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold">
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </div>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToCurrentMonth}>
            今月
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={requestsPanelOpen ? 'default' : 'outline'}
            onClick={() => setRequestsPanelOpen(!requestsPanelOpen)}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            希望一覧
          </Button>
          <a
            href={`/shifts/requests?month=${format(currentMonth, 'yyyy-MM')}`}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Calendar className="h-4 w-4" />
            希望設定
          </a>

          <AIGenerateButton
            weekStart={new Date(periodStartDate)}
            weekEnd={new Date(periodEndDate)}
            staff={staff}
            locations={locations}
            dutyCodes={dutyCodes}
            currentShifts={shifts}
            onSuccess={handleRefresh}
          />
        </div>
      </div>

      {/* カレンダー表示 */}
      <Card className="overflow-x-auto">
        <div className="min-w-max">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-3 text-left font-semibold bg-muted border-r sticky left-0 z-20 min-w-[100px]">
                  配属箇所
                </th>
                <th className="px-3 py-3 text-left font-semibold bg-muted border-r sticky left-[100px] z-20 min-w-[100px]">
                  勤務記号
                </th>
                {displayDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayOfWeek = format(day, 'E', { locale: ja })
                  const isWeekend = dayOfWeek === '土' || dayOfWeek === '日'

                  // その日の全行の充足率を計算
                  let dayRequired = 0
                  let dayFilled = 0
                  tableRows.forEach((row) => {
                    const slots = row.slots[dateStr] || []
                    dayRequired += row.requiredCount
                    dayFilled += slots.filter((s) => !s.isEmpty).length
                  })
                  const dayFillRate = dayRequired > 0 ? Math.round((dayFilled / dayRequired) * 100) : 100

                  return (
                    <th
                      key={dateStr}
                      className={`px-3 py-3 text-center font-semibold border-r min-w-[120px] ${
                        isWeekend ? 'bg-navy-50' : 'bg-muted/50'
                      }`}
                    >
                      <div className={`text-sm ${isWeekend ? 'text-navy-600' : ''}`}>
                        {format(day, 'M/d', { locale: ja })} {dayOfWeek}
                      </div>
                      <div className={`text-xs font-bold mt-0.5 ${
                        dayFillRate === 100 ? 'text-green-600' :
                        dayFillRate >= 80 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {dayFillRate}%
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    配置箇所の要件が設定されていません
                  </td>
                </tr>
              ) : (
                tableRows.map((row, index) => {
                  // 同じ配属箇所が連続する行数を計算
                  let rowspan = 1
                  let isFirstRowOfLocation = true

                  if (index > 0 && tableRows[index - 1].locationId === row.locationId) {
                    // 前の行と同じ配属箇所なら、配属箇所セルをスキップ
                    isFirstRowOfLocation = false
                  } else {
                    // 最初の行なら、この配属箇所が何行続くかカウント
                    for (let i = index + 1; i < tableRows.length; i++) {
                      if (tableRows[i].locationId === row.locationId) {
                        rowspan++
                      } else {
                        break
                      }
                    }
                  }

                  return (
                    <tr key={`${row.locationId}-${row.dutyCodeId}-${index}`} className="border-b hover:bg-muted/30 transition-colors">
                      {isFirstRowOfLocation ? (
                        <td
                          rowSpan={rowspan}
                          className="px-3 py-3 border-r font-medium bg-background sticky left-0 z-10 min-w-[100px]"
                        >
                          <div className="text-sm">{row.locationName}</div>
                          <div className="text-xs text-muted-foreground">{row.locationCode}</div>
                        </td>
                      ) : null}
                      <td className="px-3 py-3 border-r bg-background sticky left-[100px] z-10 min-w-[100px]">
                      <div className="text-sm font-medium">{row.dutyCode}</div>
                      <div className="text-xs text-muted-foreground">
                        {row.requiredCount}人必要
                      </div>
                    </td>
                    {displayDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const daySlots = row.slots[dateStr] || []
                      const filledCount = daySlots.filter((s) => !s.isEmpty).length
                      const fillRate =
                        row.requiredCount > 0
                          ? (filledCount / row.requiredCount) * 100
                          : 0

                      return (
                        <td
                          key={dateStr}
                          className="px-2 py-2 border-r align-top"
                        >
                          <div className="space-y-1">
                            {/* スロット */}
                            {daySlots.map((slot, slotIndex) => {
                              const slotId = `${row.locationId}-${row.dutyCodeId}-${dateStr}-${slotIndex}`
                              return (
                                <DraggableSlot
                                  key={slotIndex}
                                  id={slotId}
                                  slot={slot}
                                  slotData={{
                                    date: dateStr,
                                    locationId: row.locationId,
                                    dutyCodeId: row.dutyCodeId,
                                  }}
                                  quality={getSlotQuality(slot.staffId, dateStr, slot.isEmpty)}
                                  onClick={() => {
                                    handleOpenStaffSelector(
                                      dateStr,
                                      row.locationId,
                                      row.locationName,
                                      row.dutyCodeId,
                                      row.dutyCodeDisplay,
                                      slot.shiftId,
                                      slot.staffId
                                    )
                                  }}
                                  onDelete={
                                    !slot.isEmpty && slot.shiftId && slot.staffId
                                      ? (e) =>
                                          handleDeleteShift(
                                            slot.shiftId!,
                                            slot.staffId!,
                                            slot.staffName || '不明',
                                            e
                                          )
                                      : undefined
                                  }
                                />
                              )
                            })}
                            {fillRate < 100 && (
                              <div className="text-center pt-1">
                                <span className="text-xs font-semibold text-red-600">
                                  {fillRate.toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* スタッフ選択モーダル */}
      {selectedSlot && (
        <StaffSelectorModal
          open={staffSelectorOpen}
          onOpenChange={setStaffSelectorOpen}
          staff={staff}
          date={selectedSlot.date}
          locationId={selectedSlot.locationId}
          locationName={selectedSlot.locationName}
          dutyCodeId={selectedSlot.dutyCodeId}
          dutyCodeDisplay={selectedSlot.dutyCodeDisplay}
          currentShiftId={selectedSlot.currentShiftId}
          currentStaffId={selectedSlot.currentStaffId}
          existingShiftIds={
            periodShifts
              .filter((s) => s.date === selectedSlot.date)
              .map((s) => s.staff_id)
          }
          shiftRequests={shiftRequests.filter((r) => r.date === selectedSlot.date)}
          onSuccess={handleRefresh}
        />
      )}

      {/* シフト希望一覧パネル */}
      <ShiftRequestsPanel
        open={requestsPanelOpen}
        onOpenChange={setRequestsPanelOpen}
        shiftRequests={periodRequests}
        staff={staff}
        displayDays={displayDays}
      />

      {/* 削除確認モーダル */}
      {shiftToDelete && (
        <DeleteShiftModal
          open={deleteModalOpen}
          onOpenChange={setDeleteModalOpen}
          staffName={shiftToDelete.staffName}
          onConfirm={handleConfirmDelete}
          isSubmitting={isDeleting}
        />
      )}

      {/* 確定確認ダイアログ */}
      <ConfirmMonthDialog
        open={confirmDialogOpen}
        onOpenChange={setConfirmDialogOpen}
        pendingCount={periodShifts.filter((s) => s.status === '予定').length}
        yearMonth={format(currentMonth, 'yyyy-MM')}
        onConfirm={handleConfirmMonth}
      />

      {/* 再最適化プレビュー */}
      {showReoptimizePreview && reoptimizePreview && (
        <AssignmentPreview
          yearMonth={format(currentMonth, 'yyyy-MM')}
          result={reoptimizePreview}
          onClose={() => {
            setShowReoptimizePreview(false)
            setReoptimizePreview(null)
          }}
          onConfirm={handleReoptimizeComplete}
        />
      )}

      {/* ドラッグオーバーレイ */}
      <DragOverlay>
        {activeShift ? (
          <div className="px-2 py-1.5 rounded text-xs text-center font-medium bg-primary/10 border border-primary shadow-lg">
            {activeShift.staffName}
          </div>
        ) : null}
      </DragOverlay>
    </div>
    </DndContext>
  )
}
