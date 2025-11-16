# Drag and Drop Implementation

## Library Selection

### @dnd-kit (Recommended)

Best modern drag-and-drop library for React.

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

**Pros:**
- Modern, actively maintained
- Excellent TypeScript support
- Accessible by default (keyboard support)
- Good performance
- Flexible and composable

**Cons:**
- Newer library (less Stack Overflow answers)
- Requires more setup than older libraries

## Basic Setup

### 1. Setup DnD Context

```typescript
// app/(dashboard)/shifts/page.tsx
'use client'

import { DndContext, DragEndEvent } from '@dnd-kit/core'

export default function ShiftsPage() {
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (!over) return
    
    // active = dragged item (staff)
    // over = drop target (shift slot)
    console.log(`Dropped ${active.id} onto ${over.id}`)
  }
  
  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* Your shift UI */}
    </DndContext>
  )
}
```

### 2. Create Draggable Staff Card

```typescript
// components/shifts/DraggableStaff.tsx
'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

interface DraggableStaffProps {
  staff: Staff
}

export function DraggableStaff({ staff }: DraggableStaffProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: staff.id,
    data: { staff } // Pass staff data for drop handling
  })
  
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        p-4 bg-white border rounded-lg shadow cursor-grab
        hover:shadow-md transition-shadow
        ${isDragging ? 'cursor-grabbing' : ''}
      `}
    >
      <div className="font-semibold">{staff.name}</div>
      <div className="text-sm text-gray-600">{staff.employee_number}</div>
      <div className="flex gap-1 mt-2">
        {staff.tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
            {tag}
          </span>
        ))}
      </div>
    </div>
  )
}
```

### 3. Create Droppable Shift Slot

```typescript
// components/shifts/DroppableShiftSlot.tsx
'use client'

import { useDroppable } from '@dnd-kit/core'

interface DroppableShiftSlotProps {
  slotId: string
  date: string
  location: Location
  dutyCode: DutyCode
  assignedStaff?: Staff
}

export function DroppableShiftSlot({ 
  slotId, 
  date, 
  location, 
  dutyCode,
  assignedStaff 
}: DroppableShiftSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: slotId,
    data: { date, location, dutyCode }
  })
  
  return (
    <div
      ref={setNodeRef}
      className={`
        p-4 border-2 border-dashed rounded-lg min-h-[100px]
        transition-colors
        ${isOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
        ${assignedStaff ? 'bg-green-50' : 'bg-white'}
      `}
    >
      <div className="text-sm font-semibold">{location.name}</div>
      <div className="text-xs text-gray-600">
        {dutyCode.code} ({dutyCode.start_time}-{dutyCode.end_time})
      </div>
      
      {assignedStaff ? (
        <div className="mt-2 p-2 bg-white rounded">
          <div className="font-medium">{assignedStaff.name}</div>
          <div className="text-xs text-gray-600">{assignedStaff.employee_number}</div>
        </div>
      ) : (
        <div className="mt-2 text-sm text-gray-400 text-center">
          ドラッグして配置
        </div>
      )}
    </div>
  )
}
```

## Complete Example: Shift Assignment

```typescript
// app/(dashboard)/shifts/assign/page.tsx
'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core'
import { DraggableStaff } from '@/components/shifts/DraggableStaff'
import { DroppableShiftSlot } from '@/components/shifts/DroppableShiftSlot'

