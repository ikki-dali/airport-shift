'use client'

import { useState } from 'react'
import type { Staff } from '@/lib/actions/staff'
import { Filter, X } from 'lucide-react'

interface RequestsFilterProps {
  staff: Staff[]
  onStaffFilterChange: (staffIds: string[]) => void
  onRequestTypeFilterChange: (requestTypes: string[]) => void
}

const REQUEST_TYPES = ['◯', '休', '早朝', '早番', '遅番', '夜勤']

export function RequestsFilter({
  staff,
  onStaffFilterChange,
  onRequestTypeFilterChange,
}: RequestsFilterProps) {
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([])
  const [selectedRequestTypes, setSelectedRequestTypes] = useState<string[]>([])
  const [isExpanded, setIsExpanded] = useState(false)

  const handleStaffToggle = (staffId: string) => {
    const updated = selectedStaffIds.includes(staffId)
      ? selectedStaffIds.filter((id) => id !== staffId)
      : [...selectedStaffIds, staffId]
    setSelectedStaffIds(updated)
    onStaffFilterChange(updated)
  }

  const handleRequestTypeToggle = (type: string) => {
    const updated = selectedRequestTypes.includes(type)
      ? selectedRequestTypes.filter((t) => t !== type)
      : [...selectedRequestTypes, type]
    setSelectedRequestTypes(updated)
    onRequestTypeFilterChange(updated)
  }

  const clearFilters = () => {
    setSelectedStaffIds([])
    setSelectedRequestTypes([])
    onStaffFilterChange([])
    onRequestTypeFilterChange([])
  }

  const hasActiveFilters = selectedStaffIds.length > 0 || selectedRequestTypes.length > 0

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="font-medium">フィルター</span>
          {hasActiveFilters && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              {selectedStaffIds.length + selectedRequestTypes.length}
            </span>
          )}
        </div>
        {hasActiveFilters && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              clearFilters()
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            クリア
          </button>
        )}
      </button>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* スタッフフィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              スタッフ
            </label>
            <div className="flex flex-wrap gap-2">
              {staff.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleStaffToggle(s.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedStaffIds.includes(s.id)
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  } border`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* 希望タイプフィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              希望タイプ
            </label>
            <div className="flex flex-wrap gap-2">
              {REQUEST_TYPES.map((type) => (
                <button
                  key={type}
                  onClick={() => handleRequestTypeToggle(type)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedRequestTypes.includes(type)
                      ? 'bg-blue-100 text-blue-700 border-blue-300'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  } border`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
