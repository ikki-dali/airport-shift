'use client'

import { useState } from 'react'
import { deleteTag } from '@/lib/actions/tags'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/types/database'

type Tag = Database['public']['Tables']['tags']['Row']

interface TagTableProps {
  tags: Tag[]
}

export function TagTable({ tags }: TagTableProps) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`タグ「${name}」を削除しますか？`)) {
      return
    }

    setDeleting(id)
    try {
      await deleteTag(id)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '削除に失敗しました')
    } finally {
      setDeleting(null)
    }
  }

  if (tags.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        タグが登録されていません
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        全 {tags.length} 件のタグ
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-64">タグ名</TableHead>
              <TableHead>説明</TableHead>
              <TableHead className="w-32">作成日</TableHead>
              <TableHead className="w-24 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tags.map((tag) => (
              <TableRow key={tag.id} className="hover:bg-gray-50">
                <TableCell>
                  <Badge variant="secondary" className="font-medium">
                    {tag.name}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600">
                  {tag.description || <span className="text-gray-400">-</span>}
                </TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(tag.created_at).toLocaleDateString('ja-JP')}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/tags/${tag.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag.id, tag.name)}
                      disabled={deleting === tag.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {deleting === tag.id ? (
                        '...'
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
