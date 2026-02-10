'use client'

import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { X, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { ShiftRequestWithStaff } from '@/lib/actions/shift-requests'
import type { StaffWithRole } from '@/lib/actions/staff'

interface ShiftRequestsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shiftRequests: ShiftRequestWithStaff[]
  staff: StaffWithRole[]
  displayDays: Date[]
}

// 希望タイプに応じた背景色
function getRequestBgColor(requestType: string): string {
  switch (requestType) {
    case '◯':
      return 'bg-green-100 text-green-800'
    case '休':
      return 'bg-red-100 text-red-800'
    case '有給':
      return 'bg-yellow-100 text-yellow-800'
    case 'A':
      return 'bg-pink-100 text-pink-800'
    case 'B':
      return 'bg-orange-100 text-orange-800'
    case 'C':
      return 'bg-amber-100 text-amber-800'
    case 'D':
      return 'bg-lime-100 text-lime-800'
    case 'E':
      return 'bg-cyan-100 text-cyan-800'
    case 'F':
      return 'bg-primary/10 text-primary'
    case 'G':
      return 'bg-indigo-100 text-indigo-800'
    default:
      return 'bg-muted text-foreground'
  }
}

export function ShiftRequestsPanel({
  open,
  onOpenChange,
  shiftRequests,
  staff,
  displayDays,
}: ShiftRequestsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')

  // スタッフごとにグループ化
  const requestsByStaff = useMemo(() => {
    const map = new Map<string, Map<string, ShiftRequestWithStaff>>()
    shiftRequests.forEach((req) => {
      if (!map.has(req.staff_id)) {
        map.set(req.staff_id, new Map())
      }
      map.get(req.staff_id)!.set(req.date, req)
    })
    return map
  }, [shiftRequests])

  // 希望を出しているスタッフのみ表示（希望数の多い順）
  const staffWithRequests = useMemo(() => {
    const filtered = staff
      .filter((s) => requestsByStaff.has(s.id))
      .sort((a, b) => {
        const countA = requestsByStaff.get(a.id)?.size || 0
        const countB = requestsByStaff.get(b.id)?.size || 0
        return countB - countA
      })

    // 検索フィルタ
    if (!searchQuery.trim()) return filtered
    const q = searchQuery.trim().toLowerCase()
    return filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.employee_number.toLowerCase().includes(q)
    )
  }, [staff, requestsByStaff, searchQuery])

  if (!open) return null

  return (
    <Card className="fixed right-4 top-20 w-[calc(100vw-320px)] max-w-[1400px] max-h-[80vh] z-50 shadow-xl overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-muted/50 gap-3">
        <div className="flex-shrink-0">
          <h3 className="font-semibold">シフト希望一覧</h3>
          <p className="text-sm text-muted-foreground">
            {staffWithRequests.length}名のスタッフが希望を提出
          </p>
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="スタッフ名 or ID で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-sm"
          />
        </div>
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-auto flex-1">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b">
              <th className="px-3 py-2 text-left font-medium text-sm bg-muted/50 sticky left-0 z-20 min-w-[120px]">
                スタッフ
              </th>
              {displayDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayOfWeek = format(day, 'E', { locale: ja })
                const isWeekend = dayOfWeek === '土' || dayOfWeek === '日'
                return (
                  <th
                    key={dateStr}
                    className={`px-2 py-2 text-center font-medium text-sm min-w-[50px] ${
                      isWeekend ? 'bg-navy-50' : 'bg-muted/50'
                    }`}
                  >
                    <div>{format(day, 'd')}</div>
                    <div className={`text-xs ${isWeekend ? 'text-navy-600' : 'text-muted-foreground'}`}>
                      {dayOfWeek}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {staffWithRequests.length === 0 ? (
              <tr>
                <td colSpan={displayDays.length + 1} className="px-4 py-8 text-center text-muted-foreground">
                  この期間のシフト希望はありません
                </td>
              </tr>
            ) : (
              staffWithRequests.map((s) => {
                const staffRequests = requestsByStaff.get(s.id)!
                return (
                  <tr key={s.id} className="border-b hover:bg-muted/30">
                    <td className="px-3 py-2 sticky left-0 bg-white z-10">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.employee_number}</div>
                    </td>
                    {displayDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const request = staffRequests.get(dateStr)
                      return (
                        <td key={dateStr} className="px-1 py-2 text-center">
                          {request ? (
                            <span
                              className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRequestBgColor(
                                request.request_type
                              )}`}
                            >
                              {request.request_type}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">-</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 凡例 */}
      <div className="p-3 border-t bg-muted/50">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="font-medium">凡例:</span>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            ◯ 出勤可
          </Badge>
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
            休
          </Badge>
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
            有給
          </Badge>
          <Badge variant="outline" className="bg-pink-100 text-pink-800 border-pink-300">
            A (4:00-5:30頃)
          </Badge>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
            B (6:00-7:00頃)
          </Badge>
          <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
            C (6:45-10:00頃)
          </Badge>
          <Badge variant="outline" className="bg-lime-100 text-lime-800 border-lime-300">
            D (12:00-14:00頃)
          </Badge>
          <Badge variant="outline" className="bg-cyan-100 text-cyan-800 border-cyan-300">
            E (14:15-15:00頃)
          </Badge>
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
            F (16:30-19:00頃)
          </Badge>
          <Badge variant="outline" className="bg-indigo-100 text-indigo-800 border-indigo-300">
            G (夜勤)
          </Badge>
        </div>
      </div>
    </Card>
  )
}
