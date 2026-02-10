'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ShiftListTable } from '@/components/shifts/ShiftListTable'
import {
  getShiftsWithDetails,
  deleteShift,
} from '@/lib/actions/shifts'
import { getStaff } from '@/lib/actions/staff'
import { getLocations } from '@/lib/actions/locations'
import { getAllLocationRequirements } from '@/lib/actions/location-requirements'
import { ExportButton } from '@/components/shifts/ExportButton'
import { ShiftCalendarView } from '@/components/shifts/ShiftCalendarView'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<any[]>([])
  const [filteredShifts, setFilteredShifts] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [locationRequirements, setLocationRequirements] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table')

  // フィルター状態
  const currentYearMonth = format(new Date(), 'yyyy-MM')
  const [yearMonth, setYearMonth] = useState(currentYearMonth)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [locationFilter, setLocationFilter] = useState<string>('all')

  // データ取得
  const loadData = useCallback(async (ym: string) => {
    try {
      setIsLoading(true)
      const [shiftsData, staffData, locationsData, requirementsData] = await Promise.all([
        getShiftsWithDetails({ yearMonth: ym }),
        getStaff(),
        getLocations(),
        getAllLocationRequirements(),
      ])
      setShifts(shiftsData)
      setStaff(staffData)
      setLocations(locationsData)
      setLocationRequirements(requirementsData)
    } catch {
      toast.error('データの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(yearMonth)
  }, [loadData, yearMonth])

  // フィルタリング
  useEffect(() => {
    let result = shifts

    if (statusFilter !== 'all') {
      result = result.filter((s) => s.status === statusFilter)
    }

    if (staffFilter !== 'all') {
      result = result.filter((s) => s.staff.id === staffFilter)
    }

    if (locationFilter !== 'all') {
      result = result.filter((s) => s.location.id === locationFilter)
    }

    setFilteredShifts(result)
  }, [shifts, statusFilter, staffFilter, locationFilter])

  const handleYearMonthChange = (newYearMonth: string) => {
    setYearMonth(newYearMonth)
  }

  const handleDelete = async (shiftId: string) => {
    if (!confirm('このシフトを削除しますか？')) return

    try {
      await deleteShift(shiftId)
      toast.success('シフトを削除しました')
      await loadData(yearMonth)
    } catch (error: any) {
      toast.error(`削除に失敗しました: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">シフト一覧</h1>
          <div className="flex gap-2">
            {/* ビュー切り替え */}
            <div className="flex rounded-lg border border-gray-200 bg-white">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                一覧
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                カレンダー
              </button>
            </div>
            <ExportButton yearMonth={yearMonth} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/shifts/create')}
            >
              シフト作成画面へ
            </Button>
          </div>
        </div>

        {/* フィルター */}
        <div className="mb-6 rounded-lg bg-white p-6 shadow">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="filter-year-month" className="mb-2 block text-sm font-medium text-gray-700">年月</label>
              <input
                id="filter-year-month"
                type="month"
                value={yearMonth}
                onChange={(e) => handleYearMonthChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="filter-status" className="mb-2 block text-sm font-medium text-gray-700">ステータス</label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
              >
                <option value="all">全て</option>
                <option value="確定">確定</option>
                <option value="変更">変更</option>
                <option value="キャンセル">キャンセル</option>
              </select>
            </div>

            <div>
              <label htmlFor="filter-staff" className="mb-2 block text-sm font-medium text-gray-700">スタッフ</label>
              <select
                id="filter-staff"
                value={staffFilter}
                onChange={(e) => setStaffFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
              >
                <option value="all">全員</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.employee_number})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filter-location" className="mb-2 block text-sm font-medium text-gray-700">配属箇所</label>
              <select
                id="filter-location"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 focus:border-primary focus:outline-none"
              >
                <option value="all">全て</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.location_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center border-t pt-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">合計: {shifts.length}件</span>
            </div>
          </div>
        </div>

        {/* シフト表示 */}
        {isLoading ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-500">読み込み中...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          <ShiftCalendarView
            shifts={shifts}
            locationRequirements={locationRequirements}
            yearMonth={yearMonth}
          />
        ) : (
          <ShiftListTable
            shifts={filteredShifts}
            onDelete={handleDelete}
          />
        )}

      </div>
    </div>
  )
}
