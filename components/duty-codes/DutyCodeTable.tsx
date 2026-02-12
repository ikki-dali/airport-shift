'use client'

import { useState, useMemo } from 'react'
import { parseDutyCode } from '@/lib/duty-code-parser'
import type { Database } from '@/types/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DutyCodeFormDialog } from './DutyCodeFormDialog'
import { DeleteDutyCodeDialog } from './DeleteDutyCodeDialog'
import { Plus, Pencil, Trash2, Clock, Hourglass, Coffee, Search } from 'lucide-react'

type DutyCode = Database['public']['Tables']['duty_codes']['Row']

interface DutyCodeTableProps {
  dutyCodes: DutyCode[]
}

type SortOption = 'code' | 'start_time' | 'duration' | 'category'

export function DutyCodeTable({ dutyCodes }: DutyCodeTableProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('code')

  // ダイアログの状態管理
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingDutyCode, setEditingDutyCode] = useState<DutyCode | undefined>()
  const [deletingDutyCode, setDeletingDutyCode] = useState<DutyCode | null>(null)

  const categories = useMemo(() => {
    const cats = new Set(dutyCodes.map((dc) => dc.category))
    return Array.from(cats).sort()
  }, [dutyCodes])

  const filteredDutyCodes = useMemo(() => {
    let filtered = dutyCodes

    // カテゴリフィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((dc) => dc.category === selectedCategory)
    }

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (dc) =>
          dc.code.toLowerCase().includes(query) ||
          dc.category.toLowerCase().includes(query)
      )
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'code':
          return a.code.localeCompare(b.code)
        case 'start_time':
          return a.start_time.localeCompare(b.start_time)
        case 'duration':
          const aDuration = a.duration_hours * 60 + a.duration_minutes
          const bDuration = b.duration_hours * 60 + b.duration_minutes
          return bDuration - aDuration
        case 'category':
          return a.category.localeCompare(b.category)
        default:
          return 0
      }
    })

    return sorted
  }, [dutyCodes, selectedCategory, searchQuery, sortBy])

  // 勤務時間をフォーマット
  const formatDuration = (hours: number, minutes: number) => {
    if (minutes === 0) return `${hours}時間`
    return `${hours}時間${minutes}分`
  }

  // 休憩時間をフォーマット
  const formatBreak = (minutes: number) => {
    if (minutes === 0) return 'なし'
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return mins === 0 ? `${hours}時間` : `${hours}時間${mins}分`
    }
    return `${minutes}分`
  }

  // CSVエクスポート
  const exportToCSV = () => {
    const headers = ['コード', 'カテゴリ', '開始時刻', '終了時刻', '勤務時間', '休憩時間']
    const rows = filteredDutyCodes.map((dc) => [
      dc.code,
      dc.category,
      dc.start_time,
      dc.end_time,
      `${dc.duration_hours}:${dc.duration_minutes.toString().padStart(2, '0')}`,
      dc.break_minutes.toString(),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `勤務記号_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* 検索バー */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="勤務記号コードまたはカテゴリで検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* カテゴリフィルター */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
                size="sm"
              >
                すべて ({dutyCodes.length})
              </Button>
              {categories.map((cat) => {
                const count = dutyCodes.filter((dc) => dc.category === cat).length
                return (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    onClick={() => setSelectedCategory(cat)}
                    size="sm"
                  >
                    {cat} ({count})
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ツールバー */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <p className="text-sm text-gray-600">
            表示中: <span className="font-semibold text-gray-900">{filteredDutyCodes.length}</span> 件
            {selectedCategory !== 'all' || searchQuery ? (
              <span> / 全 {dutyCodes.length} 件</span>
            ) : null}
          </p>

          {/* 新規追加ボタン */}
          <Button
            onClick={() => {
              setEditingDutyCode(undefined)
              setFormDialogOpen(true)
            }}
            size="sm"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            新規追加
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* ソート */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="並び替え"
          >
            <option value="code">コード順</option>
            <option value="start_time">開始時刻順</option>
            <option value="duration">勤務時間順</option>
            <option value="category">カテゴリ順</option>
          </select>

          {/* エクスポート */}
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            CSV出力
          </Button>
        </div>
      </div>

      {/* カードグリッド */}
      {filteredDutyCodes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-400">
              {searchQuery
                ? '検索条件に一致する勤務記号が見つかりません'
                : '勤務記号が見つかりません'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredDutyCodes.map((dutyCode) => {
            const parsed = parseDutyCode(dutyCode.code)
            return (
              <Card
                key={dutyCode.id}
                className="group hover:shadow-md transition-all"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl font-mono font-bold tracking-tight">
                        {dutyCode.code}
                      </span>
                      <Badge variant="outline" className="text-[11px] font-normal">
                        {dutyCode.category}
                      </Badge>
                      {parsed.isOvernight && (
                        <Badge variant="secondary" className="text-[11px] font-normal">
                          日またぎ
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingDutyCode(dutyCode)
                          setFormDialogOpen(true)
                        }}
                        className="h-7 w-7 p-0"
                        aria-label="勤務記号を編集"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeletingDutyCode(dutyCode)
                          setDeleteDialogOpen(true)
                        }}
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                        aria-label="勤務記号を削除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      {parsed.startTime} – {parsed.endTime}
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-1.5">
                      <Hourglass className="h-3.5 w-3.5 shrink-0" />
                      {formatDuration(parsed.durationHours, parsed.durationMinutes)}
                    </span>
                    <span className="text-gray-200">|</span>
                    <span className="flex items-center gap-1.5">
                      <Coffee className="h-3.5 w-3.5 shrink-0" />
                      {formatBreak(parsed.breakMinutes)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* ダイアログ */}
      <DutyCodeFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        dutyCode={editingDutyCode}
        mode={editingDutyCode ? 'edit' : 'create'}
      />

      <DeleteDutyCodeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        dutyCode={deletingDutyCode}
      />
    </div>
  )
}
