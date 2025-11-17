'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDutyCode, updateDutyCode, type DutyCode, type DutyCodeInput } from '@/lib/actions/duty-codes'
import { parseDutyCode } from '@/lib/duty-code-parser'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface DutyCodeFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dutyCode?: DutyCode
  mode: 'create' | 'edit'
}

export function DutyCodeFormDialog({ open, onOpenChange, dutyCode, mode }: DutyCodeFormDialogProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<DutyCodeInput>({
    code: dutyCode?.code || '',
    category: dutyCode?.category || '',
    start_time: dutyCode?.start_time || '',
    end_time: dutyCode?.end_time || '',
    duration_hours: dutyCode?.duration_hours || 0,
    duration_minutes: dutyCode?.duration_minutes || 0,
    break_minutes: dutyCode?.break_minutes || 0,
  })

  // コード入力時に自動パース
  useEffect(() => {
    if (formData.code && mode === 'create') {
      try {
        const parsed = parseDutyCode(formData.code)
        setFormData(prev => ({
          ...prev,
          start_time: parsed.startTime,
          end_time: parsed.endTime,
          duration_hours: parsed.durationHours,
          duration_minutes: parsed.durationMinutes,
          break_minutes: parsed.breakMinutes,
        }))
      } catch (error) {
        // パースエラーは無視（不完全な入力中の可能性があるため）
      }
    }
  }, [formData.code, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (mode === 'create') {
        await createDutyCode(formData)
      } else if (dutyCode) {
        await updateDutyCode(dutyCode.id, formData)
      }

      router.refresh()
      onOpenChange(false)

      // フォームをリセット
      setFormData({
        code: '',
        category: '',
        start_time: '',
        end_time: '',
        duration_hours: 0,
        duration_minutes: 0,
        break_minutes: 0,
      })
    } catch (error: any) {
      alert(`エラーが発生しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {mode === 'create' ? '勤務記号を追加' : '勤務記号を編集'}
            </DialogTitle>
            <DialogDescription>
              {mode === 'create'
                ? '新しい勤務記号の情報を入力してください。'
                : '勤務記号の情報を編集してください。'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* コード */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                コード<span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 space-y-1">
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  placeholder="例: A01"
                />
                {mode === 'create' && (
                  <p className="text-xs text-gray-500">コードを入力すると勤務時間が自動で反映されます</p>
                )}
              </div>
            </div>

            {/* カテゴリ */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                カテゴリ<span className="text-red-500">*</span>
              </Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="col-span-3"
                required
                placeholder="例: 日勤"
              />
            </div>

            {/* 開始時刻 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="start_time" className="text-right">
                開始時刻<span className="text-red-500">*</span>
              </Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            {/* 終了時刻 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="end_time" className="text-right">
                終了時刻<span className="text-red-500">*</span>
              </Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="col-span-3"
                required
              />
            </div>

            {/* 勤務時間 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">勤務時間<span className="text-red-500">*</span></Label>
              <div className="col-span-3 flex gap-2 items-center">
                <Input
                  type="number"
                  min="0"
                  max="23"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData({ ...formData, duration_hours: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  required
                />
                <span>時間</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  required
                />
                <span>分</span>
              </div>
            </div>

            {/* 休憩時間 */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="break_minutes" className="text-right">
                休憩時間<span className="text-red-500">*</span>
              </Label>
              <div className="col-span-3 flex gap-2 items-center">
                <Input
                  id="break_minutes"
                  type="number"
                  min="0"
                  value={formData.break_minutes}
                  onChange={(e) => setFormData({ ...formData, break_minutes: parseInt(e.target.value) || 0 })}
                  className="w-20"
                  required
                />
                <span>分</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : mode === 'create' ? '追加' : '更新'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
