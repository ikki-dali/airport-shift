'use client'

import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'

interface ShiftWithDetails {
  id: string
  date: string
  status: '予定' | '確定' | '変更' | 'キャンセル'
  note: string | null
  created_at: string
  updated_at: string
  staff: {
    id: string
    employee_number: string
    name: string
    roles: {
      id: string
      name: string
      is_responsible: boolean
    } | null
  }
  location: {
    id: string
    business_type: string
    location_name: string
    code: string
  }
  duty_code: {
    id: string
    code: string
    start_time: string
    end_time: string
    duration_hours: number
    duration_minutes: number
    category: string
  }
}

interface ShiftListTableProps {
  shifts: ShiftWithDetails[]
  onDelete: (shiftId: string) => void
}

export function ShiftListTable({
  shifts,
  onDelete,
}: ShiftListTableProps) {
  return (
    <div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse bg-card text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-3 text-left font-medium">日付</th>
              <th className="p-3 text-left font-medium">スタッフ</th>
              <th className="p-3 text-left font-medium">役職</th>
              <th className="p-3 text-left font-medium">配属箇所</th>
              <th className="p-3 text-left font-medium">勤務記号</th>
              <th className="p-3 text-left font-medium">時間</th>
              <th className="p-3 text-left font-medium">ステータス</th>
              <th className="p-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  シフトが見つかりません
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div>
                      {format(new Date(shift.date), 'M/d (E)', { locale: ja })}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{shift.staff.name}</div>
                    <div className="text-xs text-muted-foreground">{shift.staff.employee_number}</div>
                  </td>
                  <td className="p-3">
                    {shift.staff.roles && (
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                          shift.staff.roles.is_responsible
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {shift.staff.roles.name}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{shift.location.location_name}</div>
                    <div className="text-xs text-muted-foreground">{shift.location.code}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{shift.duty_code.code}</div>
                    <div className="text-xs text-muted-foreground">{shift.duty_code.category}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {shift.duty_code.start_time} - {shift.duty_code.end_time}
                  </td>
                  <td className="p-3">
                    <Badge variant="success">
                      {shift.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => onDelete(shift.id)}
                      className="text-destructive hover:underline"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
