'use client'

import { useEffect, useState } from 'react'
import { validateShifts, type ConstraintViolation } from '@/lib/validators/shift-validator'
import type { Shift } from '@/lib/actions/shifts'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle2, AlertCircle, XCircle } from 'lucide-react'

interface LocationStatusProps {
  shifts: Shift[]
  locationId: string
  dutyCodeId: string
  date: string
  locationName: string
  dutyCodeName: string
}

export function LocationStatus({
  shifts,
  locationId,
  dutyCodeId,
  date,
  locationName,
  dutyCodeName,
}: LocationStatusProps) {
  const [violations, setViolations] = useState<ConstraintViolation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkConstraints() {
      setLoading(true)
      try {
        const result = await validateShifts(shifts, locationId, dutyCodeId, date)
        setViolations(result)
      } catch {
        /* ignore */
      } finally {
        setLoading(false)
      }
    }

    checkConstraints()
  }, [shifts, locationId, dutyCodeId, date])

  if (loading) {
    return (
      <div className="text-xs text-gray-400">
        チェック中...
      </div>
    )
  }

  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-600">
        <CheckCircle2 className="h-3 w-3" />
        <span>OK</span>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {errors.length > 0 && (
        <div className="flex items-start gap-1">
          <XCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-red-600">
            {errors.map((v, i) => (
              <div key={i}>{v.message}</div>
            ))}
          </div>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="flex items-start gap-1">
          <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-yellow-600">
            {warnings.map((v, i) => (
              <div key={i}>{v.message}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
