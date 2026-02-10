'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, CheckCircle2, Database, Loader2, Users } from 'lucide-react'

interface SeedResult {
  success: boolean
  message?: string
  result?: {
    roles?: number
    tags?: number
    dutyCodes?: number
    locations?: number
    staff?: number
    staffTags?: number
    locationRequirements?: number
    shiftRequests?: number
  }
  error?: string
}

interface DemoSeedResult {
  success: boolean
  message?: string
  result?: {
    staff: number
    contractStaff: number
    partTimeStaff: number
    shifts: number
    confirmedShifts: number
    pendingShifts: number
    locations: number
    dutyCodes: number
    requirements: number
  }
  error?: string
}

export default function SeedPage() {
  const [isSeeding, setIsSeeding] = useState(false)
  const [isSeedingDemo, setIsSeedingDemo] = useState(false)
  const [result, setResult] = useState<SeedResult | null>(null)
  const [demoResult, setDemoResult] = useState<DemoSeedResult | null>(null)
  const [clearExisting, setClearExisting] = useState(false)
  const [showDemoConfirm, setShowDemoConfirm] = useState(false)

  // 本番環境では無効化
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">データベースシード管理</h1>
        </div>
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-medium mb-1">この機能は本番環境では無効です</p>
              <p>データベースシード機能は開発・テスト環境でのみ使用できます。</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

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

  const handleDemoSeed = async () => {
    setIsSeedingDemo(true)
    setDemoResult(null)
    setShowDemoConfirm(false)

    try {
      const response = await fetch('/api/seed/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      setDemoResult(data)
    } catch (error) {
      setDemoResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      })
    } finally {
      setIsSeedingDemo(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">データベースシード管理</h1>
        <p className="text-muted-foreground mt-1">
          テストデータをデータベースに投入します
        </p>
      </div>

      {/* デモデータ生成セクション */}
      <Card className="p-6 border-2 border-primary/20 bg-primary/5">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              デモ用データ生成
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              クライアントへのデモ用に、リアルなダミーデータを生成します。
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm bg-card rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">スタッフ:</span>
                  <span className="text-muted-foreground">150名（契約30 + パート120）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">シフト:</span>
                  <span className="text-muted-foreground">今月・来月分（1日43人ベース）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">人手不足日:</span>
                  <span className="text-muted-foreground">あり（赤ハイライト確認用）</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">承認待ち:</span>
                  <span className="text-muted-foreground">あり（バッジ確認用）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">勤務地:</span>
                  <span className="text-muted-foreground">5箇所</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">名前:</span>
                  <span className="text-muted-foreground">日本人名（リアル）</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-primary/20 pt-4">
            {showDemoConfirm ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-yellow-800 font-medium mb-3">
                  既存のスタッフ・シフトデータは全て削除されます。続行しますか？
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="destructive"
                    onClick={handleDemoSeed}
                    disabled={isSeedingDemo}
                  >
                    はい、生成する
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDemoConfirm(false)}
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowDemoConfirm(true)}
                disabled={isSeedingDemo}
              >
                {isSeedingDemo ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Users className="h-5 w-5" />
                    デモデータを生成
                  </>
                )}
              </Button>
            )}
          </div>

          {demoResult && (
            <div
              className={`border-t border-primary/20 pt-4 ${
                demoResult.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              <div className="flex items-start gap-3">
                {demoResult.success ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">
                    {demoResult.success ? '✅ 生成成功' : '❌ 生成失敗'}
                  </h3>
                  {demoResult.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                      <p className="font-medium">エラー:</p>
                      <p className="mt-1 text-red-700">{demoResult.error}</p>
                    </div>
                  )}
                  {demoResult.result && (
                    <div className="bg-green-50 border border-green-200 rounded p-4">
                      <p className="font-medium mb-2">生成されたデータ:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>スタッフ合計: {demoResult.result.staff}名</div>
                        <div>├ 契約社員: {demoResult.result.contractStaff}名</div>
                        <div>└ パート: {demoResult.result.partTimeStaff}名</div>
                        <div>シフト合計: {demoResult.result.shifts}件</div>
                        <div>├ 確定: {demoResult.result.confirmedShifts}件</div>
                        <div>└ 承認待ち: {demoResult.result.pendingShifts}件</div>
                        <div>勤務地: {demoResult.result.locations}箇所</div>
                        <div>勤務記号: {demoResult.result.dutyCodes}件</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 既存のシードデータセクション */}
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">基本シードデータ</h2>
            <p className="text-sm text-muted-foreground mb-4">
              開発用の基本データ（少人数）を投入します。
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">役職:</span>
                  <span className="text-muted-foreground">4件（一般社員、サブリーダー、リーダー、管理者）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">タグ:</span>
                  <span className="text-muted-foreground">5件（保安検査、バス案内、横特、OSS、番台）</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">勤務記号:</span>
                  <span className="text-muted-foreground">28件</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">配属箇所:</span>
                  <span className="text-muted-foreground">5件（T3中央、T3北、T2中央、バス案内、横特）</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">スタッフ:</span>
                  <span className="text-muted-foreground">15名</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">配属箇所要件:</span>
                  <span className="text-muted-foreground">6件</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">シフト希望:</span>
                  <span className="text-muted-foreground">2025年12月分（約100件）</span>
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
                <p className="text-sm text-muted-foreground">
                  チェックすると、投入前に既存のデータを全て削除します（注意: 復元できません）
                </p>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={handleSeed}
              disabled={isSeeding}
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  投入中...
                </>
              ) : (
                <>
                  <Database className="h-5 w-5" />
                  基本データを投入
                </>
              )}
            </Button>
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
