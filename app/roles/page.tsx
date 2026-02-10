import { getRoles } from '@/lib/actions/roles'
import { RoleTable } from '@/components/roles/RoleTable'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  const roles = await getRoles()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">役職管理</h1>
          <p className="text-gray-600 mt-1">役職の登録・編集・削除</p>
        </div>
        <Link href="/roles/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新規役職追加
          </Button>
        </Link>
      </div>

      <RoleTable roles={roles} />
    </div>
  )
}
