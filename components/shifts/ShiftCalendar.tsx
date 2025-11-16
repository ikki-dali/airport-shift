'use client'

import { format, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Location } from '@/lib/actions/locations'
import type { Shift } from '@/lib/actions/shifts'
import type { Staff } from '@/lib/actions/staff'
import type { DutyCode } from '@/lib/actions/duty-codes'
import { Card } from '@/components/ui/card'
import { ShiftCell } from './ShiftCell'

interface ShiftCalendarProps {
  days: Date[]
  locations: Location[]
  shifts: Shift[]
  staff: Staff[]
  dutyCodes: DutyCode[]
  onDeleteShift: (shiftId: string) => void
  onDateClick?: (date: Date) => void
}

export function ShiftCalendar({
  days,
  locations,
  shifts,
  staff,
  dutyCodes,
  onDeleteShift,
  onDateClick,
}: ShiftCalendarProps) {
  // 日付の曜日を取得（0=日曜）
  const getDayOfWeekClass = (date: Date) => {
    const dayOfWeek = getDay(date)
    if (dayOfWeek === 0) return 'bg-red-50' // 日曜日
    if (dayOfWeek === 6) return 'bg-blue-50' // 土曜日
    return 'bg-white'
  }

  const getDayOfWeekTextClass = (date: Date) => {
    const dayOfWeek = getDay(date)
    if (dayOfWeek === 0) return 'text-red-600' // 日曜日
    if (dayOfWeek === 6) return 'text-blue-600' // 土曜日
    return 'text-gray-700'
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-max">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-gray-50 border-b-2 border-gray-300 p-2 text-xs font-semibold text-gray-700 min-w-[120px]">
                配属箇所
              </th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className={`border-b-2 border-gray-300 p-2 text-xs font-semibold min-w-[120px] ${getDayOfWeekClass(
                    day
                  )} ${onDateClick ? 'cursor-pointer hover:bg-blue-100 transition-colors' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDateClick?.(day)
                  }}
                >
                  <div className={getDayOfWeekTextClass(day)}>
                    <div>{format(day, 'M/d', { locale: ja })}</div>
                    <div className="text-xs font-normal">
                      {format(day, 'E', { locale: ja })}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id} className="border-b border-gray-200">
                <td className="sticky left-0 z-10 bg-gray-50 border-r border-gray-300 p-2 font-medium text-sm">
                  <div>{location.location_name}</div>
                  <div className="text-xs text-gray-500">{location.code}</div>
                </td>
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayShifts = shifts.filter(
                    (s) => s.location_id === location.id && s.date === dateStr
                  )

                  return (
                    <ShiftCell
                      key={`${location.id}-${dateStr}`}
                      locationId={location.id}
                      locationName={location.location_name}
                      date={dateStr}
                      shifts={dayShifts}
                      staff={staff}
                      dutyCodes={dutyCodes}
                      onDeleteShift={onDeleteShift}
                      allShifts={shifts}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
