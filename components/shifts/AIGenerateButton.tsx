'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Sparkles, Loader2 } from 'lucide-react'
import { generateWeeklyShifts, createAIGeneratedShifts } from '@/lib/actions/ai-shift-generator'
import { getShiftRequests } from '@/lib/actions/shift-requests'
import { getAllLocationRequirements } from '@/lib/actions/location-requirements'
import type { StaffWithRole } from '@/lib/actions/staff'
import type { Location } from '@/lib/actions/locations'
import type { DutyCode } from '@/lib/actions/duty-codes'
import type { Shift } from '@/lib/actions/shifts'

interface AIGenerateButtonProps {
  weekStart: Date
  weekEnd: Date
  staff: StaffWithRole[]
  locations: Location[]
  dutyCodes: DutyCode[]
  currentShifts: Shift[]
  onSuccess: () => void
}

export function AIGenerateButton({
  weekStart,
  weekEnd,
  staff,
  locations,
  dutyCodes,
  currentShifts,
  onSuccess,
}: AIGenerateButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)

    try {
      // Date を ISO 文字列に変換
      const weekStartStr = weekStart.toISOString()
      const weekEndStr = weekEnd.toISOString()

      // その週の既存シフトをフィルタ
      const weekStartDate = weekStart.toISOString().split('T')[0]
      const weekEndDate = weekEnd.toISOString().split('T')[0]
      const existingWeekShifts = currentShifts
        .filter((s) => s.date >= weekStartDate && s.date <= weekEndDate)
        .map((s) => ({
          date: s.date,
          staff_id: s.staff_id,
          location_id: s.location_id,
          duty_code_id: s.duty_code_id,
        }))

      // その週の希望シフトを取得
      const shiftRequests = await getShiftRequests({
        yearMonth: format(weekStart, 'yyyy-MM'),
      })

      const weekShiftRequests = shiftRequests.filter(
        (r) => r.date >= weekStartDate && r.date <= weekEndDate
      )

      // 配置箇所の必要人数を取得
      const locationRequirements = await getAllLocationRequirements()

      // AI でシフトを生成
      const generateResult = await generateWeeklyShifts(
        weekStartStr,
        weekEndStr,
        staff,
        locations,
        dutyCodes,
        existingWeekShifts,
        weekShiftRequests,
        locationRequirements
      )

      if (!generateResult.success || !generateResult.shifts) {
        // エラーメッセージを改行で分割して表示
        const errorLines = generateResult.message.split('\n')
        const errorMessage = errorLines.length > 3 
          ? errorLines.slice(0, 3).join('\n') + '\n...'
          : generateResult.message
        alert(`❌ シフト生成に失敗しました\n\n${errorMessage}`)
        return
      }

      // 生成されたシフトをDBに保存
      const createResult = await createAIGeneratedShifts(generateResult.shifts)

      if (createResult.success) {
        alert(`✨ AIが${generateResult.shifts.length}件のシフトを自動生成しました！`)
        onSuccess()
      } else {
        alert(`❌ シフトの保存に失敗しました\n\n${createResult.message}\n\n生成されたシフトは保存されませんでした。`)
      }
    } catch (error: any) {
      console.error('AI generation error:', error)
      alert(`エラーが発生しました: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleGenerate}
      disabled={loading}
      className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          AI生成中...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4" />
          AIで自動生成
        </>
      )}
    </Button>
  )
}
