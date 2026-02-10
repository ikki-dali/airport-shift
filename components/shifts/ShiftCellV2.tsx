'use client'

import type { Shift } from '@/lib/actions/shifts'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { DutyCode } from '@/lib/actions/duty-codes'
import { X, Plus } from 'lucide-react'
import { getRoleColor } from '@/lib/role-colors'

interface ShiftCellV2Props {
  locationId: string
  locationName: string
  date: string
  shifts: Shift[]
  staff: StaffWithRole[]
  dutyCodes: DutyCode[]
  onDeleteShift: (shiftId: string) => void
  onAddClick: (locationId: string, locationName: string, date: string) => void
}

export function ShiftCellV2({
  locationId,
  locationName,
  date,
  shifts,
  staff,
  dutyCodes,
  onDeleteShift,
  onAddClick,
}: ShiftCellV2Props) {
  return (
    <td className="border border-gray-200 p-1 align-top bg-white hover:bg-gray-50 transition-colors">
      <div className="min-h-[80px] space-y-1">
        {/* 既存のシフト */}
        {shifts.map((shift) => {
          const shiftStaff = staff.find((s) => s.id === shift.staff_id)
          const dutyCode = dutyCodes.find((dc) => dc.id === shift.duty_code_id)

          if (!shiftStaff || !dutyCode) return null

          const roleColor = getRoleColor(shiftStaff.roles?.id)

          return (
            <div
              key={shift.id}
              className={`${roleColor.bg} ${roleColor.border} border rounded px-2 py-1 relative group`}
            >
              {/* 削除ボタン */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteShift(shift.id)
                }}
                className="absolute -top-1.5 -right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <div className="bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm">
                  <X className="h-3 w-3" />
                </div>
              </button>

              {/* スタッフ情報 */}
              <div className={`text-xs font-medium ${roleColor.text}`}>
                {shiftStaff.name}
              </div>

              {/* 勤務記号 */}
              <div className="text-xs text-gray-600 font-mono">
                {dutyCode.code}
              </div>
            </div>
          )
        })}

        {/* 追加ボタン */}
        <button
          onClick={() => onAddClick(locationId, locationName, date)}
          className="w-full border border-dashed border-gray-200 rounded p-2 hover:border-primary hover:bg-primary/5 transition-colors group"
        >
          <div className="flex items-center justify-center gap-1 text-xs text-gray-400 group-hover:text-primary">
            <Plus className="h-3 w-3" />
            <span>追加</span>
          </div>
        </button>
      </div>
    </td>
  )
}