export default function ShiftAssignmentPage() {
  const [staff, setStaff] = useState<Staff[]>([/* staff data */])
  const [shifts, setShifts] = useState<Shift[]>([/* shift data */])
  const [activeStaff, setActiveStaff] = useState<Staff | null>(null)
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveStaff(active.data.current?.staff)
  }
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveStaff(null)
    
    if (!over) return
    
    const staffData = active.data.current?.staff as Staff
    const slotData = over.data.current as {
      date: string
      location: Location
      dutyCode: DutyCode
    }
    
    // Validate assignment
    const violations = validateAssignment(staffData, slotData)
    if (violations.length > 0) {
      alert(`配置できません:\n${violations.join('\n')}`)
      return
    }
    
    // Create shift assignment
    const newShift: ShiftInsert = {
      staff_id: staffData.id,
      location_id: slotData.location.id,
      duty_code_id: slotData.dutyCode.id,
      date: slotData.date,
      status: 'pending'
    }
    
    // Save to database
    const supabase = createClient()
    const { data, error } = await supabase
      .from('shifts')
      .insert(newShift)
      .select()
      .single()
    
    if (error) {
      alert('エラーが発生しました')
      return
    }
    
    // Update local state
    setShifts([...shifts, data])
  }
  
  return (
    <DndContext 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-12 gap-4">
        {/* Staff List (Sidebar) */}
        <div className="col-span-3 space-y-2">
          <h2 className="font-bold text-lg mb-4">スタッフ</h2>
          {staff.map(s => (
            <DraggableStaff key={s.id} staff={s} />
          ))}
        </div>
        
        {/* Shift Slots Grid */}
        <div className="col-span-9">
          <h2 className="font-bold text-lg mb-4">シフト配置</h2>
          <div className="grid grid-cols-3 gap-4">
            {/* Generate shift slots for each location/time */}
            {locations.map(location => (
              dutyCodes.map(dutyCode => (
                <DroppableShiftSlot
                  key={`${location.id}-${dutyCode.id}`}
                  slotId={`slot-${location.id}-${dutyCode.id}`}
                  date={selectedDate}
                  location={location}
                  dutyCode={dutyCode}
                  assignedStaff={findAssignedStaff(location.id, dutyCode.id)}
                />
              ))
            ))}
          </div>
        </div>
      </div>
      
      {/* Drag Overlay (ghost element while dragging) */}
      <DragOverlay>
        {activeStaff && (
          <div className="p-4 bg-white border rounded-lg shadow-lg opacity-90">
            <div className="font-semibold">{activeStaff.name}</div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
```

## Advanced Features

### Collision Detection

```typescript
import { 
  DndContext, 
  closestCenter,
  closestCorners,
  rectIntersection,
  pointerWithin
} from '@dnd-kit/core'

<DndContext
  collisionDetection={closestCenter} // or closestCorners, rectIntersection, etc.
  onDragEnd={handleDragEnd}
>
  {/* ... */}
</DndContext>
```

### Custom Collision Detection

```typescript
import { CollisionDetection } from '@dnd-kit/core'

const customCollisionDetection: CollisionDetection = (args) => {
  // Only allow dropping on empty slots
  const emptySlots = args.droppableContainers.filter(container => {
    const data = container.data.current
    return !data?.assignedStaff
  })
  
  return closestCenter({
    ...args,
    droppableContainers: emptySlots
  })
}

<DndContext
  collisionDetection={customCollisionDetection}
>
```

### Sensors (Touch/Mouse/Keyboard)

```typescript
import {
  DndContext,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'

export default function ShiftAssignment() {
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10, // Require 10px movement before drag starts
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms press before drag starts (prevents scroll conflict)
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  )
  
  return (
    <DndContext sensors={sensors}>
      {/* ... */}
    </DndContext>
  )
}
```

### Sorting within Lists

```typescript
import {
  DndContext,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableStaffItem({ staff }: { staff: Staff }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: staff.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <StaffCard staff={staff} />
    </div>
  )
}

export function SortableStaffList({ staff }: { staff: Staff[] }) {
  const [items, setItems] = useState(staff)
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id)
        const newIndex = items.findIndex((i) => i.id === over.id)
        
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }
  
  return (
    <DndContext 
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext 
        items={items}
        strategy={verticalListSortingStrategy}
      >
        {items.map((staff) => (
          <SortableStaffItem key={staff.id} staff={staff} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

## Validation During Drag

### Show Warnings Before Drop

```typescript
'use client'

import { useState } from 'react'
import { DndContext, DragOverEvent } from '@dnd-kit/core'

export default function ShiftAssignment() {
  const [dragWarnings, setDragWarnings] = useState<string[]>([])
  
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    
    if (!over) {
      setDragWarnings([])
      return
    }
    
    const staffData = active.data.current?.staff as Staff
    const slotData = over.data.current
    
    // Validate in real-time
    const violations = validateAssignment(staffData, slotData)
    setDragWarnings(violations)
  }
  
  const handleDragEnd = () => {
    setDragWarnings([])
  }
  
  return (
    <DndContext
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {dragWarnings.length > 0 && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 p-4 rounded">
          <div className="font-bold mb-2">⚠️ 警告</div>
          {dragWarnings.map((warning, i) => (
            <div key={i} className="text-sm">{warning}</div>
          ))}
        </div>
      )}
      
      {/* Rest of UI */}
    </DndContext>
  )
}
```

### Conditional Drop Zones

```typescript
interface DroppableShiftSlotProps {
  // ...
  canAcceptStaff?: (staff: Staff) => boolean
}

export function DroppableShiftSlot({ 
  canAcceptStaff,
  ...props 
}: DroppableShiftSlotProps) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: props.slotId,
    data: props,
  })
  
  // Check if current dragged staff can be dropped here
  const canDrop = active 
    ? canAcceptStaff?.(active.data.current?.staff) ?? true
    : true
  
  return (
    <div
      ref={setNodeRef}
      className={`
        ${isOver && canDrop ? 'border-green-500 bg-green-50' : ''}
        ${isOver && !canDrop ? 'border-red-500 bg-red-50' : ''}
        ${!canDrop ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      {/* Slot content */}
    </div>
  )
}
```

## Accessibility

### Keyboard Support

@dnd-kit includes built-in keyboard support:
- **Space/Enter**: Pick up item
- **Arrow keys**: Move item
- **Space/Enter**: Drop item
- **Escape**: Cancel drag

### Screen Reader Announcements

```typescript
import { DndContext, Announcements } from '@dnd-kit/core'

const announcements: Announcements = {
  onDragStart({ active }) {
    return `${active.data.current?.staff.name}を選択しました`
  },
  onDragOver({ active, over }) {
    if (over) {
      return `${over.data.current?.location.name}の上にあります`
    }
    return `ドラッグ中`
  },
  onDragEnd({ active, over }) {
    if (over) {
      return `${active.data.current?.staff.name}を${over.data.current?.location.name}に配置しました`
    }
    return `配置をキャンセルしました`
  },
  onDragCancel({ active }) {
    return `ドラッグをキャンセルしました`
  },
}

<DndContext accessibility={{ announcements }}>
```

## Performance Optimization

### Virtualization with Drag and Drop

For large lists, combine with react-window:

```typescript
import { FixedSizeList } from 'react-window'
import { DndContext } from '@dnd-kit/core'

export function VirtualizedStaffList({ staff }: { staff: Staff[] }) {
  const Row = ({ index, style }: any) => (
    <div style={style}>
      <DraggableStaff staff={staff[index]} />
    </div>
  )
  
  return (
    <DndContext>
      <FixedSizeList
        height={600}
        itemCount={staff.length}
        itemSize={80}
        width="100%"
      >
        {Row}
      </FixedSizeList>
    </DndContext>
  )
}
```

### Optimize Re-renders

```typescript
import { memo } from 'react'

const DraggableStaff = memo(function DraggableStaff({ staff }: { staff: Staff }) {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison
  return prevProps.staff.id === nextProps.staff.id
})
```

## Mobile Optimization

### Touch-Friendly Targets

```typescript
<div 
  {...listeners}
  {...attributes}
  className="p-4 min-h-[44px] min-w-[44px]" // At least 44x44px for touch
>
  {/* Content */}
</div>
```

### Haptic Feedback (iOS)

```typescript
const handleDragStart = () => {
  // Trigger haptic feedback on supported devices
  if ('vibrate' in navigator) {
    navigator.vibrate(10) // 10ms vibration
  }
}

<DndContext onDragStart={handleDragStart}>
```

## Common Patterns

### Multi-Select Drag

```typescript
const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set())

const handleDragEnd = (event: DragEndEvent) => {
  // If dragging selected items, move all of them
  const staffToMove = selectedStaff.has(event.active.id)
    ? Array.from(selectedStaff).map(id => staff.find(s => s.id === id))
    : [event.active.data.current?.staff]
  
  // Process all staff movements
  staffToMove.forEach(assignStaff)
}
```

### Undo/Redo

```typescript
const [history, setHistory] = useState<Shift[][]>([[]])
const [historyIndex, setHistoryIndex] = useState(0)

const handleDragEnd = (event: DragEndEvent) => {
  // ... create shift
  
  // Add to history
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push([...shifts, newShift])
  setHistory(newHistory)
  setHistoryIndex(historyIndex + 1)
}

const undo = () => {
  if (historyIndex > 0) {
    setHistoryIndex(historyIndex - 1)
    setShifts(history[historyIndex - 1])
  }
}

const redo = () => {
  if (historyIndex < history.length - 1) {
    setHistoryIndex(historyIndex + 1)
    setShifts(history[historyIndex + 1])
  }
}
```
