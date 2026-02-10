import { getStaff } from '@/lib/actions/staff'
import { getLocations } from '@/lib/actions/locations'
import { getDutyCodes } from '@/lib/actions/duty-codes'
import { getShifts } from '@/lib/actions/shifts'
import { getAllLocationRequirements } from '@/lib/actions/location-requirements'
import { getShiftRequests } from '@/lib/actions/shift-requests'
import { ShiftCreationBoardV3 } from '@/components/shifts/ShiftCreationBoardV3'

export const dynamic = 'force-dynamic'

export default async function ShiftCreatePage() {
  // 全てのデータを並列取得
  const [staff, locations, dutyCodes, shifts, locationRequirements, shiftRequests] = await Promise.all([
    getStaff(),
    getLocations(),
    getDutyCodes(),
    getShifts(),
    getAllLocationRequirements(),
    getShiftRequests(), // 全てのシフト希望を取得
  ])

  // アクティブなデータのみフィルター
  const activeStaff = staff.filter((s) => s.is_active)
  const activeLocations = locations.filter((l) => l.is_active)

  return (
    <div>
      <ShiftCreationBoardV3
        staff={activeStaff}
        locations={activeLocations}
        dutyCodes={dutyCodes}
        shifts={shifts}
        locationRequirements={locationRequirements}
        shiftRequests={shiftRequests}
      />
    </div>
  )
}
