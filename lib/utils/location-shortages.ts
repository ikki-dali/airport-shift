/** 配置箇所別の不足情報 */
export interface LocationShortageInfo {
  locationName: string
  shortage: number
  dutyDetails?: Array<{
    dutyCode: string
    startTime: string
    endTime: string
    shortage: number
  }>
}

/**
 * 配置箇所別の不足情報を計算するヘルパー
 * クライアントコンポーネントからも呼べるよう、Server Actionファイル外に配置。
 */
export function calcLocationShortages(
  dateStr: string,
  locationRequirements: Array<{
    duty_code_id: string
    required_staff_count: number
    day_of_week: number | null
    specific_date: string | null
    locations?: { location_name: string } | null
    duty_codes?: { code: string; start_time: string | null; end_time: string | null } | null
  }>,
  shifts: Array<{ date: string; location: { location_name: string }; duty_code: { id: string } }>,
): LocationShortageInfo[] {
  const date = new Date(dateStr + 'T00:00:00')
  const dayOfWeek = date.getDay()

  // その日のシフトをフィルタ
  const dayShifts = shifts.filter((s) => s.date === dateStr)

  // 配置箇所ごとにシフトをグルーピング
  const byLocation: Record<string, typeof dayShifts> = {}
  dayShifts.forEach((shift) => {
    const key = shift.location.location_name
    if (!byLocation[key]) byLocation[key] = []
    byLocation[key].push(shift)
  })

  // 配置箇所ごとの不足を集計
  const locationMap = new Map<string, { shortage: number; dutyDetails: Array<{ dutyCode: string; startTime: string; endTime: string; shortage: number }> }>()

  locationRequirements.forEach((req) => {
    if (req.day_of_week !== null && req.day_of_week !== dayOfWeek) return
    if (req.specific_date !== null && req.specific_date !== dateStr) return
    if (!req.locations || !req.duty_codes) return

    const locationName = req.locations.location_name
    const assignedCount = (byLocation[locationName] || []).filter(
      (shift) => shift.duty_code.id === req.duty_code_id
    ).length

    const shortageCount = req.required_staff_count - assignedCount
    if (shortageCount > 0) {
      const entry = locationMap.get(locationName) || { shortage: 0, dutyDetails: [] }
      entry.shortage += shortageCount
      entry.dutyDetails.push({
        dutyCode: req.duty_codes.code,
        startTime: req.duty_codes.start_time || '00:00',
        endTime: req.duty_codes.end_time || '00:00',
        shortage: shortageCount,
      })
      locationMap.set(locationName, entry)
    }
  })

  return Array.from(locationMap.entries()).map(([locationName, info]) => ({
    locationName,
    shortage: info.shortage,
    dutyDetails: info.dutyDetails,
  }))
}
