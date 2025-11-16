import { getDutyCodes } from '@/lib/actions/duty-codes'
import { DutyCodeTable } from '@/components/duty-codes/DutyCodeTable'

export default async function DutyCodesPage() {
  const dutyCodes = await getDutyCodes()

  return (
    <div className="container mx-auto p-8">
      {/* コンテンツ */}
      <DutyCodeTable dutyCodes={dutyCodes} />
    </div>
  )
}
