'use client'

import { useState, useEffect } from 'react'
import { ExcelUploader } from '@/components/requests/ExcelUploader'
import { ParsePreview } from '@/components/requests/ParsePreview'
import { ImportResults } from '@/components/requests/ImportResults'
import { parseExcelFile, type ParseResult } from '@/lib/parsers/excel-parser'
import { importShiftRequests } from '@/lib/actions/shift-requests'
import { getStaff } from '@/lib/actions/staff'
import type { Database } from '@/types/database'

type Staff = Database['public']['Tables']['staff']['Row']

type Step = 'upload' | 'preview' | 'complete'

export default function ExcelUploadPage() {
  const [step, setStep] = useState<Step>('upload')
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [importResult, setImportResult] = useState<{
    insertedCount: number
    overwrittenCount: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // スタッフリストの読み込み
  useEffect(() => {
    loadStaffList()
  }, [])

  const loadStaffList = async () => {
    try {
      const data = await getStaff({ isActive: true })
      setStaffList(data)
    } catch (err) {
      console.error('Failed to load staff list:', err)
      setError('スタッフリストの読み込みに失敗しました')
    }
  }

  const handleFileSelect = async (file: File) => {
    setLoading(true)
    setError('')

    try {
      const result = await parseExcelFile(file, staffList)
      setParseResult(result)
      setStep('preview')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'ファイルのパース処理に失敗しました'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (overwrite: boolean) => {
    if (!parseResult) return

    setLoading(true)
    setError('')

    try {
      const result = await importShiftRequests(
        parseResult.requests,
        parseResult.yearMonth,
        overwrite
      )

      setImportResult(result)
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'データの取り込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setParseResult(null)
    setStep('upload')
  }

  const handleReset = () => {
    setParseResult(null)
    setImportResult(null)
    setStep('upload')
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      {/* ステップインジケーター */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-4">
          {[
            { id: 'upload', label: 'アップロード' },
            { id: 'preview', label: 'プレビュー' },
            { id: 'complete', label: '完了' },
          ].map((s, index) => (
            <div key={s.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  step === s.id
                    ? 'bg-gray-900 text-white'
                    : index < ['upload', 'preview', 'complete'].indexOf(step)
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              <span
                className={`ml-2 font-medium ${
                  step === s.id ? 'text-gray-900' : 'text-gray-600'
                }`}
              >
                {s.label}
              </span>
              {index < 2 && (
                <div className="w-12 h-1 mx-4 bg-gray-200">
                  <div
                    className={`h-full ${
                      index < ['upload', 'preview', 'complete'].indexOf(step)
                        ? 'bg-gray-600'
                        : 'bg-gray-200'
                    }`}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <p className="text-red-800 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* コンテンツ */}
      {step === 'upload' && <ExcelUploader onFileSelect={handleFileSelect} />}

      {step === 'preview' && parseResult && (
        <ParsePreview
          parseResult={parseResult}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          loading={loading}
        />
      )}

      {step === 'complete' && importResult && parseResult && (
        <ImportResults
          insertedCount={importResult.insertedCount}
          overwrittenCount={importResult.overwrittenCount}
          yearMonth={parseResult.yearMonth}
          onReset={handleReset}
        />
      )}
    </div>
  )
}
