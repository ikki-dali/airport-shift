'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Shift create page error:', error)
  }, [error])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">シフト作成</h1>
        <p className="text-gray-600 mt-1">エラーが発生しました</p>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>エラー</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{error.message || 'データの読み込みに失敗しました'}</p>
          {error.digest && (
            <p className="text-xs font-mono">エラーID: {error.digest}</p>
          )}
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <p className="text-sm text-gray-600">考えられる原因：</p>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>データベース接続の問題</li>
          <li>必要なテーブルが作成されていない（staff, locations, duty_codes, shifts）</li>
          <li>Supabaseの認証設定の問題</li>
          <li>Row Level Security (RLS) の設定が必要</li>
        </ul>

        <Button onClick={reset}>再試行</Button>
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm font-medium mb-2">デバッグ情報:</p>
        <pre className="text-xs overflow-auto bg-white p-3 rounded border">
          {JSON.stringify(
            {
              message: error.message,
              name: error.name,
              digest: error.digest,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  )
}
