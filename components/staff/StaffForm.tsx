'use client'

import { useState } from 'react'
import { createStaff, updateStaff } from '@/lib/actions/staff'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Staff = Database['public']['Tables']['staff']['Row']
type Role = Database['public']['Tables']['roles']['Row']
type Tag = Database['public']['Tables']['tags']['Row']

interface StaffFormProps {
  staff?: Staff
  roles: Role[]
  tags: Tag[]
}

export function StaffForm({ staff, roles, tags }: StaffFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>(staff?.tags || [])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)

      // タグを追加
      selectedTags.forEach((tag) => {
        formData.append('tags', tag)
      })

      if (staff) {
        await updateStaff(staff.id, formData)
      } else {
        await createStaff(formData)
      }

      router.push('/staff')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleTagToggle = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="employee_number"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          社員番号 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="employee_number"
          name="employee_number"
          defaultValue={staff?.employee_number}
          required
          maxLength={4}
          pattern="[0-9]{4}"
          disabled={!!staff}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="0001"
        />
        <p className="mt-1 text-sm text-gray-500">
          4桁の数字{staff ? '（変更不可）' : ''}
        </p>
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          氏名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={staff?.name}
          required
          maxLength={50}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="山田 太郎"
        />
        <p className="mt-1 text-sm text-gray-500">1-50文字</p>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          メールアドレス
        </label>
        <input
          type="email"
          id="email"
          name="email"
          defaultValue={staff?.email || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="yamada@example.com"
        />
        <p className="mt-1 text-sm text-gray-500">任意</p>
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          電話番号
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          defaultValue={staff?.phone || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="090-1234-5678"
        />
        <p className="mt-1 text-sm text-gray-500">任意</p>
      </div>

      <div>
        <label htmlFor="role_id" className="block text-sm font-medium text-gray-700 mb-2">
          役職
        </label>
        <select
          id="role_id"
          name="role_id"
          defaultValue={staff?.role_id || ''}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">選択してください</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
              {role.is_responsible ? ' (責任者)' : ''}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">任意</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">タグ</label>
        <div className="space-y-2">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag.name)}
                onChange={() => handleTagToggle(tag.name)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-900">
                {tag.name}
              </span>
              {tag.description && (
                <span className="ml-2 text-sm text-gray-500">
                  ({tag.description})
                </span>
              )}
            </label>
          ))}
        </div>
        <p className="mt-2 text-sm text-gray-500">
          選択中: {selectedTags.length > 0 ? selectedTags.join(', ') : 'なし'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          在籍状況
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="is_active"
              value="true"
              defaultChecked={staff?.is_active !== false}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-900">在籍中</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="is_active"
              value="false"
              defaultChecked={staff?.is_active === false}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-900">退職</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '保存中...' : staff ? '更新' : '作成'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
