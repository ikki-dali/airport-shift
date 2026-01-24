import { getStaffById } from '@/lib/actions/staff'
import { getRoles } from '@/lib/actions/roles'
import { getTags } from '@/lib/actions/tags'
import { StaffForm } from '@/components/staff/StaffForm'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  let staff, roles, tags;
  try {
    [staff, roles, tags] = await Promise.all([
      getStaffById(id),
      getRoles(),
      getTags(),
    ])
  } catch {
    notFound()
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">スタッフ編集</h1>
      <StaffForm staff={staff} roles={roles} tags={tags} />
    </div>
  )
}
