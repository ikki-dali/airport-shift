'use client'

import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card } from '@/components/ui/card'

interface ShiftRequest {
  id: string
  staff_id: string
  date: string
  request_type: string
  note: string | null
  staff: {
    id: string
    employee_number: string
    name: string
  }
}

interface RequestsCalendarProps {
  requests: ShiftRequest[]
  yearMonth: string
}

// 希望タイプ別の色
const REQUEST_TYPE_COLORS: Record<string, string> = {
  '◯': 'bg-green-100 text-green-800 border-green-300',
  '休': 'bg-gray-100 text-gray-800 border-gray-300',
  '早朝': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '早番': 'bg-orange-100 text-orange-800 border-orange-300',
  '遅番': 'bg-blue-100 text-blue-800 border-blue-300',
  '夜勤': 'bg-purple-100 text-purple-800 border-purple-300',
}

export function RequestsCalendar({ requests, yearMonth }: RequestsCalendarProps) {
  // 月の最初と最後の日を取得
  const [year, month] = yearMonth.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, month - 1))
  const monthEnd = endOfMonth(new Date(year, month - 1))
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // 日付ごとに希望をグループ化
  const requestsByDate = requests.reduce((acc, req) => {
    if (!acc[req.date]) {
      acc[req.date] = []
    }
    acc[req.date].push(req)
    return acc
  }, {} as Record<string, ShiftRequest[]>)

  // 曜日の色
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
              {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                <th
                  key={i}
                  className={`border-b-2 border-gray-300 p-2 text-xs font-semibold min-w-[150px] ${
                    i === 0 ? 'bg-red-50 text-red-600' :
                    i === 6 ? 'bg-blue-50 text-blue-600' :
                    'bg-gray-50 text-gray-700'
                  }`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.ceil(daysInMonth.length / 7) }, (_, weekIndex) => (
              <tr key={weekIndex}>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const dayNumber = weekIndex * 7 + dayIndex
                  if (dayNumber >= daysInMonth.length) {
                    return <td key={dayIndex} className="border border-gray-200 bg-gray-50" />
                  }

                  const day = daysInMonth[dayNumber]
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayRequests = requestsByDate[dateStr] || []

                  return (
                    <td
                      key={dayIndex}
                      className={`border border-gray-200 p-2 align-top min-h-[120px] ${getDayOfWeekClass(day)}`}
                    >
                      <div className="space-y-1">
                        <div className={`text-sm font-semibold ${getDayOfWeekTextClass(day)}`}>
                          {format(day, 'd')}日
                        </div>

                        <div className="space-y-1">
                          {dayRequests.map((req) => (
                            <div
                              key={req.id}
                              className={`px-2 py-1 rounded text-xs font-medium border ${
                                REQUEST_TYPE_COLORS[req.request_type] || 'bg-gray-100 text-gray-800 border-gray-300'
                              }`}
                            >
                              <div className="flex items-center gap-1">
                                <span className="font-bold">{req.request_type}</span>
                                <span className="truncate">{req.staff.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
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
