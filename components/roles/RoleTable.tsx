'use client'

import { useState } from 'react'
import { deleteRole } from '@/lib/actions/roles'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'
import { toast } from 'sonner'

type Role = Database['public']['Tables']['roles']['Row']

interface RoleTableProps {
  roles: Role[]
}

export function RoleTable({ roles }: RoleTableProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`役職「${name}」を削除しますか？`)) {
      return
    }

    setDeleting(id)
    try {
      await deleteRole(id)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              役職名
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              責任者
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              優先度
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              作成日
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {roles.map((role) => (
            <tr key={role.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{role.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {role.is_responsible ? (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    ✓ 可能
                  </span>
                ) : (
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                    - 不可
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {role.priority}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(role.created_at).toLocaleDateString('ja-JP')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => router.push(`/roles/${role.id}/edit`)}
                  className="text-blue-600 hover:text-blue-900 mr-4"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(role.id, role.name)}
                  disabled={deleting === role.id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                >
                  {deleting === role.id ? '削除中...' : '削除'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {roles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          役職が登録されていません
        </div>
      )}
    </div>
  )
}
