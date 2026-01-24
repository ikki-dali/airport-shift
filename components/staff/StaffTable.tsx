'use client'

import { useState } from 'react'
import { deleteStaff, toggleStaffActive } from '@/lib/actions/staff'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { toast } from 'sonner'

type Staff = Database['public']['Tables']['staff']['Row'] & {
  roles: {
    id: string
    name: string
    is_responsible: boolean
  } | null
}

interface StaffTableProps {
  staff: Staff[]
}

export function StaffTable({ staff }: StaffTableProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`スタッフ「${name}」を削除しますか？`)) return

    setDeleting(id)
    try {
      await deleteStaff(id)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const action = currentStatus ? '退職' : '在籍中'
    if (!confirm(`このスタッフを「${action}」に変更しますか？`)) return

    setToggling(id)
    try {
      await toggleStaffActive(id, !currentStatus)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '変更に失敗しました')
    } finally {
      setToggling(null)
    }
  }

  if (staff.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        スタッフが見つかりません
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                社員番号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                氏名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                メール
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                電話
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                役職
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                タグ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                状態
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.map((s) => (
              <tr
                key={s.id}
                className={`hover:bg-gray-50 ${!s.is_active ? 'opacity-50 bg-gray-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/staff/${s.id}`}
                    className="text-blue-600 hover:underline font-mono"
                  >
                    {s.employee_number}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{s.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {s.email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {s.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {s.roles ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {s.roles.name}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">未設定</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {s.tags && s.tags.length > 0 ? (
                      s.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-400 text-sm">なし</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(s.id, s.is_active)}
                    disabled={toggling === s.id}
                    className={`px-2 py-1 text-xs font-medium rounded-full transition ${
                      s.is_active
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {toggling === s.id ? '...' : s.is_active ? '在籍中' : '退職'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/staff/${s.id}/edit`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      disabled={deleting === s.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deleting === s.id ? '削除中...' : '削除'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
          表示中: {staff.filter((s) => s.is_active).length} 件（在籍中） / 全{' '}
          {staff.length} 件
        </p>
      </div>
    </div>
  )
}
