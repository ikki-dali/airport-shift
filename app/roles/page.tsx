import { getRoles } from '@/lib/actions/roles'
import { RoleTable } from '@/components/roles/RoleTable'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function RolesPage() {
  const roles = await getRoles()

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">役職管理</h1>
          <p className="text-gray-600 mt-2">役職の登録・編集・削除</p>
        </div>
        <Link
          href="/roles/new"
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          + 新規役職追加
        </Link>
      </div>

      <RoleTable roles={roles} />
    </div>
  )
}
