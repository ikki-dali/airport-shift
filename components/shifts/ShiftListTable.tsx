'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface ShiftWithDetails {
  id: string
  date: string
  status: '予定' | '確定' | '変更' | 'キャンセル'
  note: string | null
  created_at: string
  updated_at: string
  staff: {
    id: string
    employee_number: string
    name: string
    roles: {
      id: string
      name: string
      is_responsible: boolean
    } | null
  }
  location: {
    id: string
    business_type: string
    location_name: string
    code: string
  }
  duty_code: {
    id: string
    code: string
    start_time: string
    end_time: string
    duration_hours: number
    duration_minutes: number
    category: string
  }
}

interface ShiftListTableProps {
  shifts: ShiftWithDetails[]
  onConfirm: (shiftIds: string[]) => void
  onDelete: (shiftId: string) => void
  onUnconfirm: (shiftIds: string[]) => void
}

export function ShiftListTable({
  shifts,
  onConfirm,
  onDelete,
  onUnconfirm,
}: ShiftListTableProps) {
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])

  const handleSelectAll = () => {
    if (selectedShifts.length === shifts.length) {
      setSelectedShifts([])
    } else {
      setSelectedShifts(shifts.map((s) => s.id))
    }
  }

  const handleSelect = (shiftId: string, checked: boolean) => {
    if (checked) {
      setSelectedShifts([...selectedShifts, shiftId])
    } else {
      setSelectedShifts(selectedShifts.filter((id) => id !== shiftId))
    }
  }

  const handleConfirmSelected = () => {
    const pendingShifts = selectedShifts.filter(
      (id) => shifts.find((s) => s.id === id)?.status === '予定'
    )
    if (pendingShifts.length > 0) {
      onConfirm(pendingShifts)
      setSelectedShifts([])
    }
  }

  const handleUnconfirmSelected = () => {
    const confirmedShifts = selectedShifts.filter(
      (id) => shifts.find((s) => s.id === id)?.status === '確定'
    )
    if (confirmedShifts.length > 0) {
      onUnconfirm(confirmedShifts)
      setSelectedShifts([])
    }
  }

  const pendingCount = selectedShifts.filter(
    (id) => shifts.find((s) => s.id === id)?.status === '予定'
  ).length

  const confirmedCount = selectedShifts.filter(
    (id) => shifts.find((s) => s.id === id)?.status === '確定'
  ).length

  return (
    <div>
      <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 p-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedShifts.length === shifts.length && shifts.length > 0}
              onChange={handleSelectAll}
              className="h-4 w-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium">全選択</span>
          </label>
          <span className="text-sm text-gray-600">
            {selectedShifts.length > 0 ? `${selectedShifts.length}件選択中` : `全${shifts.length}件`}
          </span>
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <button
              onClick={handleConfirmSelected}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              選択したシフトを確定 ({pendingCount}件)
            </button>
          )}
          {confirmedCount > 0 && (
            <button
              onClick={handleUnconfirmSelected}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              確定を解除 ({confirmedCount}件)
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse bg-white text-sm">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="p-3 text-left font-medium">
                <input type="checkbox" className="invisible" />
              </th>
              <th className="p-3 text-left font-medium">日付</th>
              <th className="p-3 text-left font-medium">スタッフ</th>
              <th className="p-3 text-left font-medium">役職</th>
              <th className="p-3 text-left font-medium">配属箇所</th>
              <th className="p-3 text-left font-medium">勤務記号</th>
              <th className="p-3 text-left font-medium">時間</th>
              <th className="p-3 text-left font-medium">ステータス</th>
              <th className="p-3 text-left font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {shifts.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-gray-500">
                  シフトが見つかりません
                </td>
              </tr>
            ) : (
              shifts.map((shift) => (
                <tr key={shift.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedShifts.includes(shift.id)}
                      onChange={(e) => handleSelect(shift.id, e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300"
                      aria-label="このシフトを選択"
                    />
                  </td>
                  <td className="p-3">
                    <div>
                      {format(new Date(shift.date), 'M/d (E)', { locale: ja })}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{shift.staff.name}</div>
                    <div className="text-xs text-gray-500">{shift.staff.employee_number}</div>
                  </td>
                  <td className="p-3">
                    {shift.staff.roles && (
                      <span
                        className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                          shift.staff.roles.is_responsible
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {shift.staff.roles.name}
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{shift.location.location_name}</div>
                    <div className="text-xs text-gray-500">{shift.location.code}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{shift.duty_code.code}</div>
                    <div className="text-xs text-gray-500">{shift.duty_code.category}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {shift.duty_code.start_time} - {shift.duty_code.end_time}
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-block rounded px-2 py-1 text-xs font-medium ${
                        shift.status === '確定'
                          ? 'bg-green-100 text-green-800'
                          : shift.status === '予定'
                            ? 'bg-yellow-100 text-yellow-800'
                            : shift.status === '変更'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {shift.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      {shift.status === '予定' && (
                        <>
                          <button
                            onClick={() => onConfirm([shift.id])}
                            className="text-blue-600 hover:underline"
                          >
                            確定
                          </button>
                          <button
                            onClick={() => onDelete(shift.id)}
                            className="text-red-600 hover:underline"
                          >
                            削除
                          </button>
                        </>
                      )}
                      {shift.status === '確定' && (
                        <button
                          onClick={() => onUnconfirm([shift.id])}
                          className="text-gray-600 hover:underline"
                        >
                          確定解除
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
