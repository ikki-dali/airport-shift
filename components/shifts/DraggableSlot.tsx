'use client'

import { useDraggable, useDroppable } from '@dnd-kit/core'
import { X } from 'lucide-react'

interface DraggableSlotProps {
  id: string
  slot: {
    shiftId?: string
    staffId?: string
    staffName?: string
    isEmpty: boolean
  }
  slotData: {
    date: string
    locationId: string
    dutyCodeId: string
  }
  onClick: () => void
  onDelete?: (e: React.MouseEvent) => void
}

export function DraggableSlot({
  id,
  slot,
  slotData,
  onClick,
  onDelete,
}: DraggableSlotProps) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
    id,
    data: {
      shift: slot.isEmpty
        ? undefined
        : {
            shiftId: slot.shiftId,
            staffId: slot.staffId,
            staffName: slot.staffName,
          },
    },
    disabled: slot.isEmpty, // 空きスロットはドラッグ不可
  })

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id,
    data: {
      slot: slotData,
    },
  })

  // ドラッグとドロップの両方のrefを設定
  const setRefs = (element: HTMLDivElement | null) => {
    setDragRef(element)
    setDropRef(element)
  }

  return (
    <div
      ref={setRefs}
      {...attributes}
      {...listeners}
      className={`
        group relative px-2 py-1.5 rounded text-xs text-center font-medium cursor-pointer
        transition-all
        ${
          slot.isEmpty
            ? 'bg-red-50 border border-dashed border-red-300 text-red-600'
            : 'bg-blue-50 border border-dashed border-blue-300 text-blue-900 cursor-move'
        }
        ${isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
        ${isOver && !isDragging ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
      `}
      onClick={onClick}
    >
      {!slot.isEmpty && onDelete && (
        <button
          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 z-10"
          onClick={onDelete}
        >
          <X className="w-3 h-3" />
        </button>
      )}
      {slot.isEmpty ? '空き' : slot.staffName}
    </div>
  )
}
