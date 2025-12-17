import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getStaffShiftsByToken } from '@/lib/actions/staff-shifts'
import { Calendar, Clock, MapPin } from 'lucide-react'

interface StaffShiftsPageProps {
  searchParams: Promise<{
    token?: string
  }>
}

export default async function StaffShiftsPage({ searchParams }: StaffShiftsPageProps) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">アクセスエラー</h1>
            <p className="text-gray-600">
              有効なアクセストークンが見つかりません。<br />
              メールに記載されているリンクからアクセスしてください。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const data = await getStaffShiftsByToken(token)

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2">認証エラー</h1>
            <p className="text-gray-600">
              無効なトークンです。<br />
              メールに記載されている正しいリンクからアクセスしてください。
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { staff, shifts } = data

  // 月ごとにグループ化
  const shiftsByMonth = shifts.reduce((acc: any, shift: any) => {
    const month = format(new Date(shift.date), 'yyyy年M月', { locale: ja })
    if (!acc[month]) {
      acc[month] = []
    }
    acc[month].push(shift)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          {/* アプリロゴ */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Calendar className="h-8 w-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900">シフト管理</span>
              <span className="text-sm text-gray-500">Airport Shift Manager</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            確定シフト
          </h1>
          <p className="text-lg text-gray-600">
            {staff.name} さん
          </p>
          <Badge variant="outline" className="mt-2">
            社員番号: {staff.employee_number}
          </Badge>
        </div>

        {shifts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                確定済みのシフトはまだありません
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(shiftsByMonth).map(([month, monthShifts]: [string, any]) => (
              <div key={month}>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  {month}
                  <Badge variant="outline" className="ml-2">
                    {monthShifts.length}件
                  </Badge>
                </h2>

                <div className="grid gap-3">
                  {monthShifts.map((shift: any) => {
                    const shiftDate = new Date(shift.date)
                    const dayOfWeek = format(shiftDate, 'E', { locale: ja })
                    const isWeekend = dayOfWeek === '土' || dayOfWeek === '日'

                    return (
                      <Card
                        key={shift.id}
                        className={`transition-shadow hover:shadow-lg ${
                          isWeekend ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* 日付 */}
                              <div className="text-center">
                                <div className="text-2xl font-bold text-gray-900">
                                  {format(shiftDate, 'd', { locale: ja })}
                                </div>
                                <div
                                  className={`text-sm font-medium ${
                                    isWeekend ? 'text-blue-600' : 'text-gray-500'
                                  }`}
                                >
                                  {dayOfWeek}
                                </div>
                              </div>

                              {/* シフト詳細 */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium text-gray-900">
                                    {shift.location.location_name}
                                  </span>
                                  <Badge variant="secondary">
                                    {shift.location.code}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-600">
                                    {shift.duty_code.code}
                                  </span>
                                  <span className="text-sm text-gray-500">
                                    {shift.duty_code.start_time} - {shift.duty_code.end_time}
                                  </span>
                                </div>
                                {shift.duty_code.category && (
                                  <div className="text-xs text-gray-500">
                                    {shift.duty_code.category}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* ステータスバッジ */}
                            <Badge className="bg-green-600 hover:bg-green-700">
                              確定
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* フッター */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>このページは {staff.name} さん専用です</p>
          <p className="mt-1">
            © 2025 シフト管理システム
          </p>
        </div>
      </div>
    </div>
  )
}
