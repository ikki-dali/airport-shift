'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Save, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { ShiftRequestWithStaff } from '@/lib/actions/shift-requests'
import { bulkUpsertShiftRequests, deleteShiftRequest } from '@/lib/actions/shift-requests'
import { toast } from 'sonner'

interface ShiftRequestsEditorProps {
  staff: StaffWithRole[]
  existingRequests: ShiftRequestWithStaff[]
  initialMonth: string
}

type RequestType = '◯' | '休' | '有給' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | ''

const REQUEST_TYPES: { value: RequestType; label: string; color: string; description?: string }[] = [
  { value: '', label: '-', color: 'bg-gray-100 hover:bg-gray-200' },
  { value: '◯', label: '◯', color: 'bg-green-100 text-green-800 hover:bg-green-200', description: '出勤可' },
  { value: '休', label: '休', color: 'bg-red-100 text-red-800 hover:bg-red-200', description: '休み希望' },
  { value: '有給', label: '有給', color: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200', description: '有給休暇' },
  { value: 'A', label: 'A', color: 'bg-pink-100 text-pink-800 hover:bg-pink-200', description: '4:00-5:30頃' },
  { value: 'B', label: 'B', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200', description: '6:00-7:00頃' },
  { value: 'C', label: 'C', color: 'bg-amber-100 text-amber-800 hover:bg-amber-200', description: '6:45-10:00頃' },
  { value: 'D', label: 'D', color: 'bg-lime-100 text-lime-800 hover:bg-lime-200', description: '12:00-14:00頃' },
  { value: 'E', label: 'E', color: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200', description: '14:15-15:00頃' },
  { value: 'F', label: 'F', color: 'bg-primary/10 text-primary hover:bg-primary/20', description: '16:30-19:00頃' },
  { value: 'G', label: 'G', color: 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200', description: '19:00-23:00頃(夜勤)' },
]

export function ShiftRequestsEditor({
  staff,
  existingRequests,
  initialMonth,
}: ShiftRequestsEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const [year, month] = initialMonth.split('-').map(Number)
    return new Date(year, month - 1, 1)
  })
  
  const [requests, setRequests] = useState<Record<string, RequestType>>(() => {
    const initial: Record<string, RequestType> = {}
    existingRequests.forEach((req) => {
      const key = `${req.staff_id}_${req.date}`
      initial[key] = req.request_type as RequestType
    })
    return initial
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 月の日数を計算
  const daysInMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  ).getDate()

  // 月の全日付を生成
  const displayDays = useMemo(() => 
    Array.from({ length: daysInMonth }, (_, i) =>
      addDays(currentMonth, i)
    ),
    [currentMonth, daysInMonth]
  )

  // スタッフをフィルター
  const filteredStaff = useMemo(() => 
    staff.filter((s) =>
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employee_number?.toLowerCase().includes(searchQuery.toLowerCase())
    ),
    [staff, searchQuery]
  )

  // キー生成
  const getKey = (staffId: string, date: Date) =>
    `${staffId}_${format(date, 'yyyy-MM-dd')}`

  // リクエストタイプを設定
  const setRequestType = (staffId: string, date: Date, type: RequestType) => {
    const key = getKey(staffId, date)
    setRequests((prev) => ({
      ...prev,
      [key]: type,
    }))
    setHasChanges(true)
  }

  // リクエストタイプを取得
  const getRequestType = (staffId: string, date: Date): RequestType => {
    const key = getKey(staffId, date)
    return requests[key] || ''
  }

  // 月を移動
  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    setCurrentMonth(newMonth)
    // URLパラメータを更新して再取得
    startTransition(() => {
      router.push(`/shifts/requests?month=${format(newMonth, 'yyyy-MM')}`)
    })
  }

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    setCurrentMonth(newMonth)
    startTransition(() => {
      router.push(`/shifts/requests?month=${format(newMonth, 'yyyy-MM')}`)
    })
  }

  const goToCurrentMonth = () => {
    const today = new Date()
    const newMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    setCurrentMonth(newMonth)
    startTransition(() => {
      router.push(`/shifts/requests?month=${format(newMonth, 'yyyy-MM')}`)
    })
  }

  // 保存処理
  const handleSave = async () => {
    setSaving(true)
    try {
      const yearMonth = format(currentMonth, 'yyyy-MM')
      const startDate = `${yearMonth}-01`
      const endDate = `${yearMonth}-${String(daysInMonth).padStart(2, '0')}`
      
      // この月のリクエストのみ抽出
      const validRequests: Array<{
        staff_id: string
        date: string
        request_type: Exclude<RequestType, ''>
      }> = []

      Object.entries(requests).forEach(([key, type]) => {
        const [staffId, date] = key.split('_')
        // この月の範囲内のデータのみ
        if (date >= startDate && date <= endDate && type !== '') {
          validRequests.push({
            staff_id: staffId,
            date,
            request_type: type as Exclude<RequestType, ''>,
          })
        }
      })

      if (validRequests.length > 0) {
        await bulkUpsertShiftRequests(validRequests)
        toast.success(`${validRequests.length}件の希望を保存しました`)
        setHasChanges(false)
      } else {
        toast.info('保存する希望がありません')
      }
    } catch (error: any) {
      toast.error(`保存に失敗しました: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  // 統計情報
  const stats = useMemo(() => {
    const yearMonth = format(currentMonth, 'yyyy-MM')
    let totalRequests = 0
    let restDays = 0
    let workDays = 0

    Object.entries(requests).forEach(([key, type]) => {
      const date = key.split('_')[1]
      if (date.startsWith(yearMonth) && type !== '') {
        totalRequests++
        if (type === '休') {
          restDays++
        } else {
          workDays++
        }
      }
    })

    return { totalRequests, restDays, workDays }
  }, [requests, currentMonth])

  return (
    <div className="space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth} disabled={isPending}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            {format(currentMonth, 'yyyy年M月', { locale: ja })}
          </div>
          <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={isPending}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToCurrentMonth} disabled={isPending}>
            今月
          </Button>
        </div>

        <div className="flex items-center gap-4">
          {/* 統計 */}
          <div className="flex gap-2 text-sm">
            <Badge variant="outline">
              希望数: {stats.totalRequests}
            </Badge>
            <Badge variant="outline" className="bg-green-50">
              出勤可: {stats.workDays}
            </Badge>
            <Badge variant="outline" className="bg-red-50">
              休: {stats.restDays}
            </Badge>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? '保存中...' : '保存'}
          </Button>
        </div>
      </div>

      {/* 検索 */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="スタッフ名または社員番号で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <span className="text-sm text-gray-500">
          {filteredStaff.length}名表示中
        </span>
      </div>

      {/* 凡例 */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-gray-600">凡例:</span>
        {REQUEST_TYPES.filter((t) => t.value !== '').map((type) => (
          <Badge key={type.value} variant="outline" className={type.color} title={type.description}>
            {type.label}{type.description ? ` (${type.description})` : ''}
          </Badge>
        ))}
      </div>

      {/* テーブル */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
          <table className="w-full border-collapse">
            <thead className="sticky top-0 z-20 bg-white">
              <tr>
                <th className="border-b-2 border-r px-3 py-2 text-left font-semibold bg-gray-50 sticky left-0 z-30 min-w-[140px]">
                  スタッフ
                </th>
                {displayDays.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const dayOfWeek = format(day, 'E', { locale: ja })
                  const isWeekend = dayOfWeek === '土' || dayOfWeek === '日'
                  return (
                    <th
                      key={dateStr}
                      className={`border-b-2 border-r px-1 py-2 text-center font-medium min-w-[48px] ${
                        isWeekend ? 'bg-navy-50' : 'bg-gray-50'
                      }`}
                    >
                      <div className="text-sm">{format(day, 'd')}</div>
                      <div className={`text-xs ${isWeekend ? 'text-navy-600' : 'text-gray-500'}`}>
                        {dayOfWeek}
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={daysInMonth + 1} className="px-4 py-8 text-center text-gray-500">
                    該当するスタッフがいません
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="border-b border-r px-3 py-2 sticky left-0 bg-white z-10">
                      <div className="font-medium text-sm">{s.name}</div>
                      <div className="text-xs text-gray-500">{s.employee_number}</div>
                    </td>
                    {displayDays.map((day) => {
                      const dateStr = format(day, 'yyyy-MM-dd')
                      const currentType = getRequestType(s.id, day)
                      const typeInfo = REQUEST_TYPES.find((t) => t.value === currentType)
                      
                      return (
                        <td key={`${s.id}_${dateStr}`} className="border-b border-r p-0.5">
                          <select
                            value={currentType}
                            onChange={(e) =>
                              setRequestType(s.id, day, e.target.value as RequestType)
                            }
                            className={`w-full h-8 text-xs text-center rounded cursor-pointer border-none focus:ring-2 focus:ring-primary ${
                              typeInfo?.color || 'bg-gray-100'
                            }`}
                          >
                            {REQUEST_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </td>
                      )
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 未保存の変更警告 */}
      {hasChanges && (
        <div className="fixed bottom-4 right-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 shadow-lg flex items-center gap-3">
          <span className="text-yellow-800 text-sm">未保存の変更があります</span>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? '保存中...' : '保存する'}
          </Button>
        </div>
      )}
    </div>
  )
}
