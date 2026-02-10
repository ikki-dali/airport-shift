'use client'

import { useState } from 'react'
import { createLocation, updateLocation } from '@/lib/actions/locations'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']

interface LocationFormProps {
  location?: Location
}

const CATEGORIES = [
  '保安検査場案内業務',
  'バス案内業務',
  '横特業務',
  'OSS業務',
  '番台業務',
] as const

export function LocationForm({ location }: LocationFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)

      if (location) {
        await updateLocation(location.id, formData)
      } else {
        await createLocation(formData)
      }

      router.push('/locations')
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
        <label
          htmlFor="business_type"
          className="block text-sm font-medium text-foreground mb-2"
        >
          業務種別 <span className="text-destructive">*</span>
        </label>
        <select
          id="business_type"
          name="business_type"
          defaultValue={location?.business_type || ''}
          required
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">選択してください</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-muted-foreground">配属箇所の業務種別を選択</p>
      </div>

      <div>
        <label htmlFor="location_name" className="block text-sm font-medium text-foreground mb-2">
          配属箇所名 <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="location_name"
          name="location_name"
          defaultValue={location?.location_name}
          required
          maxLength={50}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="例: T3中央"
        />
        <p className="mt-1 text-xs text-muted-foreground">1-50文字</p>
      </div>

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
          コード <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="code"
          name="code"
          defaultValue={location?.code}
          required
          maxLength={10}
          disabled={!!location}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="例: T3C"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          1-10文字、英数字{location ? '（変更不可）' : '、重複不可'}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          使用状況
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="radio"
              name="is_active"
              value="true"
              defaultChecked={location?.is_active !== false}
              className="w-4 h-4 text-primary border-gray-200 focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-900">使用中</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="is_active"
              value="false"
              defaultChecked={location?.is_active === false}
              className="w-4 h-4 text-primary border-gray-200 focus:ring-primary"
            />
            <span className="ml-2 text-sm text-gray-900">非使用</span>
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? '保存中...' : location ? '更新' : '作成'}
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
