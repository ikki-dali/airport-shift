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
import { Search, X, Edit, Link as LinkIcon, Copy, Check, Mail, Send } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/types/database'
import { sendShiftRequestEmail, sendBulkShiftRequestEmails } from '@/lib/actions/staff-tokens'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'

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
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null)
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set())
  const [isBulkSending, setIsBulkSending] = useState(false)

  // フィルタリング処理
  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      // テキスト検索
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        s.name.toLowerCase().includes(searchLower) ||
        s.employee_number?.toLowerCase().includes(searchLower) ||
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

  const copyTokenUrl = async (staffId: string, token: string | null) => {
    if (!token) {
      alert('このスタッフにはトークンが発行されていません')
      return
    }

    const baseUrl = window.location.origin
    const url = `${baseUrl}/shift-request/${token}`

    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(staffId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      alert('URLのコピーに失敗しました')
    }
  }

  const sendEmail = async (staffId: string, staffName: string) => {
    setSendingEmailId(staffId)
    try {
      const result = await sendShiftRequestEmail(staffId)
      if (result.success) {
        toast.success(`${staffName} さんにメールを送信しました`)
      } else {
        toast.error(result.error || 'メール送信に失敗しました')
      }
    } catch (error) {
      console.error('Failed to send email:', error)
      toast.error('メール送信に失敗しました')
    } finally {
      setSendingEmailId(null)
    }
  }

  const toggleStaffSelection = (staffId: string) => {
    setSelectedStaffIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(staffId)) {
        newSet.delete(staffId)
      } else {
        newSet.add(staffId)
      }
      return newSet
    })
  }

  const toggleAllSelection = () => {
    if (selectedStaffIds.size === eligibleStaff.length) {
      setSelectedStaffIds(new Set())
    } else {
      setSelectedStaffIds(new Set(eligibleStaff.map((s) => s.id)))
    }
  }

  // メール送信可能なスタッフ（在籍中 & メールアドレスあり）
  const eligibleStaff = useMemo(() => {
    return filteredStaff.filter((s) => s.is_active && s.email)
  }, [filteredStaff])

  const sendBulkEmails = async () => {
    if (selectedStaffIds.size === 0) {
      toast.error('スタッフを選択してください')
      return
    }

    setIsBulkSending(true)
    try {
      const result = await sendBulkShiftRequestEmails(Array.from(selectedStaffIds))
      if (result.success) {
        toast.success(`${result.successCount}件のメールを送信しました`)
        setSelectedStaffIds(new Set())
      } else {
        toast.error(`${result.successCount}件成功、${result.failCount}件失敗しました`)
      }
    } catch (error) {
      console.error('Failed to send bulk emails:', error)
      toast.error('一括送信に失敗しました')
    } finally {
      setIsBulkSending(false)
    }
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

      {/* 検索結果サマリーと一括操作 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {filteredStaff.length} 件 / 全 {staff.length} 件のスタッフ（在籍中:{' '}
          {filteredStaff.filter((s) => s.is_active).length} 名）
          {selectedStaffIds.size > 0 && (
            <span className="ml-4 text-blue-600 font-medium">
              {selectedStaffIds.size} 名選択中
            </span>
          )}
        </div>

        {eligibleStaff.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllSelection}
              disabled={isBulkSending}
            >
              {selectedStaffIds.size === eligibleStaff.length ? '全解除' : '全選択'}
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={sendBulkEmails}
              disabled={selectedStaffIds.size === 0 || isBulkSending}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {isBulkSending
                ? '送信中...'
                : `選択したスタッフに一括送信 (${selectedStaffIds.size})`}
            </Button>
          </div>
        )}
      </div>

      {/* スタッフテーブル */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedStaffIds.size === eligibleStaff.length && eligibleStaff.length > 0}
                  onCheckedChange={toggleAllSelection}
                  disabled={isBulkSending || eligibleStaff.length === 0}
                />
              </TableHead>
              <TableHead className="w-32">社員番号</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>役職</TableHead>
              <TableHead>タグ</TableHead>
              <TableHead className="w-24">状態</TableHead>
              <TableHead className="w-40">シフト希望URL</TableHead>
              <TableHead className="w-32">メール送信</TableHead>
              <TableHead className="w-20 text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-gray-500">
                  該当するスタッフが見つかりません
                </TableCell>
              </TableRow>
            ) : (
              filteredStaff.map((s) => {
                const role = roles.find((r) => r.id === s.role_id)
                const staffTags = s.tags
                  ? tags.filter((t) => s.tags?.includes(t.id))
                  : []
                const isEligible = s.is_active && !!s.email

                return (
                  <TableRow
                    key={s.id}
                    className={`hover:bg-gray-50 ${!s.is_active ? 'opacity-60' : ''}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedStaffIds.has(s.id)}
                        onCheckedChange={() => toggleStaffSelection(s.id)}
                        disabled={!isEligible || isBulkSending}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/staff/${s.id}`}
                        className="font-mono text-blue-600 hover:underline"
                      >
                        {s.employee_number}
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
                    <TableCell>
                      {s.request_token ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyTokenUrl(s.id, s.request_token)}
                          className="gap-2"
                        >
                          {copiedId === s.id ? (
                            <>
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">コピー済み</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              <span>URLコピー</span>
                            </>
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">未発行</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {s.email ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendEmail(s.id, s.name)}
                          disabled={sendingEmailId === s.id || !s.is_active}
                          className="gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          {sendingEmailId === s.id ? '送信中...' : 'メール送信'}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-400">メールアドレス未登録</span>
                      )}
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
