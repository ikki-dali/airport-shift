'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteDutyCode, type DutyCode } from '@/lib/actions/duty-codes'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface DeleteDutyCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dutyCode: DutyCode | null
}

export function DeleteDutyCodeDialog({ open, onOpenChange, dutyCode }: DeleteDutyCodeDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleDelete = async () => {
    if (!dutyCode) return

    setLoading(true)
    try {
      await deleteDutyCode(dutyCode.id)
      router.refresh()
      onOpenChange(false)
    } catch (error: any) {
      alert(`削除エラー: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>勤務記号を削除</DialogTitle>
          <DialogDescription>
            本当に削除しますか？この操作は取り消せません。
          </DialogDescription>
        </DialogHeader>

        {dutyCode && (
          <div className="py-4">
            <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
              <p className="text-sm text-gray-600">削除対象:</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {dutyCode.code} <span className="text-sm font-normal text-gray-600">({dutyCode.category})</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {dutyCode.start_time} → {dutyCode.end_time}
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            キャンセル
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? '削除中...' : '削除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
