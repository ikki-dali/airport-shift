'use client'

import { useEffect, useState, use } from 'react'
import { getLocation } from '@/lib/actions/locations'
import { getLocationRequirements } from '@/lib/actions/location-requirements'
import { getDutyCodes } from '@/lib/actions/duty-codes'
import { getTags } from '@/lib/actions/tags'
import { RequirementList } from '@/components/locations/RequirementList'
import { RequirementForm } from '@/components/locations/RequirementForm'
import Link from 'next/link'
import type { Database } from '@/types/database'

type Location = Database['public']['Tables']['locations']['Row']
type LocationRequirement = Database['public']['Tables']['location_requirements']['Row']
type DutyCode = Database['public']['Tables']['duty_codes']['Row']
type Tag = Database['public']['Tables']['tags']['Row']

export default function LocationRequirementsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [location, setLocation] = useState<Location | null>(null)
  const [requirements, setRequirements] = useState<any[]>([])
  const [dutyCodes, setDutyCodes] = useState<DutyCode[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingRequirement, setEditingRequirement] = useState<LocationRequirement | undefined>()

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      const [locationData, requirementsData, dutyCodesData, tagsData] = await Promise.all([
        getLocation(id),
        getLocationRequirements(id),
        getDutyCodes(),
        getTags(),
      ])

      setLocation(locationData)
      setRequirements(requirementsData)
      setDutyCodes(dutyCodesData)
      setTags(tagsData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (requirement: any) => {
    setEditingRequirement(requirement)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingRequirement(undefined)
    loadData()
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    )
  }

  if (!location) {
    return (
      <div className="container mx-auto p-8 flex justify-center items-center min-h-screen">
        <div className="text-red-500">配属箇所が見つかりません</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/locations"
            className="text-blue-600 hover:underline text-sm"
          >
            ← 配属箇所一覧に戻る
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">
          {location.location_name} の要件設定
        </h1>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
            {location.business_type}
          </span>
          <span className="font-mono text-blue-600">{location.code}</span>
        </div>
      </div>

      {showForm ? (
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">
            {editingRequirement ? '要件設定を編集' : '新規要件設定を追加'}
          </h2>
          <RequirementForm
            locationId={id}
            requirement={editingRequirement}
            dutyCodes={dutyCodes}
            tags={tags}
            onClose={handleCloseForm}
          />
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={() => {
              setEditingRequirement(undefined)
              setShowForm(true)
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            + 新規要件設定を追加
          </button>
        </div>
      )}

      <RequirementList
        requirements={requirements}
        locationId={id}
        onEdit={handleEdit}
      />
    </div>
  )
}
