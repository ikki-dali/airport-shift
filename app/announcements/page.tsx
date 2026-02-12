'use client'

import { useState, useEffect, useMemo } from 'react'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Eye,
  ShieldCheck,
  Users,
  User,
  Search,
  Check,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getStaff, type StaffWithRole } from '@/lib/actions/staff'

// --- 型定義 ---

type Priority = 'high' | 'normal'
type Target = 'all' | 'selected'

interface Announcement {
  id: string
  title: string
  body: string
  priority: Priority
  requires_ack: boolean
  target: Target
  target_staff_ids: string[]
  target_staff_names: string[]
  published_at: string
  created_at: string
}

// --- デモデータ ---

const DEMO_ANNOUNCEMENTS: Announcement[] = [
  {
    id: '1',
    title: '保安検査エリアで不審物対応発生',
    body: '2月8日(土) 10:30頃、保安検査A-1レーンにて不審物の報告があり、対応を実施しました。該当エリアは約40分間閉鎖され、現在は通常運用に復帰しています。',
    priority: 'high',
    requires_ack: true,
    target: 'all',
    target_staff_ids: [],
    target_staff_names: [],
    published_at: '2026-02-08T12:00:00+09:00',
    created_at: '2026-02-08T11:45:00+09:00',
  },
  {
    id: '2',
    title: '2月後半のシフト提出期限のお知らせ',
    body: '2月16日〜28日分のシフト希望提出期限は 2月11日(火) 23:59 です。期限を過ぎると自動割り当てとなりますのでご注意ください。',
    priority: 'high',
    requires_ack: true,
    target: 'all',
    target_staff_ids: [],
    target_staff_names: [],
    published_at: '2026-02-07T18:00:00+09:00',
    created_at: '2026-02-07T17:30:00+09:00',
  },
  {
    id: '3',
    title: '北ターミナル3Fエスカレーター点検のお知らせ',
    body: '2月10日(月) 22:00〜翌5:00の間、北ターミナル3F上りエスカレーターが点検のため停止します。夜勤帯のスタッフはエレベーターまたは階段をご利用ください。',
    priority: 'normal',
    requires_ack: false,
    target: 'all',
    target_staff_ids: [],
    target_staff_names: [],
    published_at: '2026-02-07T10:00:00+09:00',
    created_at: '2026-02-07T09:30:00+09:00',
  },
  {
    id: '4',
    title: '制服クリーニング回収日変更',
    body: '2月より制服クリーニングの回収日が毎週火曜・金曜に変更となります（旧：月曜・木曜）。回収ボックスは従来通り1F更衣室前に設置してあります。',
    priority: 'normal',
    requires_ack: false,
    target: 'all',
    target_staff_ids: [],
    target_staff_names: [],
    published_at: '2026-02-05T14:00:00+09:00',
    created_at: '2026-02-05T13:45:00+09:00',
  },
]

// --- 空フォーム ---

const EMPTY_FORM = {
  title: '',
  body: '',
  priority: 'normal' as Priority,
  requires_ack: false,
  target: 'all' as Target,
  target_staff_ids: [] as string[],
}

