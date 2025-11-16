'use client'

import { useState } from 'react'
import { createLocationRequirement, updateLocationRequirement } from '@/lib/actions/location-requirements'
import { useRouter } from 'next/navigation'
import type { Database } from '@/types/database'

type LocationRequirement = Database['public']['Tables']['location_requirements']['Row']
type DutyCode = Database['public']['Tables']['duty_codes']['Row']
type Tag = Database['public']['Tables']['tags']['Row']

interface RequirementFormProps {
  locationId: string
  requirement?: LocationRequirement
  dutyCodes: DutyCode[]
  tags: Tag[]
  onClose?: () => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: '日曜' },
  { value: 1, label: '月曜' },
  { value: 2, label: '火曜' },
  { value: 3, label: '水曜' },
  { value: 4, label: '木曜' },
  { value: 5, label: '金曜' },
  { value: 6, label: '土曜' },
]

export function RequirementForm({
  locationId,
  requirement,
  dutyCodes,
  tags,
  onClose,
}: RequirementFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [patternType, setPatternType] = useState<'default' | 'day_of_week' | 'specific_date'>(
    requirement?.day_of_week !== null
      ? 'day_of_week'
      : requirement?.specific_date !== null
      ? 'specific_date'
      : 'default'
  )

  const [selectedTags, setSelectedTags] = useState<string[]>(
    requirement?.required_tags || []
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const formData = new FormData(e.currentTarget)
      formData.set('location_id', locationId)
      formData.set('pattern_type', patternType)

      // タグを追加
      selectedTags.forEach((tag) => {
        formData.append('required_tags', tag)
      })

      if (requirement) {
        await updateLocationRequirement(requirement.id, formData)
      } else {
        await createLocationRequirement(formData)
      }

      if (onClose) {
        onClose()
      } else {
        router.push(`/locations/${locationId}/requirements`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleTagToggle = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
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
          htmlFor="duty_code_id"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          勤務記号 <span className="text-red-500">*</span>
        </label>
        <select
          id="duty_code_id"
          name="duty_code_id"
          defaultValue={requirement?.duty_code_id || ''}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">選択してください</option>
          {dutyCodes.map((dutyCode) => (
            <option key={dutyCode.id} value={dutyCode.id}>
              {dutyCode.code} ({dutyCode.start_time} - {dutyCode.end_time})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="required_staff_count"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            必要人数 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="number"
              id="required_staff_count"
              name="required_staff_count"
              defaultValue={requirement?.required_staff_count || 1}
              required
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-gray-500">名</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">1-100名</p>
        </div>

        <div>
          <label
            htmlFor="required_responsible_count"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            必要責任者数
          </label>
          <div className="relative">
            <input
              type="number"
              id="required_responsible_count"
              name="required_responsible_count"
              defaultValue={requirement?.required_responsible_count || 0}
              min="0"
              max="10"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-gray-500">名</span>
          </div>
          <p className="mt-1 text-sm text-gray-500">0-10名</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          必要タグ
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-lg p-3">
          {tags.map((tag) => (
            <label
              key={tag.id}
              className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
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
        <label className="block text-sm font-medium text-gray-700 mb-3">
          適用パターン <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              checked={patternType === 'default'}
              onChange={() => setPatternType('default')}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3">
              <div className="font-medium text-gray-900">デフォルト</div>
              <div className="text-sm text-gray-500">
                特に指定がない日に適用される要件
              </div>
            </div>
          </label>

          <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              checked={patternType === 'day_of_week'}
              onChange={() => setPatternType('day_of_week')}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3 flex-1">
              <div className="font-medium text-gray-900 mb-2">曜日指定</div>
              {patternType === 'day_of_week' && (
                <select
                  name="day_of_week"
                  defaultValue={requirement?.day_of_week?.toString() || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">曜日を選択</option>
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>

          <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              checked={patternType === 'specific_date'}
              onChange={() => setPatternType('specific_date')}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />
            <div className="ml-3 flex-1">
              <div className="font-medium text-gray-900 mb-2">特定日指定</div>
              {patternType === 'specific_date' && (
                <input
                  type="date"
                  name="specific_date"
                  defaultValue={requirement?.specific_date || ''}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          </label>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? '保存中...' : requirement ? '更新' : '作成'}
        </button>
        <button
          type="button"
          onClick={() => (onClose ? onClose() : router.back())}
          className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
