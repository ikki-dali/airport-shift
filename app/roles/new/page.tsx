import { RoleForm } from '@/components/roles/RoleForm'

export default function NewRolePage() {
  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">新規役職追加</h1>
      <RoleForm />
    </div>
  )
}
