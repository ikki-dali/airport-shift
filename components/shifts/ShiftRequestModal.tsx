'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { StaffWithRole } from '@/lib/actions/staff'
import { bulkUpsertShiftRequests, getShiftRequests } from '@/lib/actions/shift-requests'
import { Calendar } from 'lucide-react'

interface ShiftRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekDays: Date[]
  staff: StaffWithRole[]
  onSuccess: () => void
}

type RequestType = '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤' | ''

const REQUEST_TYPES: { value: RequestType; label: string; color: string }[] = [
  { value: '', label: '-', color: 'bg-gray-100' },
  { value: '◯', label: '◯', color: 'bg-green-100 text-green-800' },
  { value: '休', label: '休', color: 'bg-red-100 text-red-800' },
  { value: '早朝', label: '早朝', color: 'bg-blue-100 text-blue-800' },
  { value: '早番', label: '早番', color: 'bg-cyan-100 text-cyan-800' },
  { value: '遅番', label: '遅番', color: 'bg-purple-100 text-purple-800' },
  { value: '夜勤', label: '夜勤', color: 'bg-indigo-100 text-indigo-800' },
]

export function ShiftRequestModal({
  open,
  onOpenChange,
  weekDays,
  staff,
  onSuccess,
}: ShiftRequestModalProps) {
  const [requests, setRequests] = useState<
    Record<string, RequestType>
  >({})
  const [loading, setLoading] = useState(false)

  // 既存の希望を読み込み
  useEffect(() => {
    if (open && weekDays.length > 0) {
      loadExistingRequests()
    }
  }, [open, weekDays])

  const loadExistingRequests = async () => {
    try {
      // 週の最初の日から年月を取得
      const yearMonth = format(weekDays[0], 'yyyy-MM')
      
      // その月の全希望データを取得
      const existingRequests = await getShiftRequests({ yearMonth })
      
      // requests state に反映
      const newRequests: Record<string, RequestType> = {}
      existingRequests.forEach((request) => {
        const key = `${request.staff_id}_${request.date}`
        newRequests[key] = request.request_type as RequestType
      })
      
      setRequests(newRequests)
    } catch (error) {
      console.error('Failed to load existing requests:', error)
    }
  }

  // スタッフIDと日付のキーを生成
  const getKey = (staffId: string, date: Date) =>
    `${staffId}_${format(date, 'yyyy-MM-dd')}`

  // リクエストタイプを設定
  const setRequestType = (
    staffId: string,
    date: Date,
    type: RequestType
  ) => {
    const key = getKey(staffId, date)
    setRequests((prev) => ({
      ...prev,
      [key]: type,
    }))
  }

  // リクエストタイプを取得
  const getRequestType = (staffId: string, date: Date): RequestType => {
    const key = getKey(staffId, date)
    return requests[key] || ''
  }

  // 保存処理
  const handleSave = async () => {
    setLoading(true)
    try {
      // 実際のリクエストデータを作成
      const validRequests: Array<{
        staff_id: string
        date: string
        request_type: '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤'
      }> = []

      Object.entries(requests).forEach(([key, type]) => {
        if (type !== '') {
          const [staffId, date] = key.split('_')
          validRequests.push({
            staff_id: staffId,
            date,
            request_type: type as Exclude<RequestType, ''>,
          })
        }
      })

      if (validRequests.length > 0) {
        await bulkUpsertShiftRequests(validRequests)
        alert(`${validRequests.length}件の希望を保存しました`)
        onSuccess()
        onOpenChange(false)
      } else {
        alert('保存する希望がありません')
      }
    } catch (error: any) {
      console.error('Save error:', error)
      alert(`保存に失敗しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            シフト希望設定
          </DialogTitle>
          <DialogDescription>
            スタッフごとに各日の希望を設定してください（メール等で受け取った希望を入力できます）
          </DialogDescription>
        </DialogHeader>

        <div className="h-[600px] overflow-y-auto pr-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-white z-10">
                <tr>
                  <th className="border p-2 bg-gray-50 min-w-[150px]">
                    スタッフ
                  </th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className="border p-2 bg-gray-50 min-w-[100px]">
                      <div className="text-sm">
                        {format(day, 'M/d')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {format(day, 'E', { locale: ja })}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s) => (
                  <tr key={s.id}>
                    <td className="border p-2 font-medium">
                      {s.name}
                      <div className="text-xs text-gray-500">
                        {s.employee_number}
                      </div>
                    </td>
                    {weekDays.map((day) => (
                      <td key={`${s.id}_${day.toISOString()}`} className="border p-1">
                        <select
                          value={getRequestType(s.id, day)}
                          onChange={(e) =>
                            setRequestType(s.id, day, e.target.value as RequestType)
                          }
                          className={`w-full p-1 text-sm rounded border-none ${
                            REQUEST_TYPES.find(
                              (t) => t.value === getRequestType(s.id, day)
                            )?.color || 'bg-gray-100'
                          }`}
                        >
                          {REQUEST_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? '保存中...' : '保存'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
