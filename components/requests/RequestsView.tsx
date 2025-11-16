'use client'

import { useState } from 'react'
import type { Staff } from '@/lib/actions/staff'
import { RequestsCalendar } from './RequestsCalendar'
import { RequestsTable } from './RequestsTable'
import { RequestsFilter } from './RequestsFilter'
import { Calendar, Table } from 'lucide-react'

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

interface RequestsViewProps {
  requests: ShiftRequest[]
  staff: Staff[]
  yearMonth: string
}

export function RequestsView({ requests, staff, yearMonth }: RequestsViewProps) {
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar')
  const [filterStaffIds, setFilterStaffIds] = useState<string[]>([])
  const [filterRequestTypes, setFilterRequestTypes] = useState<string[]>([])

  // フィルタリング
  const filteredRequests = requests.filter((req) => {
    if (filterStaffIds.length > 0 && !filterStaffIds.includes(req.staff_id)) {
      return false
    }
    if (filterRequestTypes.length > 0 && !filterRequestTypes.includes(req.request_type)) {
      return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* 表示モード切り替え・フィルター */}
      <div className="flex items-start justify-between gap-4">
        <RequestsFilter
          staff={staff}
          onStaffFilterChange={setFilterStaffIds}
          onRequestTypeFilterChange={setFilterRequestTypes}
        />

        <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Calendar className="h-4 w-4" />
            カレンダー
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Table className="h-4 w-4" />
            テーブル
          </button>
        </div>
      </div>

      {/* 表示エリア */}
      {viewMode === 'calendar' ? (
        <RequestsCalendar
          requests={filteredRequests}
          yearMonth={yearMonth}
        />
      ) : (
        <RequestsTable
          requests={filteredRequests}
          yearMonth={yearMonth}
        />
      )}
    </div>
  )
}
