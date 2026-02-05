'use client'

import { CalendarDays, CalendarRange, Calendar } from 'lucide-react'
import { TodayTab } from './TodayTab'
import { WeekTab } from './WeekTab'
import { MonthTab } from './MonthTab'

interface Shift {
  id: string
  date: string
  status: string
  staff: {
    id: string
    name: string
    employee_number: string
  }
  location: {
    id: string
    location_name: string
  }
  duty_code: {
    id: string
    code: string
    start_time: string
    end_time: string
  }
}

interface LocationRequirement {
  id: string
  location_id: string
  duty_code_id: string
  required_staff_count: number
  day_of_week: number | null
  specific_date: string | null
  duty_codes: {
    id: string
    code: string
    start_time: string | null
    end_time: string | null
    category: string
  } | null
  locations: {
    id: string
    location_name: string
  } | null
}

interface DashboardTabsProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
  yearMonth: string
}

export function DashboardTabs({ shifts, locationRequirements, yearMonth }: DashboardTabsProps) {
  return (
    <div className="space-y-8">
      {/* Today セクション */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Today</h2>
        </div>
        <TodayTab
          shifts={shifts}
          locationRequirements={locationRequirements}
        />
      </section>

      {/* This Week セクション */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CalendarRange className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">This Week</h2>
        </div>
        <WeekTab
          shifts={shifts}
          locationRequirements={locationRequirements}
        />
      </section>

      {/* This Month セクション */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">This Month</h2>
        </div>
        <MonthTab
          shifts={shifts}
          locationRequirements={locationRequirements}
          yearMonth={yearMonth}
        />
      </section>
    </div>
  )
}
