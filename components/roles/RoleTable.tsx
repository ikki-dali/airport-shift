'use client'

import { useState } from 'react'
import { deleteRole } from '@/lib/actions/roles'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

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
    <div className="bg-card rounded-lg shadow-card overflow-hidden">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
              役職名
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
              責任者
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
              優先度
            </th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
              作成日
            </th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-muted-foreground tracking-wide">
              操作
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {roles.map((role) => (
            <tr key={role.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-foreground">{role.name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {role.is_responsible ? (
                  <Badge variant="success">
                    ✓ 可能
                  </Badge>
                ) : (
                  <Badge variant="muted">
                    - 不可
                  </Badge>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                {role.priority}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {new Date(role.created_at).toLocaleDateString('ja-JP')}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => router.push(`/roles/${role.id}/edit`)}
                  className="text-primary hover:text-primary/80 mr-4"
                >
                  編集
                </button>
                <button
                  onClick={() => handleDelete(role.id, role.name)}
                  disabled={deleting === role.id}
                  className="text-destructive hover:text-destructive/80 disabled:opacity-50"
                >
                  {deleting === role.id ? '削除中...' : '削除'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {roles.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          役職が登録されていません
        </div>
      )}
    </div>
  )
}
