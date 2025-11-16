'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { MonthSelector } from '@/components/shifts/MonthSelector'
import { StaffPayrollTable } from './StaffPayrollTable'
import { DollarSign, AlertTriangle, TrendingUp } from 'lucide-react'
import { formatPay } from '@/lib/payroll/calculator'
import { useRouter } from 'next/navigation'

interface PayrollDashboardProps {
  data: {
    totalMonthlyPay: number
    exceedingStaffCount: number
    warningStaffCount: number
    monthlyRecords: any[]
    annualSummaries: any[]
  }
  yearMonth: string
}

export function PayrollDashboard({ data, yearMonth }: PayrollDashboardProps) {
  const router = useRouter()
  const [selectedMonth, setSelectedMonth] = useState(
    new Date(yearMonth + '-01')
  )

  const handleMonthChange = (date: Date) => {
    setSelectedMonth(date)
    const newYearMonth = date.toISOString().slice(0, 7)
    router.push(`/payroll?yearMonth=${newYearMonth}`)
  }

  return (
    <div className="space-y-6">
      {/* 月選択 */}
      <div className="flex items-center justify-between">
        <MonthSelector
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
        />
      </div>

      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">今月の総人件費</p>
              <p className="text-2xl font-bold">
                {formatPay(data.totalMonthlyPay)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">103万円超過リスク</p>
              <p className="text-2xl font-bold">{data.exceedingStaffCount}人</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">警告スタッフ</p>
              <p className="text-2xl font-bold">{data.warningStaffCount}人</p>
            </div>
          </div>
        </Card>
      </div>

      {/* スタッフ別給与テーブル */}
      <StaffPayrollTable
        annualSummaries={data.annualSummaries}
        monthlyRecords={data.monthlyRecords}
        yearMonth={yearMonth}
      />
    </div>
  )
}
