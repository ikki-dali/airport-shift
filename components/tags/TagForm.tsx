'use client'

import { useState } from 'react'
import { createTag, updateTag } from '@/lib/actions/tags'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type Tag = Database['public']['Tables']['tags']['Row']

interface TagFormProps {
  tag?: Tag
}

export function TagForm({ tag }: TagFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)

      if (tag) {
        await updateTag(tag.id, formData)
      } else {
        await createTag(formData)
      }

      router.push('/tags')
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
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          タグ名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          defaultValue={tag?.name}
          required
          maxLength={30}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 保安検査"
        />
        <p className="mt-1 text-sm text-gray-500">1-30文字、重複不可</p>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          説明
        </label>
        <textarea
          id="description"
          name="description"
          defaultValue={tag?.description || ''}
          rows={3}
          maxLength={200}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: T3中央、T3北、T2中央での保安検査業務"
        />
        <p className="mt-1 text-sm text-gray-500">最大200文字（任意）</p>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '保存中...' : tag ? '更新' : '作成'}
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
