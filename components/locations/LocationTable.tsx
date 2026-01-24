'use client'

import { useState } from 'react'
import { deleteLocation } from '@/lib/actions/locations'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { toast } from 'sonner'

type Location = Database['public']['Tables']['locations']['Row'] & {
  location_requirements: { count: number }[]
}

interface LocationTableProps {
  locations: Location[]
}

export function LocationTable({ locations }: LocationTableProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`配属箇所「${name}」を削除しますか？\n要件設定やシフト割り当てがある場合は削除できません。`)) return

    setDeleting(id)
    try {
      await deleteLocation(id)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  if (locations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        配属箇所が見つかりません
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
                業務種別
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                配属箇所名
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                コード
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                要件設定数
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
            {locations.map((location) => {
              const requirementCount = location.location_requirements?.[0]?.count || 0
              return (
                <tr
                  key={location.id}
                  className={`hover:bg-gray-50 ${!location.is_active ? 'opacity-50 bg-gray-50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {location.business_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{location.location_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-blue-600">{location.code}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      href={`/locations/${location.id}/requirements`}
                      className="text-blue-600 hover:underline"
                    >
                      {requirementCount} 件
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        location.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {location.is_active ? '使用中' : '非使用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/locations/${location.id}/requirements`}
                        className="text-purple-600 hover:text-purple-900"
                      >
                        要件設定
                      </Link>
                      <Link
                        href={`/locations/${location.id}/edit`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(location.id, location.location_name)}
                        disabled={deleting === location.id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {deleting === location.id ? '削除中...' : '削除'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">
          表示中: {locations.filter((l) => l.is_active).length} 件（使用中） / 全{' '}
          {locations.length} 件
        </p>
      </div>
    </div>
  )
}
