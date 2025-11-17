'use client'

import { useState, useMemo } from 'react'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { DutyCode } from '@/lib/actions/duty-codes'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search } from 'lucide-react'

interface StaffSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staff: StaffWithRole[]
  dutyCodes: DutyCode[]
  onSelect: (staffId: string, dutyCodeId: string) => void
  locationName?: string
  date?: string
}

export function StaffSearchModal({
  open,
  onOpenChange,
  staff,
  dutyCodes,
  onSelect,
  locationName,
  date,
}: StaffSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedDutyCodeId, setSelectedDutyCodeId] = useState<string | null>(null)

  // スタッフを検索
  const filteredStaff = useMemo(() => {
    if (!searchQuery.trim()) return staff

    const query = searchQuery.toLowerCase()
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.employee_number?.toLowerCase().includes(query) ||
        s.roles?.name.toLowerCase().includes(query)
    )
  }, [staff, searchQuery])

  // 勤務記号をカテゴリ別にグループ化
  const dutyCodesByCategory = useMemo(() => {
    const grouped = new Map<string, DutyCode[]>()
    dutyCodes.forEach((dc) => {
      const category = dc.category
      if (!grouped.has(category)) {
        grouped.set(category, [])
      }
      grouped.get(category)!.push(dc)
    })
    return grouped
  }, [dutyCodes])

  const handleConfirm = () => {
    if (selectedStaffId && selectedDutyCodeId) {
      onSelect(selectedStaffId, selectedDutyCodeId)
      // リセット
      setSearchQuery('')
      setSelectedStaffId(null)
      setSelectedDutyCodeId(null)
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setSearchQuery('')
    setSelectedStaffId(null)
    setSelectedDutyCodeId(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>スタッフとシフトを選択</DialogTitle>
          <DialogDescription>
            {locationName && date && `${locationName} - ${date}`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* 左側：スタッフ選択 */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="スタッフ名・社員番号・役職で検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex-1 overflow-y-auto border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredStaff.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedStaffId(s.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedStaffId === s.id
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-white border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-gray-500">{s.employee_number}</div>
                      </div>
                      {s.roles && (
                        <Badge variant="outline" className="text-xs">
                          {s.roles.name}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
                {filteredStaff.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    該当するスタッフが見つかりません
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 右側：勤務記号選択 */}
          <div className="flex flex-col gap-3 overflow-hidden">
            <h3 className="font-semibold">勤務記号を選択</h3>
            <div className="flex-1 overflow-y-auto border rounded-lg">
              <div className="p-2 space-y-4">
                {Array.from(dutyCodesByCategory.entries()).map(([category, codes]) => (
                  <div key={category}>
                    <div className="text-sm font-semibold text-gray-700 mb-2 px-2">
                      {category}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {codes.map((dc) => (
                        <button
                          key={dc.id}
                          onClick={() => setSelectedDutyCodeId(dc.id)}
                          className={`p-3 rounded-lg border text-left transition-colors ${
                            selectedDutyCodeId === dc.id
                              ? 'bg-blue-100 border-blue-500 border-2'
                              : 'bg-white border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-mono font-bold text-lg">{dc.code}</div>
                          <div className="text-xs text-gray-600 mt-1">
                            {dc.start_time} - {dc.end_time}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedStaffId || !selectedDutyCodeId}
          >
            追加
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
