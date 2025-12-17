'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

interface DeleteShiftModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffName: string
  onConfirm: (deleteAllWeek: boolean) => void
  isSubmitting?: boolean
}

export function DeleteShiftModal({
  open,
  onOpenChange,
  staffName,
  onConfirm,
  isSubmitting = false,
}: DeleteShiftModalProps) {
  const [deleteAllWeek, setDeleteAllWeek] = useState(false)

  const handleConfirm = () => {
    onConfirm(deleteAllWeek)
    setDeleteAllWeek(false) // リセット
  }

  const handleCancel = () => {
    setDeleteAllWeek(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>シフトを削除</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">{staffName}</span>さんのシフトを削除してもよろしいですか？
          </p>

          <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-3">
            <Checkbox
              id="delete-all-week"
              checked={deleteAllWeek}
              onCheckedChange={(checked) => setDeleteAllWeek(checked === true)}
            />
            <Label
              htmlFor="delete-all-week"
              className="text-sm font-medium cursor-pointer"
            >
              この週の{staffName}さんの全シフトを削除
            </Label>
          </div>

          {deleteAllWeek && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-800">
                ⚠️ この週のすべてのシフトが削除されます
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? '削除中...' : '削除する'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
