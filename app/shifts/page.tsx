'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { format } from 'date-fns'
import { ShiftListTable } from '@/components/shifts/ShiftListTable'
import {
  getShiftsWithDetails,
  confirmShifts,
  confirmMonthShifts,
  deleteShift,
  unconfirmShifts,
} from '@/lib/actions/shifts'
import { getStaff } from '@/lib/actions/staff'
import { getLocations } from '@/lib/actions/locations'
import { getAllLocationRequirements } from '@/lib/actions/location-requirements'
import { ConstraintViolation } from '@/lib/validators/shift-validator'
import { ExportButton } from '@/components/shifts/ExportButton'
import { ShiftCalendarView } from '@/components/shifts/ShiftCalendarView'
import { toast } from 'sonner'

// モーダルは表示時のみロード
const ConfirmDialog = dynamic(
  () => import('@/components/shifts/ConfirmDialog').then(mod => ({ default: mod.ConfirmDialog })),
  { ssr: false }
)

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

  // 確定ダイアログ状態
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'selected' | 'month'
    shiftIds: string[]
    description: string
  } | null>(null)
  const [violations, setViolations] = useState<ConstraintViolation[]>([])
  const [isConfirming, setIsConfirming] = useState(false)

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

  const handleConfirm = async (shiftIds: string[]) => {
    // TODO: 実際の制約チェックを実装
    // 現時点ではダミーの検証結果
    const dummyViolations: ConstraintViolation[] = []

    setConfirmTarget({
      type: 'selected',
      shiftIds,
      description: `選択したシフト`,
    })
    setViolations(dummyViolations)
    setConfirmDialogOpen(true)
  }

  const handleMonthConfirm = async () => {
    const pendingShifts = shifts.filter((s) => s.status === '予定')

    if (pendingShifts.length === 0) {
      toast.warning('確定対象の予定シフトがありません')
      return
    }

    // TODO: 実際の制約チェックを実装
    const dummyViolations: ConstraintViolation[] = []

    setConfirmTarget({
      type: 'month',
      shiftIds: pendingShifts.map((s) => s.id),
      description: `${yearMonth}の全シフト`,
    })
    setViolations(dummyViolations)
    setConfirmDialogOpen(true)
  }

  const handleConfirmExecute = async () => {
    if (!confirmTarget) return

    try {
      setIsConfirming(true)

      if (confirmTarget.type === 'month') {
        await confirmMonthShifts(yearMonth)
      } else {
        await confirmShifts(confirmTarget.shiftIds, { skipWarnings: true })
      }

      toast.success('シフトを確定しました')
      setConfirmDialogOpen(false)
      setConfirmTarget(null)
      await loadData(yearMonth)
    } catch (error: any) {
      toast.error(`確定に失敗しました: ${error.message}`)
    } finally {
      setIsConfirming(false)
    }
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

  const handleUnconfirm = async (shiftIds: string[]) => {
    if (!confirm(`${shiftIds.length}件のシフトの確定を解除しますか？`)) return

    try {
      await unconfirmShifts(shiftIds)
      toast.success('確定を解除しました')
      await loadData(yearMonth)
    } catch (error: any) {
      toast.error(`確定解除に失敗しました: ${error.message}`)
    }
  }

  const pendingCount = shifts.filter((s) => s.status === '予定').length
  const confirmedCount = shifts.filter((s) => s.status === '確定').length

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">シフト一覧・確定</h1>
          <div className="flex gap-2">
            {/* ビュー切り替え */}
            <div className="flex rounded-lg border border-gray-300 bg-white">
              <button
                onClick={() => setViewMode('table')}
                className={`px-4 py-2 text-sm font-medium rounded-l-lg ${
                  viewMode === 'table'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                一覧
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                  viewMode === 'calendar'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                カレンダー
              </button>
            </div>
            <ExportButton yearMonth={yearMonth} />
            <button
              onClick={() => (window.location.href = '/shifts/create')}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              シフト作成画面へ
            </button>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="filter-status" className="mb-2 block text-sm font-medium text-gray-700">ステータス</label>
              <select
                id="filter-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">全て</option>
                <option value="予定">予定</option>
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
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

          <div className="mt-4 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium">予定: {pendingCount}件</span>
              <span className="mx-2">|</span>
              <span className="font-medium">確定: {confirmedCount}件</span>
              <span className="mx-2">|</span>
              <span className="font-medium">合計: {shifts.length}件</span>
            </div>
            {pendingCount > 0 && (
              <button
                onClick={handleMonthConfirm}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                月次一括確定 ({pendingCount}件)
              </button>
            )}
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
            onConfirm={handleConfirm}
            onDelete={handleDelete}
            onUnconfirm={handleUnconfirm}
          />
        )}

        {/* 確定ダイアログ */}
        {confirmTarget && (
          <ConfirmDialog
            isOpen={confirmDialogOpen}
            onClose={() => {
              setConfirmDialogOpen(false)
              setConfirmTarget(null)
            }}
            onConfirm={handleConfirmExecute}
            title="シフト確定確認"
            targetDescription={confirmTarget.description}
            shiftCount={confirmTarget.shiftIds.length}
            violations={violations}
            isLoading={isConfirming}
          />
        )}
      </div>
    </div>
  )
}