// --- メインコンポーネント ---

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(DEMO_ANNOUNCEMENTS)
  const [staffList, setStaffList] = useState<StaffWithRole[]>([])
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewItem, setPreviewItem] = useState<Announcement | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [staffSearch, setStaffSearch] = useState('')

  // スタッフ一覧を取得
  useEffect(() => {
    getStaff({ isActive: true }).then(setStaffList).catch(() => {})
  }, [])

  const filteredStaff = useMemo(() => {
    if (!staffSearch.trim()) return staffList
    const q = staffSearch.toLowerCase()
    return staffList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.employee_number && s.employee_number.toLowerCase().includes(q))
    )
  }, [staffList, staffSearch])

  const toggleStaff = (id: string) => {
    setForm((prev) => ({
      ...prev,
      target_staff_ids: prev.target_staff_ids.includes(id)
        ? prev.target_staff_ids.filter((sid) => sid !== id)
        : [...prev.target_staff_ids, id],
    }))
  }

  const handleCreate = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setStaffSearch('')
    setFormOpen(true)
  }

  const handleEdit = (item: Announcement) => {
    setEditingId(item.id)
    setForm({
      title: item.title,
      body: item.body,
      priority: item.priority,
      requires_ack: item.requires_ack,
      target: item.target,
      target_staff_ids: item.target_staff_ids,
    })
    setStaffSearch('')
    setFormOpen(true)
  }

  const handleSave = () => {
    if (!form.title.trim() || !form.body.trim()) return
    if (form.target === 'selected' && form.target_staff_ids.length === 0) return

    const targetNames = form.target === 'selected'
      ? form.target_staff_ids.map((id) => staffList.find((s) => s.id === id)?.name || '').filter(Boolean)
      : []

    if (editingId) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === editingId
            ? { ...a, ...form, target_staff_names: targetNames }
            : a
        )
      )
    } else {
      const now = new Date().toISOString()
      setAnnouncements((prev) => [
        {
          id: `new-${Date.now()}`,
          ...form,
          target_staff_names: targetNames,
          published_at: now,
          created_at: now,
        },
        ...prev,
      ])
    }
    setFormOpen(false)
  }

  const handleDelete = () => {
    if (deletingId) {
      setAnnouncements((prev) => prev.filter((a) => a.id !== deletingId))
    }
    setDeleteOpen(false)
    setDeletingId(null)
  }

  const deletingItem = announcements.find((a) => a.id === deletingId)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="h-6 w-6" />
              お知らせ
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              モバイルアプリのお知らせタブに配信されます
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            新規作成
          </Button>
        </div>

        {/* 件数 */}
        <p className="text-sm text-gray-500">
          {announcements.length}件のお知らせ
        </p>

        {/* 一覧 */}
        {announcements.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Megaphone className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-400">お知らせはありません</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {announcements.map((item) => (
              <Card key={item.id} className="group hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {item.priority === 'high' && (
                          <Badge variant="destructive" className="text-[11px]">
                            重要
                          </Badge>
                        )}
                        {item.requires_ack && (
                          <Badge variant="secondary" className="text-[11px] gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            要確認
                          </Badge>
                        )}
                        {item.target === 'selected' && (
                          <Badge variant="outline" className="text-[11px] gap-1">
                            <User className="h-3 w-3" />
                            {item.target_staff_names.length}名
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {item.body}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(item.published_at), 'M月d日 (E) HH:mm', { locale: ja })}
                      </p>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => {
                          setPreviewItem(item)
                          setPreviewOpen(true)
                        }}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => handleEdit(item)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setDeletingId(item.id)
                          setDeleteOpen(true)
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 作成・編集ダイアログ */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'お知らせを編集' : 'お知らせを作成'}</DialogTitle>
            <DialogDescription>
              保存するとモバイルアプリに配信されます。
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="お知らせのタイトル"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">本文</Label>
              <textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="お知らせの内容を入力..."
                rows={5}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="space-y-2">
                <Label>優先度</Label>
                <div className="flex gap-1.5">
                  {(['normal', 'high'] as Priority[]).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`px-4 py-2 rounded-md border text-sm transition-colors ${
                        form.priority === p
                          ? p === 'high'
                            ? 'bg-red-50 text-red-600 border-red-200 font-medium'
                            : 'bg-gray-100 text-gray-900 border-gray-300 font-medium'
                          : 'text-gray-500 border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {p === 'high' ? '重要' : '通常'}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-6">
                <input
                  type="checkbox"
                  checked={form.requires_ack}
                  onChange={(e) => setForm({ ...form, requires_ack: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">確認を求める</span>
              </label>
            </div>

            {/* 送信先 */}
            <div className="space-y-2">
              <Label>送信先</Label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, target: 'all', target_staff_ids: [] })}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm transition-colors ${
                    form.target === 'all'
                      ? 'bg-gray-100 text-gray-900 border-gray-300 font-medium'
                      : 'text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  全員
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, target: 'selected' })}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-md border text-sm transition-colors ${
                    form.target === 'selected'
                      ? 'bg-gray-100 text-gray-900 border-gray-300 font-medium'
                      : 'text-gray-500 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="h-3.5 w-3.5" />
                  個人を選択
                  {form.target === 'selected' && form.target_staff_ids.length > 0 && (
                    <span className="ml-1 text-xs bg-primary text-white px-1.5 py-0.5 rounded-full">
                      {form.target_staff_ids.length}
                    </span>
                  )}
                </button>
              </div>

              {form.target === 'selected' && (
                <div className="border rounded-lg mt-2">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={staffSearch}
                        onChange={(e) => setStaffSearch(e.target.value)}
                        placeholder="名前・社員番号で検索"
                        className="w-full pl-8 pr-3 py-1.5 text-sm border-0 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredStaff.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        {staffList.length === 0 ? 'スタッフを読み込み中...' : '該当なし'}
                      </p>
                    ) : (
                      filteredStaff.map((staff) => {
                        const isSelected = form.target_staff_ids.includes(staff.id)
                        return (
                          <button
                            key={staff.id}
                            type="button"
                            onClick={() => toggleStaff(staff.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                              isSelected ? 'bg-primary/5' : ''
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-primary border-primary'
                                  : 'border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-white" />}
                            </div>
                            <span className="truncate">{staff.name}</span>
                            {staff.employee_number && (
                              <span className="text-xs text-gray-400 shrink-0">
                                {staff.employee_number}
                              </span>
                            )}
                          </button>
                        )
                      })
                    )}
                  </div>
                  {form.target_staff_ids.length > 0 && (
                    <div className="px-3 py-2 border-t bg-gray-50 text-xs text-gray-500">
                      {form.target_staff_ids.length}名を選択中
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              キャンセル
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !form.title.trim() ||
                !form.body.trim() ||
                (form.target === 'selected' && form.target_staff_ids.length === 0)
              }
            >
              {editingId ? '更新' : '配信する'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 削除確認ダイアログ */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>お知らせを削除</DialogTitle>
            <DialogDescription>
              この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          {deletingItem && (
            <div className="py-2">
              <div className="rounded-lg border p-3 bg-gray-50">
                <p className="font-medium text-sm">{deletingItem.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {format(new Date(deletingItem.published_at), 'M月d日 HH:mm', { locale: ja })}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* プレビューダイアログ */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              プレビュー
            </DialogTitle>
            <DialogDescription>
              モバイルアプリでの表示イメージ
            </DialogDescription>
          </DialogHeader>
          {previewItem && (
            <div className="rounded-xl border bg-white p-4 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {previewItem.priority === 'high' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-200">
                      重要
                    </span>
                  )}
                  {previewItem.target === 'selected' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                      <User className="h-3 w-3" />
                      個人宛
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {format(new Date(previewItem.published_at), 'M/d (E)', { locale: ja })}
                </span>
              </div>
              <h3 className="font-bold text-gray-900">{previewItem.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {previewItem.body}
              </p>
              {previewItem.requires_ack && (
                <div className="pt-2 border-t">
                  <div className="w-full py-2.5 rounded-lg bg-teal-600 text-white text-center text-sm font-medium">
                    確認しました
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
