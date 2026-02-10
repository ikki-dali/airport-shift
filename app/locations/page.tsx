import { getLocations } from '@/lib/actions/locations'
import { LocationTable } from '@/components/locations/LocationTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function LocationsPage() {
  const locations = await getLocations()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">配属箇所管理</h1>
          <p className="text-gray-600 mt-1">
            配属箇所の登録・編集・削除、および要件設定
          </p>
        </div>
        <Link href="/locations/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規配属箇所追加
          </Button>
        </Link>
      </div>

      <LocationTable locations={locations} />
    </div>
  )
}
