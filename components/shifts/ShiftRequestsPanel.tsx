'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getShiftRequests } from '@/lib/actions/shift-requests'
import type { StaffWithRole } from '@/lib/actions/staff'
import { useDraggable } from '@dnd-kit/core'
import { Calendar, X } from 'lucide-react'

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

interface ShiftRequestsPanelProps {
  selectedDate: Date | null
  staff: StaffWithRole[]
  onClose: () => void
}

// ドラッグ可能なスタッフアイテム（希望表示付き）
function DraggableRequestStaffItem({
  staff,
  requestType
}: {
  staff: StaffWithRole
  requestType: string
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: staff.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  // 希望タイプに応じた色
  const getRequestColor = (type: string) => {
    switch (type) {
      case '◯':
        return 'bg-green-50 border-green-300 text-green-700'
      case '休':
        return 'bg-gray-50 border-gray-300 text-gray-700'
      case '早朝':
      case '早番':
        return 'bg-blue-50 border-blue-300 text-blue-700'
      case '遅番':
        return 'bg-orange-50 border-orange-300 text-orange-700'
      case '夜勤':
        return 'bg-purple-50 border-purple-300 text-purple-700'
      default:
        return 'bg-white border-gray-200 text-gray-700'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-3 border rounded-lg hover:shadow-md transition-all cursor-move ${getRequestColor(requestType)}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{staff.name}</div>
          <div className="text-xs opacity-70 mt-0.5">{staff.employee_number}</div>
        </div>
        <div className="ml-2 px-2 py-1 bg-white/50 rounded text-xs font-bold">
          {requestType}
        </div>
      </div>
      {staff.roles && (
        <div className="mt-2">
          <span className="text-xs bg-white/50 px-2 py-0.5 rounded">
            {staff.roles.name}
          </span>
        </div>
      )}
    </div>
  )
}

export function ShiftRequestsPanel({ selectedDate, staff, onClose }: ShiftRequestsPanelProps) {
  const [requests, setRequests] = useState<ShiftRequest[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!selectedDate) {
      setRequests([])
      return
    }

    const fetchRequests = async () => {
      setLoading(true)
      try {
        // 選択日のリクエストのみ取得
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        const filtered = await getShiftRequests({ date: dateStr })

        setRequests(filtered)
      } catch (error) {
        console.error('Error fetching shift requests:', error)
        setRequests([])
      } finally {
        setLoading(false)
      }
    }

    fetchRequests()
  }, [selectedDate])

  if (!selectedDate) {
    return (
      <Card className="h-[calc(100vh-250px)]">
        <CardContent className="flex items-center justify-center h-full text-gray-400 text-sm">
          <div className="text-center">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>日付を選択してください</p>
            <p className="mt-1 text-xs">希望提出しているスタッフが表示されます</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // スタッフ情報を結合
  const requestsWithStaff = requests.map((req) => {
    const staffInfo = staff.find((s) => s.id === req.staff_id)
    return {
      ...req,
      staffInfo,
    }
  }).filter((req) => req.staffInfo) // スタッフ情報が見つかったもののみ

  return (
    <Card className="h-[calc(100vh-250px)] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {format(selectedDate, 'M月d日(E)', { locale: ja })} の希望
          </CardTitle>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            aria-label="閉じる"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          ドラッグしてシフトを割り当てられます
        </p>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center text-gray-500 text-sm py-8">
            読み込み中...
          </div>
        ) : requestsWithStaff.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            この日の希望提出はありません
          </div>
        ) : (
          <div className="space-y-2">
            {requestsWithStaff.map((req) => (
              <DraggableRequestStaffItem
                key={req.id}
                staff={req.staffInfo!}
                requestType={req.request_type}
              />
            ))}
          </div>
        )}
        {requestsWithStaff.length > 0 && (
          <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
            {requestsWithStaff.length} 名が希望提出
          </div>
        )}
      </CardContent>
    </Card>
  )
}
