import { getStaff } from '@/lib/actions/staff'
import { getLocations } from '@/lib/actions/locations'
import { getDutyCodes } from '@/lib/actions/duty-codes'
import { getShifts } from '@/lib/actions/shifts'
import { getAllLocationRequirements } from '@/lib/actions/location-requirements'
import { ShiftCreationBoardV3 } from '@/components/shifts/ShiftCreationBoardV3'

export const dynamic = 'force-dynamic'

export default async function ShiftCreatePage() {
  // 全てのデータを並列取得
  const [staff, locations, dutyCodes, shifts, locationRequirements] = await Promise.all([
    getStaff(),
    getLocations(),
    getDutyCodes(),
    getShifts(),
    getAllLocationRequirements(),
  ])

  // アクティブなデータのみフィルター
  const activeStaff = staff.filter((s) => s.is_active)
  const activeLocations = locations.filter((l) => l.is_active)

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">シフト作成</h1>
          <p className="text-gray-600 mt-1">
            週単位でシフトを作成・管理（必要人数に基づいた充足率管理）
          </p>
        </div>
        <a
          href="/shifts"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          シフト一覧・確定ページへ
        </a>
      </div>

      <ShiftCreationBoardV3
        staff={activeStaff}
        locations={activeLocations}
        dutyCodes={dutyCodes}
        shifts={shifts}
        locationRequirements={locationRequirements}
      />
    </div>
  )
}
