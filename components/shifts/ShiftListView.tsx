'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Shift } from '@/lib/actions/shifts'
import type { Staff } from '@/lib/actions/staff'
import type { Location } from '@/lib/actions/locations'
import type { DutyCode } from '@/lib/actions/duty-codes'

interface ShiftListViewProps {
  shifts: Shift[]
  staff: Staff[]
  locations: Location[]
  dutyCodes: DutyCode[]
  daysInMonth: Date[]
  onDeleteShift: (shiftId: string) => void
  onDateClick?: (date: Date) => void
}

export function ShiftListView({
  shifts,
  staff,
  locations,
  dutyCodes,
  daysInMonth,
  onDeleteShift,
  onDateClick,
}: ShiftListViewProps) {
  // 日付ごとにシフトをグループ化
  const shiftsByDate = daysInMonth.map((date) => {
    const dateStr = format(date, 'yyyy-MM-dd')
    const dayShifts = shifts.filter((s) => s.date === dateStr)

    // 配属箇所でグループ化
    const byLocation = dayShifts.reduce(
      (acc, shift) => {
        const locationId = shift.location_id
        if (!acc[locationId]) acc[locationId] = []
        acc[locationId].push(shift)
        return acc
      },
      {} as Record<string, Shift[]>
    )

    return {
      date,
      dateStr,
      shifts: dayShifts,
      byLocation,
    }
  })

  return (
    <div className="space-y-4">
      {shiftsByDate.map(({ date, dateStr, shifts: dayShifts, byLocation }) => {
        if (dayShifts.length === 0) return null

        return (
          <div key={dateStr} className="rounded-lg border border-gray-200 bg-white">
            {/* 日付ヘッダー */}
            <div
              className={`border-b border-gray-200 bg-gray-50 px-4 py-3 ${onDateClick ? 'cursor-pointer hover:bg-blue-50 transition-colors' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                onDateClick?.(date)
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold">
                    {format(date, 'M月d日', { locale: ja })}
                  </span>
                  <span className="ml-2 text-sm text-gray-600">
                    ({format(date, 'EEEE', { locale: ja })})
                  </span>
                </div>
                <div className="text-sm text-gray-600">{dayShifts.length}件のシフト</div>
              </div>
            </div>

            {/* 配属箇所ごとの表示 */}
            <div className="divide-y divide-gray-100">
              {Object.entries(byLocation).map(([locationId, locationShifts]) => {
                const location = locations.find((l) => l.id === locationId)
                if (!location) return null

                // 勤務記号でグループ化
                const byDutyCode = locationShifts.reduce(
                  (acc, shift) => {
                    const dutyCodeId = shift.duty_code_id
                    if (!acc[dutyCodeId]) acc[dutyCodeId] = []
                    acc[dutyCodeId].push(shift)
                    return acc
                  },
                  {} as Record<string, Shift[]>
                )

                return (
                  <div key={locationId} className="p-4">
                    <div className="mb-3 font-medium text-gray-900">
                      {location.location_name}
                      <span className="ml-2 text-xs text-gray-500">{location.code}</span>
                    </div>

                    <div className="space-y-3">
                      {Object.entries(byDutyCode).map(([dutyCodeId, dutyShifts]) => {
                        const dutyCode = dutyCodes.find((d) => d.id === dutyCodeId)
                        if (!dutyCode) return null

                        return (
                          <div
                            key={dutyCodeId}
                            className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-medium text-gray-900">
                                  {dutyCode.code}
                                </span>
                                <span className="text-xs text-gray-600">
                                  {dutyCode.start_time} - {dutyCode.end_time}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({dutyCode.duration_hours}h{dutyCode.duration_minutes}m)
                                </span>
                              </div>
                              <span className="text-xs font-medium text-gray-600">
                                {dutyShifts.length}名
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {dutyShifts.map((shift) => {
                                const staffMember = staff.find((s) => s.id === shift.staff_id)
                                if (!staffMember) return null

                                const isResponsible = staffMember.roles?.is_responsible

                                return (
                                  <div
                                    key={shift.id}
                                    className="group relative inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                                  >
                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                      {staffMember.name.charAt(0)}
                                    </div>
                                    <span className="font-medium">{staffMember.name}</span>
                                    {isResponsible && (
                                      <span className="inline-flex items-center rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-800">
                                        責任者
                                      </span>
                                    )}
                                    <button
                                      onClick={() => onDeleteShift(shift.id)}
                                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                                    >
                                      <svg
                                        className="h-4 w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"
                                        />
                                      </svg>
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
