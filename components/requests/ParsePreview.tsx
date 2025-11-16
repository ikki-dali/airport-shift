'use client'

import { useState } from 'react'
import type { ParseResult } from '@/lib/parsers/excel-parser'

interface ParsePreviewProps {
  parseResult: ParseResult
  onConfirm: (overwrite: boolean) => void
  onCancel: () => void
  loading?: boolean
}

export function ParsePreview({
  parseResult,
  onConfirm,
  onCancel,
  loading = false,
}: ParsePreviewProps) {
  const [overwrite, setOverwrite] = useState(false)

  const hasErrors = parseResult.errors.length > 0
  const hasWarnings = parseResult.warnings.length > 0

  const formatYearMonth = (yearMonth: string) => {
    if (!yearMonth) return '不明'
    const [year, month] = yearMonth.split('-')
    return `${year}年${parseInt(month, 10)}月`
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold mb-6">パース結果プレビュー</h2>

      {/* サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-600 font-medium mb-1">対象年月</div>
          <div className="text-2xl font-bold text-blue-900">
            {formatYearMonth(parseResult.yearMonth)}
          </div>
        </div>
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-green-600 font-medium mb-1">
            検出スタッフ数
          </div>
          <div className="text-2xl font-bold text-green-900">
            {parseResult.detectedStaffCount} 名
          </div>
        </div>
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="text-sm text-purple-600 font-medium mb-1">
            取り込み対象件数
          </div>
          <div className="text-2xl font-bold text-purple-900">
            {parseResult.totalRequestCount.toLocaleString()} 件
          </div>
        </div>
      </div>

      {/* エラー */}
      {hasErrors && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">❌</span>
            <h3 className="font-semibold text-red-900">
              エラー: {parseResult.errors.length} 件
            </h3>
          </div>
          <ul className="space-y-1">
            {parseResult.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-700">
                • {error}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-red-800 font-medium">
            エラーを修正してから再度アップロードしてください。
          </p>
        </div>
      )}

      {/* 警告 */}
      {hasWarnings && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⚠️</span>
            <h3 className="font-semibold text-yellow-900">
              警告: {parseResult.warnings.length} 件
            </h3>
          </div>
          <div className="max-h-48 overflow-y-auto">
            <ul className="space-y-1">
              {parseResult.warnings.slice(0, 20).map((warning, index) => (
                <li key={index} className="text-sm text-yellow-700">
                  • {warning}
                </li>
              ))}
            </ul>
            {parseResult.warnings.length > 20 && (
              <p className="mt-2 text-sm text-yellow-600 italic">
                ... 他 {parseResult.warnings.length - 20} 件の警告
              </p>
            )}
          </div>
          <p className="mt-3 text-sm text-yellow-800">
            警告があっても取り込みは可能ですが、内容を確認してください。
          </p>
        </div>
      )}

      {/* 成功時の情報 */}
      {!hasErrors && !hasWarnings && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✅</span>
            <p className="text-green-800 font-medium">
              パース処理が正常に完了しました
            </p>
          </div>
        </div>
      )}

      {/* 上書きオプション */}
      {!hasErrors && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg">
          <label className="flex items-start cursor-pointer">
            <input
              type="checkbox"
              checked={overwrite}
              onChange={(e) => setOverwrite(e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div className="ml-3">
              <div className="font-medium text-gray-900">
                既存データの上書き
              </div>
              <div className="text-sm text-gray-600">
                {formatYearMonth(parseResult.yearMonth)}
                のデータが既に存在する場合、削除して新しいデータを取り込みます
              </div>
            </div>
          </label>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex gap-4">
        <button
          onClick={() => onConfirm(overwrite)}
          disabled={hasErrors || loading}
          className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
        >
          {loading ? '取り込み中...' : '取り込み実行'}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition"
        >
          キャンセル
        </button>
      </div>
    </div>
  )
}
