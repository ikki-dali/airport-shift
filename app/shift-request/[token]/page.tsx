import { notFound } from 'next/navigation'
import { getStaffByToken } from '@/lib/actions/staff-tokens'
import { getShiftRequests } from '@/lib/actions/shift-requests'
import { ShiftRequestForm } from '@/components/shift-request/ShiftRequestForm'
import { format, addDays, startOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Calendar } from 'lucide-react'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function ShiftRequestPage({ params }: PageProps) {
  const { token } = await params
  
  // トークンからスタッフ情報を取得
  const staff = await getStaffByToken(token)
  
  if (!staff) {
    notFound()
  }

  // 今週と来週の日付を取得
  const today = new Date()
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }) // 月曜始まり
  const nextWeekStart = addDays(thisWeekStart, 7)
  
  // 2週間分の日付を生成
  const dates: Date[] = []
  for (let i = 0; i < 14; i++) {
    dates.push(addDays(thisWeekStart, i))
  }

  // 既存の希望データを取得
  const yearMonth = format(thisWeekStart, 'yyyy-MM')
  const existingRequests = await getShiftRequests({ 
    yearMonth,
    staffId: staff.id 
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          {/* アプリロゴ */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Calendar className="h-7 w-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900">シフト管理</span>
              <span className="text-xs text-gray-500">Airport Shift Manager</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            シフト希望提出
          </h1>
          <p className="text-gray-600 text-center">
            {staff.name} さん（{staff.employee_number}）
          </p>
          <p className="text-sm text-gray-500 mt-2 text-center">
            希望する日付を選択して、提出ボタンを押してください
          </p>
        </div>

        {/* フォーム */}
        <ShiftRequestForm
          staffId={staff.id}
          staffName={staff.name}
          dates={dates}
          existingRequests={existingRequests}
        />
      </div>
    </div>
  )
}
