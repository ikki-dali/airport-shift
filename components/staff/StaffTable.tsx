'use client'

import { useState } from 'react'
import { deleteStaff, toggleStaffActive } from '@/lib/actions/staff'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

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
      <div className="bg-card rounded-lg shadow-card p-12 text-center text-muted-foreground">
        スタッフが見つかりません
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
                社員番号
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                氏名
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                メール
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                電話
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                役職
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground tracking-wide">
                タグ
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
            {staff.map((s) => (
              <tr
                key={s.id}
                className={`hover:bg-muted/30 transition-colors ${!s.is_active ? 'opacity-50 bg-muted/50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/staff/${s.id}`}
                    className="text-primary hover:underline font-mono"
                  >
                    {s.employee_number}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-foreground">{s.name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {s.email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                  {s.phone || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {s.roles ? (
                    <Badge variant="info">
                      {s.roles.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">未設定</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {s.tags && s.tags.length > 0 ? (
                      s.tags.map((tag) => (
                        <Badge key={tag} variant="muted">
                          {tag}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground text-sm">なし</span>
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
                      className="text-primary hover:text-primary/80"
                    >
                      編集
                    </Link>
                    <button
                      onClick={() => handleDelete(s.id, s.name)}
                      disabled={deleting === s.id}
                      className="text-destructive hover:text-destructive/80 disabled:opacity-50"
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
      <div className="px-4 py-3 bg-muted/30 border-t">
        <p className="text-sm text-muted-foreground">
          表示中: {staff.filter((s) => s.is_active).length} 件（在籍中） / 全{' '}
          {staff.length} 件
        </p>
      </div>
    </div>
  )
}
