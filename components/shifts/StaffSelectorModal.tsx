'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { ShiftRequestWithStaff } from '@/lib/actions/shift-requests'
import { createShift, updateShift } from '@/lib/actions/shifts'
import { toast } from 'sonner'

interface StaffSelectorModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffWithRole[]
  date: string
  locationId: string
  locationName: string
  dutyCodeId: string
  dutyCodeDisplay: string
  currentShiftId?: string
  currentStaffId?: string
  existingShiftIds: string[] // その日にすでにシフトが入っているスタッフIDのリスト
  shiftRequests?: ShiftRequestWithStaff[] // その日のシフト希望
  onSuccess: () => void
}

// 希望タイプに応じたバッジスタイルを返す
function getRequestBadgeStyle(requestType: string): string {
  switch (requestType) {
    case '◯':
      return 'bg-green-100 text-green-800 border-green-300'
    case '休':
      return 'bg-red-100 text-red-800 border-red-300'
    case '有給':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    case 'A':
      return 'bg-pink-100 text-pink-800 border-pink-300'
    case 'B':
      return 'bg-orange-100 text-orange-800 border-orange-300'
    case 'C':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'D':
      return 'bg-lime-100 text-lime-800 border-lime-300'
    case 'E':
      return 'bg-cyan-100 text-cyan-800 border-cyan-300'
    case 'F':
      return 'bg-primary/10 text-primary border-primary/30'
    case 'G':
      return 'bg-indigo-100 text-indigo-800 border-indigo-300'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

export function StaffSelectorModal({
  open,
  onOpenChange,
  staff,
  date,
  locationId,
  locationName,
  dutyCodeId,
  dutyCodeDisplay,
  currentShiftId,
  currentStaffId,
  existingShiftIds,
  shiftRequests = [],
  onSuccess,
}: StaffSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // スタッフIDごとの希望をマップ化
  const requestByStaffId = new Map(
    shiftRequests.map((r) => [r.staff_id, r])
  )

  const availableStaff = staff.filter((s) => {
    // 検索クエリでフィルタ
    const matchesSearch =
      searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employee_number?.toLowerCase().includes(searchQuery.toLowerCase())

    // その日にすでにシフトが入っているスタッフを除外（ただし現在選択中のスタッフは表示）
    const isAvailable =
      s.id === currentStaffId || !existingShiftIds.includes(s.id)

    return matchesSearch && isAvailable
  })

  // 希望のあるスタッフを優先してソート（◯が最優先、休は最後）
  const sortedStaff = [...availableStaff].sort((a, b) => {
    const requestA = requestByStaffId.get(a.id)
    const requestB = requestByStaffId.get(b.id)
    
    // 希望がないスタッフは後ろに
    if (!requestA && !requestB) return 0
    if (!requestA) return 1
    if (!requestB) return -1
    
    // ◯希望を最優先
    if (requestA.request_type === '◯' && requestB.request_type !== '◯') return -1
    if (requestA.request_type !== '◯' && requestB.request_type === '◯') return 1
    
    // 休希望は最後に
    if (requestA.request_type === '休' && requestB.request_type !== '休') return 1
    if (requestA.request_type !== '休' && requestB.request_type === '休') return -1
    
    return 0
  })

  const handleSelectStaff = async (staffId: string) => {
    setIsSubmitting(true)
    try {
      if (currentShiftId) {
        // 既存のシフトを更新
        await updateShift(currentShiftId, { staff_id: staffId })
        toast.success('シフトを更新しました')
      } else {
        // 新規シフトを作成
        await createShift({
          staff_id: staffId,
          date,
          location_id: locationId,
          duty_code_id: dutyCodeId,
        })
        toast.success('シフトを作成しました')
      }
      onSuccess()
      onOpenChange(false)
    } catch (error: any) {
      const errorMessage = error?.message || String(error)

      if (errorMessage.includes('unique_staff_date_shift') || errorMessage.includes('duplicate')) {
        toast.error('このスタッフは既にこの日にシフトが入っています')
      } else {
        toast.error('シフトの保存に失敗しました')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>スタッフを選択</DialogTitle>
          <div className="text-sm text-gray-600">
            {locationName} - {dutyCodeDisplay} - {date}
          </div>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* 検索ボックス */}
          <Input
            placeholder="スタッフ名または社員番号で検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* スタッフリスト */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {sortedStaff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                利用可能なスタッフがいません
              </div>
            ) : (
              sortedStaff.map((s) => {
                const request = requestByStaffId.get(s.id)
                const isRestDay = request?.request_type === '休'
                
                return (
                  <Button
                    key={s.id}
                    variant={s.id === currentStaffId ? 'default' : 'outline'}
                    className={`w-full justify-between h-auto py-3 ${
                      isRestDay ? 'opacity-50 bg-red-50 hover:bg-red-100' : ''
                    }`}
                    onClick={() => handleSelectStaff(s.id)}
                    disabled={isSubmitting}
                  >
                    <div className="text-left">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs text-gray-500">
                        {s.employee_number} - {s.roles?.name || '役割なし'}
                      </div>
                    </div>
                    {request && (
                      <Badge variant="outline" className={getRequestBadgeStyle(request.request_type)}>
                        希望: {request.request_type}
                      </Badge>
                    )}
                  </Button>
                )
              })
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
