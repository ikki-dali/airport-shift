'use client'

import { useState } from 'react'
import { deleteLocation } from '@/lib/actions/locations'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

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
      <div className="bg-card rounded-lg shadow-card p-12 text-center text-muted-foreground">
        配属箇所が見つかりません
      </div>
    )
  }

  return (
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                業務種別
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                配属箇所名
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                コード
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                要件設定数
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                状態
              </th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground tracking-wide">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {locations.map((location) => {
              const requirementCount = location.location_requirements?.[0]?.count || 0
              return (
                <tr
                  key={location.id}
                  className={`hover:bg-muted/30 transition-colors ${!location.is_active ? 'opacity-50 bg-muted/50' : ''}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="purple">
                      {location.business_type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-foreground">{location.location_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-primary">{location.code}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <Link
                      href={`/locations/${location.id}/requirements`}
                      className="text-primary hover:underline"
                    >
                      {requirementCount} 件
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {location.is_active ? (
                      <Badge variant="success">使用中</Badge>
                    ) : (
                      <Badge variant="muted">非使用</Badge>
                    )}
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
                        className="text-primary hover:text-primary/80"
                      >
                        編集
                      </Link>
                      <button
                        onClick={() => handleDelete(location.id, location.location_name)}
                        disabled={deleting === location.id}
                        className="text-destructive hover:text-destructive/80 disabled:opacity-50"
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
      <div className="px-4 py-3 bg-muted/30 border-t">
        <p className="text-sm text-muted-foreground">
          表示中: {locations.filter((l) => l.is_active).length} 件（使用中） / 全{' '}
          {locations.length} 件
        </p>
      </div>
    </div>
  )
}
