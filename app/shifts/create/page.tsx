import { getStaff } from '@/lib/actions/staff'
import { getLocations } from '@/lib/actions/locations'
import { getDutyCodes } from '@/lib/actions/duty-codes'
import { getShifts } from '@/lib/actions/shifts'
import { ShiftCreationBoard } from '@/components/shifts/ShiftCreationBoard'

export default async function ShiftCreatePage() {
  // 全てのデータを並列取得
  const [staff, locations, dutyCodes, shifts] = await Promise.all([
    getStaff(),
    getLocations(),
    getDutyCodes(),
    getShifts(),
  ])

  // アクティブなデータのみフィルター
  const activeStaff = staff.filter((s) => s.is_active)
  const activeLocations = locations.filter((l) => l.is_active)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">シフト作成</h1>
        <p className="text-gray-600 mt-1">
          スタッフをドラッグ&ドロップしてシフトを作成
        </p>
      </div>

      <ShiftCreationBoard
        staff={activeStaff}
        locations={activeLocations}
        dutyCodes={dutyCodes}
        initialShifts={shifts}
      />
    </div>
  )
}
