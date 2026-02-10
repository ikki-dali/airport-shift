'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, SkipForward } from 'lucide-react'
import { toast } from 'sonner'
import { parseStaffImportFile, type ParsedStaffRow, type StaffImportParseResult } from '@/lib/parsers/staff-import-parser'
import { bulkImportStaff, type BulkImportResult, type BulkImportStaffRow } from '@/lib/actions/staff'

interface Role {
  id: string
  name: string
}

interface Tag {
  id: string
  name: string
}

interface BulkStaffImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  roles: Role[]
  tags: Tag[]
  onSuccess: () => void
}

type Step = 'upload' | 'preview' | 'result'

export function BulkStaffImportModal({
  open,
  onOpenChange,
  roles,
  tags,
  onSuccess,
}: BulkStaffImportModalProps) {
  const [step, setStep] = useState<Step>('upload')
  const [isDragging, setIsDragging] = useState(false)
  const [parseResult, setParseResult] = useState<StaffImportParseResult | null>(null)
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null)
  const [loading, setLoading] = useState(false)

  // リセット処理
  const handleReset = useCallback(() => {
    setStep('upload')
    setParseResult(null)
    setImportResult(null)
    setLoading(false)
    setIsDragging(false)
  }, [])

  // モーダルクローズ
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) handleReset()
    onOpenChange(open)
  }, [onOpenChange, handleReset])

  // ファイルバリデーション
  const validateFile = (file: File): string | null => {
    const validExtensions = ['.xlsx', '.xls', '.csv']
    const fileName = file.name.toLowerCase()
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext))
    if (!isValid) return 'Excel (.xlsx) または CSV (.csv) ファイルを選択してください'

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) return 'ファイルサイズが10MBを超えています'

    return null
  }

  // ファイル処理
  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    setLoading(true)
    try {
      const result = await parseStaffImportFile(file)
      setParseResult(result)

      if (result.errors.length > 0 && result.rows.length === 0) {
        toast.error('ファイルのパースに失敗しました')
      } else {
        setStep('preview')
      }
    } catch {
      toast.error('ファイルの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  // D&Dハンドラー
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  // ファイル選択ハンドラー
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }, [handleFile])

  // 一括登録実行
  const handleImport = useCallback(async () => {
    if (!parseResult) return

    const validRows = parseResult.rows.filter((r) => !r.error)
    if (validRows.length === 0) {
      toast.error('登録可能なデータがありません')
      return
    }

    // 役職名→IDマッピング
    const resolveRoleId = (roleName?: string): string | null => {
      if (!roleName) return null
      const role = roles.find((r) => r.name === roleName)
      return role?.id || null
    }

    // タグ名→IDマッピング
    const resolveTagIds = (tagNames?: string[]): string[] => {
      if (!tagNames || tagNames.length === 0) return []
      return tagNames
        .map((name) => tags.find((t) => t.name === name)?.id)
        .filter((id): id is string => !!id)
    }

    setLoading(true)
    try {
      const importRows: BulkImportStaffRow[] = validRows.map((row) => ({
        employee_number: row.employee_number,
        name: row.name,
        email: row.email,
        phone: row.phone,
        role_id: resolveRoleId(row.roleName),
        tags: resolveTagIds(row.tagNames),
      }))

      const rowNumbers = validRows.map((r) => r.rowNumber)
      const result = await bulkImportStaff(importRows, rowNumbers)
      setImportResult(result)
      setStep('result')

      if (result.successCount > 0) {
        onSuccess()
      }
    } catch (e: any) {
      toast.error(`登録に失敗しました: ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [parseResult, roles, tags, onSuccess])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            スタッフ一括登録
          </DialogTitle>
          <DialogDescription>
            Excel (.xlsx) または CSV (.csv) ファイルからスタッフを一括登録します
          </DialogDescription>
        </DialogHeader>

        {/* ステップインジケーター */}
        <div className="flex items-center gap-2 mb-4">
          {(['upload', 'preview', 'result'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                step === s ? 'bg-primary text-primary-foreground' :
                (['upload', 'preview', 'result'].indexOf(step) > i) ? 'bg-green-500 text-white' :
                'bg-muted text-muted-foreground'
              }`}>
                {i + 1}
              </div>
              <span className={`text-sm ${step === s ? 'font-medium' : 'text-muted-foreground'}`}>
                {s === 'upload' ? 'アップロード' : s === 'preview' ? 'プレビュー' : '完了'}
              </span>
              {i < 2 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 'upload' && (
          <div className="space-y-4">
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-400'
              }`}
              onClick={() => document.getElementById('bulk-staff-file-input')?.click()}
            >
              <Upload className={`h-10 w-10 mx-auto mb-4 ${isDragging ? 'text-primary' : 'text-gray-400'}`} />
              <p className="text-sm text-muted-foreground mb-2">
                ファイルをドラッグ&ドロップ、またはクリックして選択
              </p>
              <p className="text-xs text-muted-foreground/70">
                対応形式: Excel (.xlsx), CSV (.csv) / 最大 10MB
              </p>
              <input
                id="bulk-staff-file-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {loading && (
              <div className="text-center text-sm text-muted-foreground">
                ファイルを読み込み中...
              </div>
            )}

            {/* パースエラー表示（ファイル構造エラー） */}
            {parseResult && parseResult.errors.length > 0 && step === 'upload' && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="text-sm font-medium text-destructive mb-2">ファイルエラー:</p>
                <ul className="text-sm text-red-700 space-y-1">
                  {parseResult.errors.map((err, i) => (
                    <li key={i}>- {err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* フォーマット説明 */}
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">ファイルフォーマット:</p>
              <p className="text-xs text-muted-foreground mb-2">1行目をヘッダーとして読み取ります。以下の列名に対応:</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><span className="font-medium">社員番号</span> (必須)</div>
                <div><span className="font-medium">氏名</span> (必須)</div>
                <div><span className="font-medium">メール</span></div>
                <div><span className="font-medium">電話番号</span></div>
                <div><span className="font-medium">役職</span> (名前で指定)</div>
                <div><span className="font-medium">タグ</span> (カンマ区切り)</div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Preview */}
        {step === 'preview' && parseResult && (
          <div className="space-y-4">
            {/* サマリ */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary/5 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-primary">{parseResult.rows.length}</div>
                <div className="text-xs text-primary">読み取り件数</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {parseResult.rows.filter((r) => !r.error).length}
                </div>
                <div className="text-xs text-green-600">登録可能</div>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-700">
                  {parseResult.rows.filter((r) => r.error).length}
                </div>
                <div className="text-xs text-red-600">エラー</div>
              </div>
            </div>

            {/* 警告表示 */}
            {parseResult.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm font-medium text-yellow-800 mb-1">警告:</p>
                <ul className="text-xs text-yellow-700 space-y-1">
                  {parseResult.warnings.slice(0, 10).map((w, i) => (
                    <li key={i}>- {w}</li>
                  ))}
                  {parseResult.warnings.length > 10 && (
                    <li>... 他 {parseResult.warnings.length - 10} 件</li>
                  )}
                </ul>
              </div>
            )}

            {/* 未マッチング警告 */}
            {renderMatchWarnings(parseResult.rows, roles, tags)}

            {/* プレビューテーブル */}
            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-muted/50">
                  <tr>
                    <th className="p-2 text-left border-b">行</th>
                    <th className="p-2 text-left border-b">社員番号</th>
                    <th className="p-2 text-left border-b">氏名</th>
                    <th className="p-2 text-left border-b">メール</th>
                    <th className="p-2 text-left border-b">役職</th>
                    <th className="p-2 text-left border-b">タグ</th>
                    <th className="p-2 text-left border-b">状態</th>
                  </tr>
                </thead>
                <tbody>
                  {parseResult.rows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.error ? 'bg-destructive/5' : 'hover:bg-muted/30'}
                    >
                      <td className="p-2 border-b text-muted-foreground">{row.rowNumber}</td>
                      <td className="p-2 border-b font-mono">{row.employee_number}</td>
                      <td className="p-2 border-b">{row.name}</td>
                      <td className="p-2 border-b text-muted-foreground">{row.email || '-'}</td>
                      <td className="p-2 border-b">
                        {row.roleName ? (
                          <span className={roles.find((r) => r.name === row.roleName) ? 'text-primary' : 'text-orange-500'}>
                            {row.roleName}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-2 border-b text-xs">
                        {row.tagNames?.join(', ') || '-'}
                      </td>
                      <td className="p-2 border-b">
                        {row.error ? (
                          <span className="text-red-600 text-xs">{row.error}</span>
                        ) : (
                          <span className="text-green-600 text-xs">OK</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* アクションボタン */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleReset}>
                やり直す
              </Button>
              <Button
                onClick={handleImport}
                disabled={loading || parseResult.rows.filter((r) => !r.error).length === 0}
              >
                {loading ? '登録中...' : `${parseResult.rows.filter((r) => !r.error).length}件を登録`}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Result */}
        {step === 'result' && importResult && (
          <div className="space-y-4">
            {/* 結果サマリ */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-700">{importResult.successCount}</div>
                <div className="text-sm text-green-600">登録成功</div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <SkipForward className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
                <div className="text-2xl font-bold text-yellow-700">{importResult.skipCount}</div>
                <div className="text-sm text-yellow-600">スキップ（重複）</div>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-600" />
                <div className="text-2xl font-bold text-red-700">
                  {importResult.errors.filter((e) => !e.message.includes('スキップ')).length}
                </div>
                <div className="text-sm text-red-600">エラー</div>
              </div>
            </div>

            {/* エラー詳細 */}
            {importResult.errors.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-4 max-h-[200px] overflow-y-auto">
                <p className="text-sm font-medium mb-2">詳細:</p>
                <ul className="text-xs space-y-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i} className="text-muted-foreground">
                      {err.row}行目: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                別のファイルを登録
              </Button>
              <Button onClick={() => handleOpenChange(false)}>
                閉じる
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * 役職・タグの未マッチング警告を表示
 */
function renderMatchWarnings(rows: ParsedStaffRow[], roles: Role[], tags: Tag[]) {
  const unmatchedRoles = new Set<string>()
  const unmatchedTags = new Set<string>()

  rows.filter((r) => !r.error).forEach((row) => {
    if (row.roleName && !roles.find((r) => r.name === row.roleName)) {
      unmatchedRoles.add(row.roleName)
    }
    row.tagNames?.forEach((tagName) => {
      if (!tags.find((t) => t.name === tagName)) {
        unmatchedTags.add(tagName)
      }
    })
  })

  if (unmatchedRoles.size === 0 && unmatchedTags.size === 0) return null

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
      <p className="text-sm font-medium text-orange-800 mb-1">マッチング警告:</p>
      {unmatchedRoles.size > 0 && (
        <p className="text-xs text-orange-700">
          未登録の役職: {Array.from(unmatchedRoles).join(', ')}（役職なしとして登録されます）
        </p>
      )}
      {unmatchedTags.size > 0 && (
        <p className="text-xs text-orange-700">
          未登録のタグ: {Array.from(unmatchedTags).join(', ')}（タグなしとして登録されます）
        </p>
      )}
    </div>
  )
}
