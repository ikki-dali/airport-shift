'use client'

import { useState } from 'react'
import type { DutyCode } from '@/lib/actions/duty-codes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { parseDutyCode } from '@/lib/duty-code-parser'

interface DutyCodeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  dutyCodes: DutyCode[]
  onSelect: (dutyCodeId: string) => void
}

export function DutyCodeDialog({
  open,
  onOpenChange,
  dutyCodes,
  onSelect,
}: DutyCodeDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // カテゴリごとにグループ化
  const categories = Array.from(new Set(dutyCodes.map((dc) => dc.category)))

  const handleSelect = () => {
    if (selectedId) {
      onSelect(selectedId)
      setSelectedId(null)
    }
  }

  const handleCancel = () => {
    setSelectedId(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>勤務記号を選択</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {categories.map((category) => {
            const categoryDutyCodes = dutyCodes.filter((dc) => dc.category === category)

            return (
              <div key={category}>
                <h3 className="text-sm font-semibold mb-3 text-gray-700">{category}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {categoryDutyCodes.map((dutyCode) => {
                    const parsed = parseDutyCode(dutyCode.code)
                    const isSelected = selectedId === dutyCode.id

                    return (
                      <button
                        key={dutyCode.id}
                        onClick={() => setSelectedId(dutyCode.id)}
                        className={`p-3 border rounded-lg text-left transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono font-bold text-sm">
                            {dutyCode.code}
                          </span>
                          {dutyCode.is_overnight && (
                            <Badge variant="outline" className="text-xs">
                              日またぎ
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-600">
                          {parsed.startTime} - {parsed.endTime}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {parsed.durationHours}h{parsed.durationMinutes > 0 && `${parsed.durationMinutes}m`}
                          {dutyCode.break_minutes > 0 && ` (休憩${dutyCode.break_minutes}分)`}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button onClick={handleSelect} disabled={!selectedId}>
            決定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
