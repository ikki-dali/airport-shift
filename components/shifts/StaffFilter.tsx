'use client'

import { useState } from 'react'

interface Role {
  id: string
  name: string
}

interface StaffFilterProps {
  roles: Role[]
  allTags: string[]
  onFilterChange: (filter: StaffFilterState) => void
  compact: boolean
  onCompactChange: (compact: boolean) => void
}

export interface StaffFilterState {
  search: string
  roleId: string
  tags: string[]
}

export function StaffFilter({
  roles,
  allTags,
  onFilterChange,
  compact,
  onCompactChange,
}: StaffFilterProps) {
  const [filter, setFilter] = useState<StaffFilterState>({
    search: '',
    roleId: '',
    tags: [],
  })

  const handleSearchChange = (search: string) => {
    const newFilter = { ...filter, search }
    setFilter(newFilter)
    onFilterChange(newFilter)
  }

  const handleRoleChange = (roleId: string) => {
    const newFilter = { ...filter, roleId }
    setFilter(newFilter)
    onFilterChange(newFilter)
  }

  const handleTagToggle = (tag: string) => {
    const newTags = filter.tags.includes(tag)
      ? filter.tags.filter((t) => t !== tag)
      : [...filter.tags, tag]
    const newFilter = { ...filter, tags: newTags }
    setFilter(newFilter)
    onFilterChange(newFilter)
  }

  const hasActiveFilters = filter.search || filter.roleId || filter.tags.length > 0

  const handleClear = () => {
    const newFilter = { search: '', roleId: '', tags: [] }
    setFilter(newFilter)
    onFilterChange(newFilter)
  }

  return (
    <div className="space-y-3">
      {/* 検索ボックス */}
      <div className="relative">
        <input
          type="text"
          value={filter.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="スタッフ検索..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none"
        />
        <svg
          className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* フィルターとコンパクト表示 */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {/* 役職フィルター */}
          <select
            value={filter.roleId}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
          >
            <option value="">全役職</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>

          {/* タグフィルター */}
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagToggle(tag)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
                filter.tags.includes(tag)
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tag}
            </button>
          ))}

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              クリア
            </button>
          )}
        </div>

        {/* コンパクト表示切り替え */}
        <button
          onClick={() => onCompactChange(!compact)}
          className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
            compact
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
          title={compact ? '通常表示' : 'コンパクト表示'}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
