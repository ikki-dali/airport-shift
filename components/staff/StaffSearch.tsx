'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, X, Edit } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Staff = Database['public']['Tables']['staff']['Row']
type Role = Database['public']['Tables']['roles']['Row']
type Tag = Database['public']['Tables']['tags']['Row']

interface StaffSearchProps {
  staff: Staff[]
  roles: Role[]
  tags: Tag[]
}

export function StaffSearch({ staff, roles, tags }: StaffSearchProps) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // フィルタリング処理
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      // テキスト検索
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(searchLower) ||
        s.employee_id?.toLowerCase().includes(searchLower) ||
        s.email?.toLowerCase().includes(searchLower)

      // 役職フィルタ
      const matchesRole = roleFilter === 'all' || s.role_id === roleFilter

      // 在籍状況フィルタ
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.is_active) ||
        (statusFilter === 'inactive' && !s.is_active)

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [staff, search, roleFilter, statusFilter])

  const handleReset = () => {
    setSearch('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  return (
    <div className="space-y-4">
      {/* 検索フィルター */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="スタッフ名または社員番号で検索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="役職でフィルタ" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべての役職</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.id}>
                {role.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-48">
            <SelectValue placeholder="在籍状況" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべて</SelectItem>
            <SelectItem value="active">在籍中のみ</SelectItem>
            <SelectItem value="inactive">退職のみ</SelectItem>
          </SelectContent>
        </Select>

        {(search || roleFilter !== 'all' || statusFilter !== 'all') && (
          <Button variant="ghost" onClick={handleReset}>
            <X className="h-4 w-4 mr-2" />
            リセット
          </Button>
        )}
      </div>

      {/* 検索結果サマリー */}
      <div className="text-sm text-gray-600">
        {filteredStaff.length} 件 / 全 {staff.length} 件のスタッフ（在籍中:{' '}
        {filteredStaff.filter((s) => s.is_active).length} 名）
      </div>

      {/* スタッフテーブル */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-32">社員番号</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>役職</TableHead>
              <TableHead>タグ</TableHead>
              <TableHead className="w-24">状態</TableHead>
              <TableHead className="w-20 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  該当するスタッフが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((s) => {
                const role = roles.find((r) => r.id === s.role_id)
                const staffTags = s.tag_ids
                  ? tags.filter((t) => s.tag_ids?.includes(t.id))
                  : []

                return (
                  <TableRow
                    key={s.id}
                    className={`hover:bg-gray-50 ${!s.is_active ? 'opacity-60' : ''}`}
                  >
                    <TableCell>
                      <Link
                        href={`/staff/${s.id}`}
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {s.employee_id}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      {role ? (
                        <Badge variant="secondary">{role.name}</Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">未設定</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {staffTags.length > 0 ? (
                          staffTags.slice(0, 3).map((tag) => (
                            <Badge key={tag.id} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                        {staffTags.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{staffTags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.is_active ? 'default' : 'secondary'}>
                        {s.is_active ? '在籍中' : '退職'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/staff/${s.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
