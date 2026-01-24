'use client'

import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns'
import { ja } from 'date-fns/locale'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WeekSelectorProps {
  selectedWeek: Date
  onWeekChange: (date: Date) => void
}

export function WeekSelector({ selectedWeek, onWeekChange }: WeekSelectorProps) {
  const weekStart = startOfWeek(selectedWeek, { weekStartsOn: 1 }) // 月曜始まり
  const weekEnd = endOfWeek(selectedWeek, { weekStartsOn: 1 })

  const handlePrevWeek = () => {
    onWeekChange(subWeeks(selectedWeek, 1))
  }

  const handleNextWeek = () => {
    onWeekChange(addWeeks(selectedWeek, 1))
  }

  const handleToday = () => {
    onWeekChange(new Date())
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevWeek}
        className="h-9"
        aria-label="前週へ"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div className="flex items-center gap-2">
        <div className="text-lg font-bold min-w-[280px] text-center">
          {format(weekStart, 'M月d日', { locale: ja })} - {format(weekEnd, 'M月d日', { locale: ja })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="h-9"
        >
          今週
        </Button>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={handleNextWeek}
        className="h-9"
        aria-label="次週へ"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
