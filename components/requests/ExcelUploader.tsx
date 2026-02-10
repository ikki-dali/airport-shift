'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface ExcelUploaderProps {
  onFileSelect: (file: File) => void
}

export function ExcelUploader({ onFileSelect }: ExcelUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const validateFile = (file: File): string | null => {
    // ファイル形式チェック
    const validExtensions = ['.xlsx', '.xls']
    const fileName = file.name.toLowerCase()
    const isValidExtension = validExtensions.some((ext) => fileName.endsWith(ext))

    if (!isValidExtension) {
      return 'Excel形式のファイル（.xlsx, .xls）を選択してください'
    }

    // ファイルサイズチェック（10MB）
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return 'ファイルサイズが10MBを超えています'
    }

    return null
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    setSelectedFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    const file = e.dataTransfer.files[0]
    if (!file) return

    const error = validateFile(file)
    if (error) {
      toast.error(error)
      return
    }

    setSelectedFile(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.warning('ファイルを選択してください')
      return
    }

    onFileSelect(selectedFile)
  }

  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Excel希望表のアップロード</h2>
        <p className="text-muted-foreground">
          スタッフの希望提出データをExcelファイルから取り込みます
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-200 hover:border-gray-400'
        }`}
      >
        {selectedFile ? (
          <div>
            <div className="text-6xl mb-4">📄</div>
            <p className="text-lg font-medium text-foreground mb-2">
              {selectedFile.name}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-sm text-destructive hover:underline"
            >
              ファイルを変更
            </button>
          </div>
        ) : (
          <div>
            <div className="text-6xl mb-4">📁</div>
            <p className="text-lg font-medium text-foreground mb-2">
              ファイルをドロップ、または
            </p>
            <label className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer transition font-medium text-sm">
              ファイルを選択
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="mt-4 text-sm text-muted-foreground">
              対応形式: Excel (.xlsx, .xls) / 最大10MB
            </p>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="mt-6 flex gap-4">
          <Button
            onClick={handleSubmit}
            className="flex-1"
          >
            次へ（パース処理）
          </Button>
          <Button
            variant="outline"
            onClick={() => setSelectedFile(null)}
          >
            キャンセル
          </Button>
        </div>
      )}

      <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <h3 className="font-semibold text-foreground mb-2">
          📋 Excel希望表のフォーマット
        </h3>
        <ul className="text-sm text-foreground/80 space-y-1">
          <li>• 1行目: ヘッダー行（日付は M/D 形式、例: 12/1, 12/2）</li>
          <li>• 1列目: 社員番号（4桁）または氏名</li>
          <li>• 2列目以降: 各日付の希望（◯/休/早朝/早番/遅番/夜勤）</li>
          <li>• 空白またはハイフン（-）は希望なしとして扱われます</li>
        </ul>
      </div>
    </div>
  )
}
