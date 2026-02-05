'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, User } from 'lucide-react'

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
}

interface TodayTabProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
}

export function TodayTab({ shifts, locationRequirements }: TodayTabProps) {
  const today = new Date()
  const todayStr = format(today, 'yyyy-MM-dd')
  const dayOfWeek = today.getDay()

  // 今日のシフトをフィルタ
  const todayShifts = shifts.filter((s) => s.date === todayStr)

  // 配置箇所×勤務記号ごとにグルーピング
  const slotMap: Record<string, {
    locationId: string
    locationName: string
    dutyCodeId: string
    dutyCode: string
    startTime: string
    endTime: string
    required: number
    assigned: Shift[]
  }> = {}

  // 必要人数を設定
  locationRequirements.forEach((req) => {
    // 曜日指定がある場合はマッチする場合のみ
    if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) return
    // 特定日指定がある場合はマッチする場合のみ
    if (req.specific_date !== null && req.specific_date !== todayStr) return

    const key = `${req.location_id}-${req.duty_code_id}`
    if (!slotMap[key]) {
      slotMap[key] = {
        locationId: req.location_id,
        locationName: '',
        dutyCodeId: req.duty_code_id,
        dutyCode: '',
        startTime: '',
        endTime: '',
        required: 0,
        assigned: [],
      }
    }
    slotMap[key].required += req.required_staff_count
  })

  // シフトを割り当て
  todayShifts.forEach((shift) => {
    const key = `${shift.location.id}-${shift.duty_code.id}`
    if (!slotMap[key]) {
      slotMap[key] = {
        locationId: shift.location.id,
        locationName: shift.location.location_name,
        dutyCodeId: shift.duty_code.id,
        dutyCode: shift.duty_code.code,
        startTime: shift.duty_code.start_time,
        endTime: shift.duty_code.end_time,
        required: 0,
        assigned: [],
      }
    }
    slotMap[key].locationName = shift.location.location_name
    slotMap[key].dutyCode = shift.duty_code.code
    slotMap[key].startTime = shift.duty_code.start_time
    slotMap[key].endTime = shift.duty_code.end_time
    slotMap[key].assigned.push(shift)
  })

  const slots = Object.values(slotMap).filter(
    (slot) => slot.required > 0 || slot.assigned.length > 0
  )

  // 人手不足の枠を先に表示
  const sortedSlots = slots.sort((a, b) => {
    const aShortage = a.assigned.length < a.required
    const bShortage = b.assigned.length < b.required
    if (aShortage && !bShortage) return -1
    if (!aShortage && bShortage) return 1
    return 0
  })

  if (sortedSlots.length === 0) {
    return (
      <Card className="p-8 text-center text-gray-500">
        今日のシフトデータがありません
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        {format(today, 'yyyy年M月d日 (E)', { locale: ja })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedSlots.map((slot) => {
          const isShortage = slot.assigned.length < slot.required
          return (
            <Card
              key={`${slot.locationId}-${slot.dutyCodeId}`}
              className={`p-4 ${
                isShortage ? 'border-red-300 bg-red-50' : ''
              }`}
            >
              {/* ヘッダー */}
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    {slot.locationName || '(未設定)'}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {slot.dutyCode} ({slot.startTime}-{slot.endTime})
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    isShortage
                      ? 'border-red-600 text-red-600'
                      : 'border-green-600 text-green-600'
                  }
                >
                  {slot.assigned.length}/{slot.required}名
                </Badge>
              </div>

              {/* 割り当て済みスタッフ */}
              {slot.assigned.length > 0 ? (
                <div className="space-y-2">
                  {slot.assigned.map((shift) => (
                    <div
                      key={shift.id}
                      className="flex items-center gap-2 rounded bg-white p-2 text-sm"
                    >
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{shift.staff.name}</span>
                      <Badge
                        variant="outline"
                        className={`ml-auto text-xs ${
                          shift.status === '確定'
                            ? 'border-green-600 text-green-600'
                            : 'border-yellow-600 text-yellow-600'
                        }`}
                      >
                        {shift.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-red-600">
                  配置スタッフなし
                </div>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
