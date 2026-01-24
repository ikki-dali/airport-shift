'use client'

import { useState, useCallback } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { Location } from '@/lib/actions/locations'
import type { DutyCode } from '@/lib/actions/duty-codes'
import type { Shift } from '@/lib/actions/shifts'
import { MonthSelector } from './MonthSelector'
import { StaffList } from './StaffList'
import { ShiftCalendar } from './ShiftCalendar'
import { DutyCodeDialog } from './DutyCodeDialog'
import { createShift, deleteShift } from '@/lib/actions/shifts'
import { Card } from '@/components/ui/card'
import { validateNewShift, type ConstraintViolation } from '@/lib/validators/shift-validator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { ViewModeSwitcher } from './ViewModeSwitcher'
import { toast } from 'sonner'
import { ShiftListView } from './ShiftListView'
import { ShiftRequestsPanel } from './ShiftRequestsPanel'
import { AutoAssignButton } from './AutoAssignButton'

interface ShiftCreationBoardProps {
  staff: StaffWithRole[]
  locations: Location[]
  dutyCodes: DutyCode[]
  initialShifts: Shift[]
}

interface DragData {
  staffId: string
  locationId: string
  date: string
}

export function ShiftCreationBoard({
  staff,
  locations,
  dutyCodes,
  initialShifts,
}: ShiftCreationBoardProps) {
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>(initialShifts)
  const [activeStaff, setActiveStaff] = useState<StaffWithRole | null>(null)
  const [dutyCodeDialogOpen, setDutyCodeDialogOpen] = useState(false)
  const [pendingDrop, setPendingDrop] = useState<DragData | null>(null)
  const [violations, setViolations] = useState<ConstraintViolation[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // 役職とタグの抽出
  const roleMap = new Map<string, { id: string; name: string }>()
  staff.forEach((s) => {
    if (s.roles && !roleMap.has(s.roles.id)) {
      roleMap.set(s.roles.id, { id: s.roles.id, name: s.roles.name })
    }
  })
  const roles = Array.from(roleMap.values())

  const allTags = Array.from(
    new Set(staff.flatMap((s) => s.tags || []))
  ).sort()

  // 選択月の日付一覧を生成
  const monthStart = startOfMonth(selectedMonth)
  const monthEnd = endOfMonth(selectedMonth)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // ドラッグ開始時
  const handleDragStart = (event: DragStartEvent) => {
    const staffId = event.active.id as string
    const draggedStaff = staff.find((s) => s.id === staffId)
    setActiveStaff(draggedStaff || null)
  }

  // ドラッグ終了時
  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveStaff(null)

    const { active, over } = event
    if (!over) return

    const staffId = active.id as string
    const dropData = over.data.current as { locationId: string; date: string }

    if (!dropData) return

    // 前回の違反表示をクリア
    setViolations([])

    // 勤務記号選択ダイアログを開く
    setPendingDrop({
      staffId,
      locationId: dropData.locationId,
      date: dropData.date,
    })
    setDutyCodeDialogOpen(true)
  }

  // 勤務記号選択後、シフト作成
  const handleDutyCodeSelect = useCallback(
    async (dutyCodeId: string) => {
      if (!pendingDrop) return

      // 制約チェック
      const constraintViolations = await validateNewShift(shifts, {
        staffId: pendingDrop.staffId,
        locationId: pendingDrop.locationId,
        dutyCodeId: dutyCodeId,
        date: pendingDrop.date,
      })

      // エラーレベルの違反がある場合は作成を中止
      const errors = constraintViolations.filter((v) => v.type === 'error')
      if (errors.length > 0) {
        setViolations(constraintViolations)
        setDutyCodeDialogOpen(false)
        setPendingDrop(null)
        return
      }

      // 警告のみの場合は表示するが作成を続行
      if (constraintViolations.length > 0) {
        setViolations(constraintViolations)
      }

      try {
        const newShift = await createShift(
          pendingDrop.staffId,
          pendingDrop.locationId,
          dutyCodeId,
          pendingDrop.date
        )

        setShifts((prev) => [...prev, newShift])
        setViolations([]) // 成功時に違反をクリア
        console.log('シフトを作成しました')
      } catch (error) {
        console.error('Error creating shift:', error)
        toast.error(error instanceof Error ? error.message : 'シフト作成に失敗しました')
      } finally {
        setDutyCodeDialogOpen(false)
        setPendingDrop(null)
      }
    },
    [pendingDrop, shifts]
  )

  // シフト削除
  const handleDeleteShift = useCallback(
    async (shiftId: string) => {
      try {
        await deleteShift(shiftId)
        setShifts((prev) => prev.filter((s) => s.id !== shiftId))
        console.log('シフトを削除しました')
      } catch (error) {
        console.error('Error deleting shift:', error)
        toast.error(error instanceof Error ? error.message : 'シフト削除に失敗しました')
      }
    },
    []
  )

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {/* 月選択と表示モード切り替え */}
        <div className="flex items-center justify-between">
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
          <div className="flex items-center gap-2">
            <AutoAssignButton
              yearMonth={format(selectedMonth, 'yyyy-MM')}
              onAssignmentComplete={() => {
                // シフトリストを再読み込み
                window.location.reload()
              }}
            />
            <ViewModeSwitcher viewMode={viewMode} onViewModeChange={setViewMode} />
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

        {/* メインコンテンツ */}
        <div className="grid grid-cols-12 gap-4">
          {/* 左サイドバー: スタッフリスト */}
          <div className="col-span-3">
            <StaffList staff={staff} roles={roles} allTags={allTags} />
          </div>

          {/* メインエリア: カレンダー or リスト */}
          <div className="col-span-6">
            {viewMode === 'grid' ? (
              <ShiftCalendar
                days={daysInMonth}
                locations={locations}
                shifts={shifts}
                staff={staff}
                dutyCodes={dutyCodes}
                onDeleteShift={handleDeleteShift}
                onDateClick={setSelectedDate}
              />
            ) : (
              <ShiftListView
                shifts={shifts}
                staff={staff}
                locations={locations}
                dutyCodes={dutyCodes}
                daysInMonth={daysInMonth}
                onDeleteShift={handleDeleteShift}
                onDateClick={setSelectedDate}
              />
            )}
          </div>

          {/* 右サイドバー: 希望提出表示 */}
          <div className="col-span-3">
            <ShiftRequestsPanel
              selectedDate={selectedDate}
              staff={staff}
              onClose={() => setSelectedDate(null)}
            />
          </div>
        </div>
      </div>

      {/* ドラッグ中のオーバーレイ */}
      <DragOverlay>
        {activeStaff ? (
          <Card className="p-3 bg-blue-50 border-blue-300 shadow-lg">
            <div className="font-medium text-sm">{activeStaff.name}</div>
            <div className="text-xs text-gray-500">{activeStaff.employee_number}</div>
          </Card>
        ) : null}
      </DragOverlay>

      {/* 勤務記号選択ダイアログ */}
      <DutyCodeDialog
        open={dutyCodeDialogOpen}
        onOpenChange={setDutyCodeDialogOpen}
        dutyCodes={dutyCodes}
        onSelect={handleDutyCodeSelect}
      />
    </DndContext>
  )
}
