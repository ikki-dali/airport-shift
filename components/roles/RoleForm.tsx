'use client'

import { useState } from 'react'
import { createRole, updateRole } from '@/lib/actions/roles'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type Role = Database['public']['Tables']['roles']['Row']

interface RoleFormProps {
  role?: Role
}

export function RoleForm({ role }: RoleFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)

      if (role) {
        await updateRole(role.id, formData)
      } else {
        await createRole(formData)
      }

      router.push('/roles')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded text-destructive">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
          役職名 <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={role?.name}
          required
          maxLength={50}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="例: リーダー"
        />
        <p className="mt-1 text-xs text-muted-foreground">1-50文字</p>
      </div>

      <div>
        <label htmlFor="priority" className="block text-sm font-medium text-foreground mb-2">
          優先度
        </label>
        <input
          type="number"
          id="priority"
          name="priority"
          defaultValue={role?.priority ?? 0}
          min={0}
          max={100}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <p className="mt-1 text-xs text-muted-foreground">0-100（数値が大きいほど上位）</p>
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_responsible"
          name="is_responsible"
          defaultChecked={role?.is_responsible}
          className="w-4 h-4 text-primary border-gray-200 rounded focus:ring-primary"
        />
        <label htmlFor="is_responsible" className="ml-2 text-sm font-medium text-foreground">
          責任者になれる
        </label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? '保存中...' : role ? '更新' : '作成'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          className="flex-1"
        >
          キャンセル
        </Button>
      </div>
    </form>
  )
}
