'use client'

import { useState } from 'react'
import { deleteLocationRequirement } from '@/lib/actions/location-requirements'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'
import { toast } from 'sonner'

type LocationRequirement = Database['public']['Tables']['location_requirements']['Row'] & {
  duty_codes: {
    id: string
    code: string
    start_time: string | null
    end_time: string | null
    category: string
    description?: string | null
  } | null
}

interface RequirementListProps {
  requirements: LocationRequirement[]
  locationId: string
  onEdit?: (requirement: LocationRequirement) => void
}

const DAYS_OF_WEEK = ['日', '月', '火', '水', '木', '金', '土']

export function RequirementList({
  requirements,
  locationId,
  onEdit,
}: RequirementListProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (!confirm('この要件設定を削除しますか？')) return

    setDeleting(id)
    try {
      await deleteLocationRequirement(id, locationId)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  const getPatternLabel = (req: LocationRequirement) => {
    if (req.specific_date) {
      return `特定日: ${req.specific_date}`
    }
    if (req.day_of_week !== null) {
      return `${DAYS_OF_WEEK[req.day_of_week]}曜`
    }
    return 'デフォルト'
  }

  const getPatternColor = (req: LocationRequirement) => {
    if (req.specific_date) {
      return 'bg-orange-100 text-orange-800'
    }
    if (req.day_of_week !== null) {
      return 'bg-blue-100 text-blue-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  if (requirements.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        要件設定がありません
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
                勤務記号
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                必要人数
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                責任者
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                必要タグ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                適用パターン
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {requirements.map((req) => (
              <tr key={req.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <span className="font-mono font-semibold text-blue-600">
                      {req.duty_codes?.code}
                    </span>
                    {req.duty_codes?.start_time && req.duty_codes?.end_time && (
                      <span className="text-xs text-gray-500">
                        {req.duty_codes.start_time} - {req.duty_codes.end_time}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-medium text-gray-900">
                    {req.required_staff_count} 名
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {req.required_responsible_count} 名
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {req.required_tags && req.required_tags.length > 0 ? (
                      req.required_tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800"
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
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getPatternColor(req)}`}
                  >
                    {getPatternLabel(req)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit && onEdit(req)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(req.id)}
                      disabled={deleting === req.id}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {deleting === req.id ? '削除中...' : '削除'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600">全 {requirements.length} 件の要件設定</p>
      </div>
    </div>
  )
}
