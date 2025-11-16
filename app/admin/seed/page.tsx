'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle2, Database, Loader2 } from 'lucide-react'

interface SeedResult {
  success: boolean
  message?: string
  result?: {
    roles: number
    tags: number
    dutyCodes: number
    locations: number
    staff: number
    staffTags: number
    locationRequirements: number
    shiftRequests: number
  }
  error?: string
}

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)
  const [clearExisting, setClearExisting] = useState(false)

  const handleSeed = async () => {
    setIsSeeding(true)
    setResult(null)

    try {
      const response = await fetch('/api/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clearExisting }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">データベースシード管理</h1>
        <p className="text-gray-600 mt-1">
          テストデータをデータベースに投入します
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">シードデータの内容</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">役職:</span>
                  <span className="text-gray-600">4件（一般社員、サブリーダー、リーダー、管理者）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">タグ:</span>
                  <span className="text-gray-600">5件（保安検査、バス案内、横特、OSS、番台）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">勤務記号:</span>
                  <span className="text-gray-600">28件</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">配属箇所:</span>
                  <span className="text-gray-600">5件（T3中央、T3北、T2中央、バス案内、横特）</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">スタッフ:</span>
                  <span className="text-gray-600">15名</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">配属箇所要件:</span>
                  <span className="text-gray-600">6件</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">シフト希望:</span>
                  <span className="text-gray-600">2025年12月分（約100件）</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-start gap-3 mb-4">
              <input
                type="checkbox"
                id="clearExisting"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="mt-1"
              />
              <div>
                <label htmlFor="clearExisting" className="font-medium cursor-pointer">
                  既存データをクリア
                </label>
                <p className="text-sm text-gray-600">
                  チェックすると、投入前に既存のデータを全て削除します（注意: 復元できません）
                </p>
              </div>
            </div>

            <button
              onClick={handleSeed}
              disabled={isSeeding}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  投入中...
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  シードデータを投入
                </>
              )}
            </button>
          </div>

          {result && (
            <div
              className={`border-t pt-6 ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {result.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {result.success ? '✅ 投入成功' : '❌ 投入失敗'}
                  </h3>
                  {result.message && (
                    <p className="text-sm mb-3">{result.message}</p>
                  )}
                  {result.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                      <p className="font-medium">エラー:</p>
                      <p className="mt-1 text-red-700">{result.error}</p>
                    </div>
                  )}
                  {result.result && (
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <p className="font-medium mb-2">投入されたデータ:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>役職: {result.result.roles}件</div>
                        <div>タグ: {result.result.tags}件</div>
                        <div>勤務記号: {result.result.dutyCodes}件</div>
                        <div>配属箇所: {result.result.locations}件</div>
                        <div>スタッフ: {result.result.staff}名</div>
                        <div>スタッフタグ: {result.result.staffTags}件</div>
                        <div>配属箇所要件: {result.result.locationRequirements}件</div>
                        <div>シフト希望: {result.result.shiftRequests}件</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">注意事項</p>
            <ul className="list-disc list-inside space-y-1">
              <li>「既存データをクリア」をチェックすると、全てのデータが削除されます</li>
              <li>本番環境では使用しないでください</li>
              <li>開発・テスト環境でのみ使用してください</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
