import { getStaff } from '@/lib/actions/staff'
import { getShiftRequests } from '@/lib/actions/shift-requests'
import { ShiftRequestsEditor } from '@/components/shifts/ShiftRequestsEditor'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    month?: string
  }>
}

export default async function ShiftRequestsPage({ searchParams }: PageProps) {
  const { month } = await searchParams
  
  // デフォルトは現在の月
  const targetMonth = month || new Date().toISOString().slice(0, 7)
  
  const [staff, shiftRequests] = await Promise.all([
    getStaff(),
    getShiftRequests({ yearMonth: targetMonth }),
  ])

  const activeStaff = staff.filter((s) => s.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">シフト希望設定</h1>
          <p className="text-gray-600 mt-1">
            スタッフごとに各日のシフト希望を設定・編集できます
          </p>
        </div>
        <a
          href="/shifts/create"
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          シフト作成ページへ
        </a>
      </div>

      <ShiftRequestsEditor
        staff={activeStaff}
        existingRequests={shiftRequests}
        initialMonth={targetMonth}
      />
    </div>
  )
}
