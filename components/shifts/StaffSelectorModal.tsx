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
import type { StaffWithRole } from '@/lib/actions/staff'
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
  onSuccess: () => void
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
  onSuccess,
}: StaffSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      console.error('Failed to save shift:', error)
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
            {availableStaff.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                利用可能なスタッフがいません
              </div>
            ) : (
              availableStaff.map((s) => (
                <Button
                  key={s.id}
                  variant={s.id === currentStaffId ? 'default' : 'outline'}
                  className="w-full justify-start h-auto py-3"
                  onClick={() => handleSelectStaff(s.id)}
                  disabled={isSubmitting}
                >
                  <div className="text-left">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-gray-500">
                      {s.employee_number} - {s.roles?.name || '役割なし'}
                    </div>
                  </div>
                </Button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
