'use client'

import { useDroppable } from '@dnd-kit/core'
import type { Shift } from '@/lib/actions/shifts'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { DutyCode } from '@/lib/actions/duty-codes'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { parseDutyCode } from '@/lib/duty-code-parser'
import { LocationStatus } from './LocationStatus'

interface ShiftCellProps {
  locationId: string
  locationName: string
  date: string
  shifts: Shift[]
  staff: StaffWithRole[]
  dutyCodes: DutyCode[]
  onDeleteShift: (shiftId: string) => void
  allShifts: Shift[] // 制約チェック用に全シフトを渡す
}

export function ShiftCell({
  locationId,
  locationName,
  date,
  shifts,
  staff,
  dutyCodes,
  onDeleteShift,
  allShifts,
}: ShiftCellProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: `${locationId}-${date}`,
    data: {
      locationId,
      date,
    },
  })

  // 勤務記号ごとにシフトをグルーピング
  const shiftsByDutyCode = shifts.reduce((acc, shift) => {
    const dutyCodeId = shift.duty_code_id
    if (!acc[dutyCodeId]) {
      acc[dutyCodeId] = []
    }
    acc[dutyCodeId].push(shift)
    return acc
  }, {} as Record<string, Shift[]>)

  return (
    <td
      ref={setNodeRef}
      className={`border border-gray-200 p-1 min-h-[120px] align-top transition-colors ${
        isOver ? 'bg-primary/10 border-primary/60' : 'bg-white'
      }`}
    >
      <div className="space-y-2 min-h-[120px]">
        {Object.entries(shiftsByDutyCode).map(([dutyCodeId, dutyShifts]) => {
          const dutyCode = dutyCodes.find((dc) => dc.id === dutyCodeId)
          if (!dutyCode) return null

          const parsed = parseDutyCode(dutyCode.code)

          return (
            <div
              key={dutyCodeId}
              className="bg-gray-50 border border-gray-200 rounded p-2 space-y-2"
            >
              {/* 勤務記号情報 */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Badge variant="outline" className="text-xs font-mono">
                    {dutyCode.code}
                  </Badge>
                  <div className="text-xs text-gray-600">
                    {parsed.startTime} - {parsed.endTime}
                  </div>
                </div>
              </div>

              {/* スタッフリスト */}
              <div className="space-y-1">
                {dutyShifts.map((shift) => {
                  const shiftStaff = staff.find((s) => s.id === shift.staff_id)
                  if (!shiftStaff) return null

                  return (
                    <div
                      key={shift.id}
                      className="bg-white border border-gray-200 rounded px-2 py-1 text-xs relative group hover:bg-gray-50"
                    >
                      <button
                        onClick={() => onDeleteShift(shift.id)}
                        className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="シフトを削除"
                      >
                        <div className="bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600">
                          <X className="h-3 w-3" />
                        </div>
                      </button>

                      <div className="font-medium text-gray-900">
                        {shiftStaff.name}
                      </div>
                      {shiftStaff.roles?.is_responsible && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          責任者
                        </Badge>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* 制約チェック結果 */}
              <div className="pt-1 border-t border-gray-200">
                <LocationStatus
                  shifts={allShifts}
                  locationId={locationId}
                  dutyCodeId={dutyCodeId}
                  date={date}
                  locationName={locationName}
                  dutyCodeName={dutyCode.code}
                />
              </div>
            </div>
          )
        })}

        {shifts.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-[120px] text-xs text-gray-400">
            ドロップして配置
          </div>
        )}

        {isOver && shifts.length === 0 && (
          <div className="flex items-center justify-center h-[120px] text-xs text-primary font-medium">
            ここに配置
          </div>
        )}
      </div>
    </td>
  )
}
