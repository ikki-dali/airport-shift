import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getStaff } from '@/lib/actions/staff'
import { getLocations } from '@/lib/actions/locations'
import { getDutyCodes } from '@/lib/actions/duty-codes'

export default async function HomePage() {
  // 実際のデータを取得
  const [staff, locations, dutyCodes] = await Promise.all([
    getStaff(),
    getLocations(),
    getDutyCodes(),
  ])

  const activeStaff = staff.filter((s) => s.is_active)
  const activeLocations = locations.filter((l) => l.is_active)

  // 統計データ（実データベース）
  const stats = {
    fillRate: 85, // TODO: 実際のシフトデータから計算
    warningDays: 3, // TODO: 実際の警告データから計算
    totalStaff: staff.length,
    activeStaff: activeStaff.length,
  }

  return (
    <div className="space-y-6">
      {/* ページヘッダー */}
      <div>
        <h1 className="text-3xl font-bold">ダッシュボード</h1>
        <p className="text-gray-600 mt-1">シフト管理の概要</p>
      </div>

      {/* 概要カード（3列） */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 充足率カード */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              充足率
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.fillRate}%</div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600"
                style={{ width: `${stats.fillRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* 警告カード */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              人数不足
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.warningDays}日間
            </div>
            <Badge variant="outline" className="mt-2">
              要対応
            </Badge>
          </CardContent>
        </Card>

        {/* スタッフ数カード */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              稼働スタッフ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeStaff}名</div>
            <p className="text-sm text-gray-500 mt-2">
              全{stats.totalStaff}名中
            </p>
          </CardContent>
        </Card>
      </div>

      {/* クイックアクション */}
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Link href="/shifts/create">
              <Button className="w-full">📅 シフト作成</Button>
            </Link>
            <Link href="/staff">
              <Button variant="outline" className="w-full">
                👥 スタッフ管理
              </Button>
            </Link>
            <Link href="/duty-codes">
              <Button variant="outline" className="w-full">
                🔢 勤務記号管理
              </Button>
            </Link>
            <Link href="/reports">
              <Button variant="outline" className="w-full">
                📊 レポート
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* システム情報 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              登録スタッフ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staff.length}</div>
            <p className="text-sm text-gray-500 mt-1">
              アクティブ: {activeStaff.length}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              配属箇所
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLocations.length}</div>
            <p className="text-sm text-gray-500 mt-1">使用中</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-600">
              勤務記号
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dutyCodes.length}</div>
            <p className="text-sm text-gray-500 mt-1">登録済み</p>
          </CardContent>
        </Card>
      </div>

      {/* カレンダープレビュー */}
      <Card>
        <CardHeader>
          <CardTitle>11月シフトカレンダー</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            シフトカレンダーは準備中です
          </p>
          <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg">
            <p className="text-gray-400">カレンダーコンポーネントは後ほど実装されます</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
