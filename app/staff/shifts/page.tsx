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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-muted/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-2">アクセスエラー</h1>
            <p className="text-muted-foreground">
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
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-muted/50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h1 className="text-2xl font-bold mb-2">認証エラー</h1>
            <p className="text-muted-foreground">
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-muted/50 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* ヘッダー */}
        <div className="mb-8 text-center">
          {/* アプリロゴ */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Calendar className="h-8 w-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-foreground">シフト管理</span>
              <span className="text-sm text-muted-foreground">Airport Shift Manager</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            確定シフト
          </h1>
          <p className="text-lg text-muted-foreground">
            {staff.name} さん
          </p>
          <Badge variant="outline" className="mt-2">
            社員番号: {staff.employee_number}
          </Badge>
        </div>

        {shifts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">
                確定済みのシフトはまだありません
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(shiftsByMonth).map(([month, monthShifts]: [string, any]) => (
              <div key={month}>
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
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
                          isWeekend ? 'bg-primary/5 border-primary/20' : ''
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {/* 日付 */}
                              <div className="text-center">
                                <div className="text-2xl font-bold text-foreground">
                                  {format(shiftDate, 'd', { locale: ja })}
                                </div>
                                <div
                                  className={`text-sm font-medium ${
                                    isWeekend ? 'text-navy-600' : 'text-muted-foreground'
                                  }`}
                                >
                                  {dayOfWeek}
                                </div>
                              </div>

                              {/* シフト詳細 */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-foreground">
                                    {shift.location.location_name}
                                  </span>
                                  <Badge variant="secondary">
                                    {shift.location.code}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm text-muted-foreground">
                                    {shift.duty_code.code}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {shift.duty_code.start_time} - {shift.duty_code.end_time}
                                  </span>
                                  {shift.duty_code.total_hours && (
                                    <span className="text-sm text-muted-foreground">
                                      ({shift.duty_code.total_hours}h)
                                    </span>
                                  )}
                                </div>
                                {shift.duty_code.category && (
                                  <div className="text-xs text-muted-foreground">
                                    {shift.duty_code.category}
                                  </div>
                                )}
                                {/* 業務配分 */}
                                {shift.shift_tasks && shift.shift_tasks.length > 0 && (
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    {shift.shift_tasks
                                      .filter((task: any) => task.hours > 0)
                                      .sort((a: any, b: any) => b.hours - a.hours)
                                      .map((task: any) => (
                                        <Badge
                                          key={task.id}
                                          variant="outline"
                                          className="text-xs bg-gray-50"
                                        >
                                          {task.task_types?.name || task.task_types?.code}: {task.hours}h
                                        </Badge>
                                      ))}
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
