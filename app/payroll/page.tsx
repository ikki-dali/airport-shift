import { getPayrollDashboard } from '@/lib/actions/payroll'
import { PayrollDashboard } from '@/components/payroll/PayrollDashboard'
import { format } from 'date-fns'

interface PayrollPageProps {
  searchParams: Promise<{
    yearMonth?: string
  }>
}

export const dynamic = 'force-dynamic'

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const params = await searchParams
  const yearMonth = params.yearMonth || format(new Date(), 'yyyy-MM')
  const dashboardData = await getPayrollDashboard(yearMonth)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">給与管理</h1>
        <p className="text-gray-600 mt-1">
          スタッフの給与計算と103万円の壁の管理
        </p>
      </div>

      <PayrollDashboard data={dashboardData} yearMonth={yearMonth} />
    </div>
  )
}
