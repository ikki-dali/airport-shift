import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getStaff } from '@/lib/actions/staff'
import { getRoles } from '@/lib/actions/roles'
import { getTags } from '@/lib/actions/tags'
import { StaffSearch } from '@/components/staff/StaffSearch'
import { BulkImportButton } from '@/components/staff/BulkImportButton'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function StaffPage() {
  // 実際のデータを取得
  const [staff, roles, tags] = await Promise.all([
    getStaff(),
    getRoles(),
    getTags(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">スタッフ管理</h1>
          <p className="text-gray-600 mt-1">スタッフの登録・編集・検索</p>
        </div>
        <div className="flex gap-2">
          <BulkImportButton roles={roles} tags={tags} />
          <Link href="/staff/new">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              新規登録
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <StaffSearch staff={staff} roles={roles} tags={tags} />
        </CardHeader>
      </Card>
    </div>
  )
}
