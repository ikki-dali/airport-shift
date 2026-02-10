'use client'

import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'
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
  } | null
}

interface RequestsTableProps {
  requests: ShiftRequest[]
  yearMonth: string
}

// 希望タイプ別の色
const REQUEST_TYPE_COLORS: Record<string, string> = {
  '◯': 'bg-green-100 text-green-800',
  '休': 'bg-gray-100 text-gray-800',
  '早朝': 'bg-yellow-100 text-yellow-800',
  '早番': 'bg-orange-100 text-orange-800',
  '遅番': 'bg-primary/10 text-primary',
  '夜勤': 'bg-purple-100 text-purple-800',
}

export function RequestsTable({ requests, yearMonth }: RequestsTableProps) {
  // 月の日付一覧を取得
  const [year, month] = yearMonth.split('-').map(Number)
  const monthStart = startOfMonth(new Date(year, month - 1))
  const monthEnd = endOfMonth(new Date(year, month - 1))
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // スタッフごと・日付ごとに希望をマトリックス化
  const staffRequestsMap = requests.reduce((acc, req) => {
    const staffId = req.staff_id
    if (!acc[staffId]) {
      acc[staffId] = {
        staff: req.staff,
        requests: {},
      }
    }
    acc[staffId].requests[req.date] = req.request_type
    return acc
  }, {} as Record<string, { staff: ShiftRequest['staff']; requests: Record<string, string> }>)

  const staffList = Object.values(staffRequestsMap)

  if (staffList.length === 0) {
    return (
      <Card className="p-12 text-center">
        <div className="text-muted-foreground text-sm">
          フィルター条件に一致する希望データがありません
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-muted/50 border-b border-border p-2 text-xs font-medium text-muted-foreground tracking-wide min-w-[120px]">
                スタッフ
              </th>
              {daysInMonth.map((day) => (
                <th
                  key={day.toISOString()}
                  className="border-b border-border p-2 text-xs font-medium text-muted-foreground tracking-wide bg-muted/50 min-w-[60px]"
                >
                  {format(day, 'd')}日
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffList.map(({ staff, requests }) => (
              <tr key={staff?.id || 'unknown'} className="border-b border-border">
                <td className="sticky left-0 z-10 bg-card border-r border-border p-2 font-medium text-sm">
                  <div>{staff?.name || '不明'}</div>
                  <div className="text-xs text-muted-foreground">{staff?.employee_number || ''}</div>
                </td>
                {daysInMonth.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const requestType = requests[dateStr]

                  return (
                    <td
                      key={dateStr}
                      className="border border-border p-1 text-center"
                    >
                      {requestType && (
                        <div
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            REQUEST_TYPE_COLORS[requestType] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {requestType}
                        </div>
                      )}
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
