'use client'

import { useState } from 'react'
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
}

interface DashboardTabsProps {
  shifts: Shift[]
  locationRequirements: LocationRequirement[]
  yearMonth: string
}

type TabType = 'today' | 'week' | 'month'

export function DashboardTabs({ shifts, locationRequirements, yearMonth }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('today')

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    { key: 'today', label: 'Today', icon: <CalendarDays className="h-4 w-4" /> },
    { key: 'week', label: 'This Week', icon: <CalendarRange className="h-4 w-4" /> },
    { key: 'month', label: 'This Month', icon: <Calendar className="h-4 w-4" /> },
  ]

  return (
    <div className="space-y-4">
      {/* タブ切り替え */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 rounded px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* タブコンテンツ */}
      <div>
        {activeTab === 'today' && (
          <TodayTab
            shifts={shifts}
            locationRequirements={locationRequirements}
          />
        )}
        {activeTab === 'week' && (
          <WeekTab
            shifts={shifts}
            locationRequirements={locationRequirements}
          />
        )}
        {activeTab === 'month' && (
          <MonthTab
            shifts={shifts}
            locationRequirements={locationRequirements}
            yearMonth={yearMonth}
          />
        )}
      </div>
    </div>
  )
}
