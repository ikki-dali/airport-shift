import { getRole } from '@/lib/actions/roles'
import { RoleForm } from '@/components/roles/RoleForm'
import { notFound } from 'next/navigation'

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  try {
    const role = await getRole(id)

    return (
      <div className="container mx-auto p-8 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6">役職編集</h1>
        <RoleForm role={role} />
      </div>
    )
  } catch (error) {
    notFound()
  }
}
