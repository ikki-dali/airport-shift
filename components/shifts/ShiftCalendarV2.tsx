'use client'

import { format, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Location } from '@/lib/actions/locations'
import type { Shift } from '@/lib/actions/shifts'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { DutyCode } from '@/lib/actions/duty-codes'
import { Card } from '@/components/ui/card'
import { ShiftCellV2 } from './ShiftCellV2'

interface ShiftCalendarV2Props {
  days: Date[] // 週の7日間
  locations: Location[]
  shifts: Shift[]
  staff: StaffWithRole[]
  dutyCodes: DutyCode[]
  onDeleteShift: (shiftId: string) => void
  onAddClick: (locationId: string, locationName: string, date: string) => void
}

export function ShiftCalendarV2({
  days,
  locations,
  shifts,
  staff,
  dutyCodes,
  onDeleteShift,
  onAddClick,
}: ShiftCalendarV2Props) {
  // 日付の曜日を取得（0=日曜）
  const getDayOfWeekClass = (date: Date) => {
    const dayOfWeek = getDay(date)
    if (dayOfWeek === 0) return 'bg-red-50' // 日曜日
    if (dayOfWeek === 6) return 'bg-navy-50' // 土曜日
    return 'bg-white'
  }

  const getDayOfWeekTextClass = (date: Date) => {
    const dayOfWeek = getDay(date)
    if (dayOfWeek === 0) return 'text-red-600' // 日曜日
    if (dayOfWeek === 6) return 'text-navy-600' // 土曜日
    return 'text-gray-700'
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-gray-100 border-b-2 border-gray-200 p-3 text-sm font-semibold text-gray-700 w-32">
                配属箇所
              </th>
              {days.map((day) => (
                <th
                  key={day.toISOString()}
                  className={`border-b-2 border-gray-200 p-3 text-sm font-semibold w-40 ${getDayOfWeekClass(
                    day
                  )}`}
                >
                  <div className={getDayOfWeekTextClass(day)}>
                    <div className="text-base">{format(day, 'M/d', { locale: ja })}</div>
                    <div className="text-xs font-normal">
                      {format(day, 'EEEE', { locale: ja })}
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {locations.map((location) => (
              <tr key={location.id} className="border-b border-gray-200">
                <td className="sticky left-0 z-10 bg-gray-50 border-r border-gray-200 p-3 font-medium text-sm">
                  <div className="text-gray-900">{location.location_name}</div>
                  <div className="text-xs text-gray-500 font-mono">{location.code}</div>
                </td>
                {days.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayShifts = shifts.filter(
                    (s) => s.location_id === location.id && s.date === dateStr
                  )

                  return (
                    <ShiftCellV2
                      key={`${location.id}-${dateStr}`}
                      locationId={location.id}
                      locationName={location.location_name}
                      date={dateStr}
                      shifts={dayShifts}
                      staff={staff}
                      dutyCodes={dutyCodes}
                      onDeleteShift={onDeleteShift}
                      onAddClick={onAddClick}
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
