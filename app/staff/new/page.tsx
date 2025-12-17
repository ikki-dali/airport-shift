import { getRoles } from '@/lib/actions/roles'
import { getTags } from '@/lib/actions/tags'
import { StaffForm } from '@/components/staff/StaffForm'

export const dynamic = 'force-dynamic'

export default async function NewStaffPage() {
  const [roles, tags] = await Promise.all([getRoles(), getTags()])

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">新規スタッフ追加</h1>
      <StaffForm roles={roles} tags={tags} />
    </div>
  )
}
