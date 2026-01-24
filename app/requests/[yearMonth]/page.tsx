import { getShiftRequests } from '@/lib/actions/shift-requests'
import { getStaff } from '@/lib/actions/staff'
import { RequestsView } from '@/components/requests/RequestsView'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface RequestsDetailPageProps {
  params: {
    yearMonth: string
  }
}

export default async function RequestsDetailPage({ params }: RequestsDetailPageProps) {
  const { yearMonth } = params

  const [requests, staff] = await Promise.all([
    getShiftRequests({ yearMonth }),
    getStaff(),
  ])

  // 年月のフォーマット
  const [year, month] = yearMonth.split('-')
  const formattedYearMonth = `${year}年${parseInt(month, 10)}月`

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/requests"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{formattedYearMonth} 希望データ</h1>
          <p className="text-gray-600 mt-1">
            {requests.length}件の希望提出
          </p>
        </div>
      </div>

      <RequestsView
        requests={requests}
        staff={staff}
        yearMonth={yearMonth}
      />
    </div>
  )
}
