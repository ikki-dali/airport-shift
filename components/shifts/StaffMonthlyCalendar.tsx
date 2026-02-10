'use client'

import { useMemo } from 'react'
import type { StaffWithShifts } from '@/lib/actions/monthly-shifts'
import { Badge } from '@/components/ui/badge'

interface StaffMonthlyCalendarProps {
  staffWithShifts: StaffWithShifts[]
  yearMonth: string
  daysInMonth: number
  dayOfWeeks: string[]
}

export function StaffMonthlyCalendar({
  staffWithShifts,
  yearMonth,
  daysInMonth,
  dayOfWeeks,
}: StaffMonthlyCalendarProps) {
  // 日付配列を生成
  const days = useMemo(() => {
    return Array.from({ length: daysInMonth }, (_, i) => i + 1)
  }, [daysInMonth])

  // 指定された日付のシフトを取得
  const getShiftForDate = (staffId: string, day: number) => {
    const staff = staffWithShifts.find((s) => s.id === staffId)
    if (!staff) return null

    const [year, month] = yearMonth.split('-')
    const dateStr = `${year}-${month}-${String(day).padStart(2, '0')}`

    return staff.shifts.find((shift) => shift.date === dateStr)
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-max">
        {/* ヘッダー */}
        <div className="flex border-b-2 border-gray-200 bg-gray-50 sticky top-0 z-10">
          {/* スタッフ列ヘッダー */}
          <div className="w-32 flex-shrink-0 border-r-2 border-gray-200 p-2 font-bold">
            社員番号/氏名
          </div>

          {/* 日付ヘッダー */}
          {days.map((day, index) => (
            <div
              key={day}
              className={`w-28 flex-shrink-0 border-r border-gray-200 text-center ${
                dayOfWeeks[index] === '土'
                  ? 'bg-navy-50'
                  : dayOfWeeks[index] === '日'
                    ? 'bg-red-50'
                    : ''
              }`}
            >
              <div className="text-xs text-gray-500">{dayOfWeeks[index]}</div>
              <div className="font-bold">{day}</div>
            </div>
          ))}
        </div>

        {/* スタッフ行 */}
        {staffWithShifts.map((staff) => (
          <div key={staff.id} className="flex border-b border-gray-200 hover:bg-gray-50">
            {/* スタッフ情報 */}
            <div className="w-32 flex-shrink-0 border-r-2 border-gray-200 p-2">
              <div className="font-mono text-xs text-gray-600">{staff.employee_number}</div>
              <div className="font-medium text-sm truncate">{staff.name}</div>
            </div>

            {/* シフトセル */}
            {days.map((day, index) => {
              const shift = getShiftForDate(staff.id, day)
              const isWeekend = dayOfWeeks[index] === '土' || dayOfWeeks[index] === '日'

              return (
                <div
                  key={day}
                  className={`w-28 flex-shrink-0 border-r border-gray-200 p-1 text-xs ${
                    isWeekend ? 'bg-gray-50' : ''
                  }`}
                >
                  {shift ? (
                    <div className="space-y-0.5">
                      {/* 勤務記号 */}
                      <div className="font-mono font-semibold text-xs text-foreground">
                        {shift.duty_codes?.code || '-'}
                      </div>
                      {/* 配属箇所 */}
                      <div className="text-xs text-gray-700 truncate" title={shift.locations?.location_name}>
                        {shift.locations?.code || '-'}
                      </div>
                      {/* ステータス */}
                      {shift.status !== '予定' && (
                        <Badge
                          variant={shift.status === '確定' ? 'default' : 'secondary'}
                          className="text-xs px-1 py-0"
                        >
                          {shift.status}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <div className="text-gray-300 text-center">-</div>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {/* データがない場合 */}
        {staffWithShifts.length === 0 && (
          <div className="text-center py-12 text-gray-500">スタッフデータがありません</div>
        )}
      </div>
    </div>
  )
}
