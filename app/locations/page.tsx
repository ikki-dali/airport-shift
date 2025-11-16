import { getLocations } from '@/lib/actions/locations'
import { LocationTable } from '@/components/locations/LocationTable'
import Link from 'next/link'

export default async function LocationsPage() {
  const locations = await getLocations()

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">配属箇所管理</h1>
          <p className="text-gray-600">
            配属箇所の登録・編集・削除、および要件設定
          </p>
        </div>
        <Link
          href="/locations/new"
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          + 新規配属箇所追加
        </Link>
      </div>

      <LocationTable locations={locations} />
    </div>
  )
}
