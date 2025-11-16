'use client'

import { useDraggable } from '@dnd-kit/core'
import type { Staff } from '@/lib/actions/staff'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StaffFilter, type StaffFilterState } from './StaffFilter'
import { useState } from 'react'

interface Role {
  id: string
  name: string
}

interface StaffListProps {
  staff: Staff[]
  roles?: Role[]
  allTags?: string[]
}

function DraggableStaffItem({ staff, compact }: { staff: Staff; compact: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: staff.id,
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
      }
    : undefined

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium hover:border-blue-300 hover:shadow-sm transition-all cursor-move"
      >
        <div className="h-5 w-5 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-[10px]">
          {staff.name.charAt(0)}
        </div>
        {staff.name}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all cursor-move"
    >
      <div className="font-medium text-sm">{staff.name}</div>
      <div className="text-xs text-gray-500 mt-1">{staff.employee_number}</div>
      {staff.roles && (
        <div className="mt-2">
          <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
            {staff.roles.name}
          </span>
        </div>
      )}
      {staff.tags && staff.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {staff.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">
              {tag}
            </span>
          ))}
          {staff.tags.length > 3 && (
            <span className="text-[10px] text-gray-500">+{staff.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  )
}

export function StaffList({ staff, roles = [], allTags = [] }: StaffListProps) {
  const [filter, setFilter] = useState<StaffFilterState>({
    search: '',
    roleId: '',
    tags: [],
  })
  const [compact, setCompact] = useState(false)

  const filteredStaff = staff.filter((s) => {
    // 検索フィルター
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      if (
        !s.name.toLowerCase().includes(searchLower) &&
        !s.employee_number.toLowerCase().includes(searchLower)
      ) {
        return false
      }
    }

    // 役職フィルター
    if (filter.roleId && s.role_id !== filter.roleId) {
      return false
    }

    // タグフィルター
    if (filter.tags.length > 0) {
      const staffTags = s.tags || []
      if (!filter.tags.every((tag) => staffTags.includes(tag))) {
        return false
      }
    }

    return true
  })

  return (
    <Card className="h-[calc(100vh-250px)] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg mb-3">スタッフ一覧</CardTitle>
        <StaffFilter
          roles={roles}
          allTags={allTags}
          onFilterChange={setFilter}
          compact={compact}
          onCompactChange={setCompact}
        />
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        {filteredStaff.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            スタッフが見つかりません
          </div>
        ) : compact ? (
          <div className="flex flex-wrap gap-2">
            {filteredStaff.map((s) => (
              <DraggableStaffItem key={s.id} staff={s} compact={compact} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredStaff.map((s) => (
              <DraggableStaffItem key={s.id} staff={s} compact={compact} />
            ))}
          </div>
        )}
        <div className="text-xs text-gray-500 mt-4 pt-4 border-t">
          {filteredStaff.length} / {staff.length} 名
        </div>
      </CardContent>
    </Card>
  )
}
