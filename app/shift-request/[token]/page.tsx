import { notFound } from 'next/navigation'
import { getStaffByToken } from '@/lib/actions/staff-tokens'
import { getShiftRequests } from '@/lib/actions/shift-requests'
import { ShiftRequestForm } from '@/components/shift-request/ShiftRequestForm'
import { format, addDays, startOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            シフト希望提出
          </h1>
          <p className="text-gray-600">
            {staff.name} さん（{staff.employee_number}）
          </p>
          <p className="text-sm text-gray-500 mt-2">
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
