# Calendar UI Implementation

## Library Selection

### Option 1: react-big-calendar (Recommended)

Best for: Full-featured calendar with built-in month/week/day views

```bash
npm install react-big-calendar date-fns
```

**Pros:**
- Mature, well-maintained
- Multiple view types out of the box
- Good TypeScript support
- Customizable styling

**Cons:**
- Larger bundle size
- Some features may be overkill

### Option 2: FullCalendar

Best for: Rich feature set with extensive customization

```bash
npm install @fullcalendar/core @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid
```

**Pros:**
- Extremely feature-rich
- Beautiful default styles
- Extensive documentation

**Cons:**
- Commercial license for some features
- Heavier bundle size

### Option 3: Custom Implementation

Best for: Specific requirements, minimal bundle size

**Pros:**
- Full control
- Lightweight
- Exactly what you need

**Cons:**
- More development time
- Need to handle edge cases

## Basic react-big-calendar Setup

```typescript
// components/shifts/ShiftCalendar.tsx
'use client'

import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const locales = {
  'ja': ja,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

interface ShiftCalendarProps {
  shifts: Shift[]
  onSelectSlot: (slotInfo: { start: Date; end: Date }) => void
  onSelectEvent: (event: Shift) => void
}

export function ShiftCalendar({ 
  shifts, 
  onSelectSlot, 
  onSelectEvent 
}: ShiftCalendarProps) {
  // Transform shifts to calendar events
  const events = shifts.map(shift => ({
    id: shift.id,
    title: `${shift.staff.name} - ${shift.location.name}`,
    start: new Date(shift.date + 'T' + shift.duty_code.start_time),
    end: new Date(shift.date + 'T' + shift.duty_code.end_time),
    resource: shift,
  }))

  return (
    <div className="h-[600px]">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectSlot={onSelectSlot}
        onSelectEvent={onSelectEvent}
        selectable
        views={['month', 'week', 'day']}
        defaultView="month"
        culture="ja"
      />
    </div>
  )
}
```

## Custom Event Components

### Custom Event Styling

```typescript
import { Calendar, EventProps } from 'react-big-calendar'

function EventComponent({ event }: EventProps) {
  const shift = event.resource as Shift
  
  // Different colors based on shift status
  const getBgColor = () => {
    switch (shift.status) {
      case 'confirmed': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }
  
  return (
    <div className={`${getBgColor()} text-white p-1 rounded text-xs`}>
      <div className="font-semibold">{shift.staff.name}</div>
      <div>{shift.location.name}</div>
      <div>{shift.duty_code.code}</div>
    </div>
  )
}

<Calendar
  // ... other props
  components={{
    event: EventComponent
  }}
/>
```

### Custom Toolbar

```typescript
interface CustomToolbarProps {
  date: Date
  view: string
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void
  onView: (view: string) => void
}

function CustomToolbar({ 
  date, 
  view, 
  onNavigate, 
  onView 
}: CustomToolbarProps) {
  return (
    <div className="flex justify-between items-center mb-4 p-4 bg-white shadow rounded">
      <div className="flex gap-2">
        <button
          onClick={() => onNavigate('TODAY')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          今日
        </button>
        <button
          onClick={() => onNavigate('PREV')}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          ←
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          →
        </button>
      </div>
      
      <h2 className="text-xl font-bold">
        {format(date, 'yyyy年M月', { locale: ja })}
      </h2>
      
      <div className="flex gap-2">
        {['month', 'week', 'day'].map(v => (
          <button
            key={v}
            onClick={() => onView(v)}
            className={`px-4 py-2 rounded ${
              view === v 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            {v === 'month' ? '月' : v === 'week' ? '週' : '日'}
          </button>
        ))}
      </div>
    </div>
  )
}

<Calendar
  // ... other props
  components={{
    toolbar: CustomToolbar
  }}
/>
```

## Month View Customization

### Cell Rendering

```typescript
interface DateCellWrapperProps {
  value: Date
  children: React.ReactNode
}

function DateCellWrapper({ value, children }: DateCellWrapperProps) {
  const dayShifts = shifts.filter(s => 
    isSameDay(new Date(s.date), value)
  )
  
  const requiredStaff = getRequiredStaff(value)
  const assignedStaff = dayShifts.length
  const isUnderstaffed = assignedStaff < requiredStaff
  
  return (
    <div className={`h-full ${isUnderstaffed ? 'bg-red-50' : ''}`}>
      {children}
      <div className="absolute bottom-1 right-1 text-xs">
        <span className={isUnderstaffed ? 'text-red-600 font-bold' : 'text-gray-600'}>
          {assignedStaff}/{requiredStaff}
        </span>
      </div>
    </div>
  )
}

<Calendar
  // ... other props
  components={{
    dateCellWrapper: DateCellWrapper
  }}
/>
```

## Week/Day View Customization

### Time Slot Customization

```typescript
<Calendar
  // ... other props
  min={new Date(2025, 0, 1, 4, 0)} // Start at 4:00 AM
  max={new Date(2025, 0, 1, 23, 59)} // End at 11:59 PM
  step={30} // 30-minute intervals
  timeslots={2} // 2 slots per step = 15-minute divisions
/>
```

### Custom Time Gutter

```typescript
function TimeGutterHeader() {
  return (
    <div className="font-bold text-sm">時間</div>
  )
}

<Calendar
  // ... other props
  components={{
    timeGutterHeader: TimeGutterHeader
  }}
/>
```

## Location-Based Multi-Calendar View

For displaying multiple locations side by side:

```typescript
'use client'

import { useState } from 'react'

export function MultiLocationCalendar({ 
  locations, 
  shifts 
}: { 
  locations: Location[]
  shifts: Shift[] 
}) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {locations.map(location => {
        const locationShifts = shifts.filter(
          s => s.location_id === location.id
        )
        
        return (
          <div key={location.id} className="border rounded-lg p-4">
            <h3 className="font-bold mb-2">{location.name}</h3>
            <ShiftCalendar
              shifts={locationShifts}
              onSelectSlot={(slotInfo) => {
                // Handle slot selection for this location
              }}
              onSelectEvent={(event) => {
                // Handle event selection
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
```

## Responsive Design

```typescript
'use client'

import { useState, useEffect } from 'react'

export function ResponsiveCalendar({ shifts }: { shifts: Shift[] }) {
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return (
    <Calendar
      // ... other props
      defaultView={isMobile ? 'day' : 'month'}
      views={isMobile ? ['day', 'agenda'] : ['month', 'week', 'day']}
    />
  )
}
```

## Constraint Visualization

### Show Warnings on Calendar

```typescript
function EventComponent({ event }: EventProps) {
  const shift = event.resource as Shift
  const violations = validateShift(shift)
  
  return (
    <div className={`relative ${violations.length > 0 ? 'border-2 border-red-500' : ''}`}>
      {violations.length > 0 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-xs">!</span>
        </div>
      )}
      <div className="p-1">
        <div className="font-semibold">{shift.staff.name}</div>
        <div className="text-xs">{shift.location.name}</div>
      </div>
      
      {violations.length > 0 && (
        <div className="absolute z-10 hidden group-hover:block bg-white border border-red-500 rounded shadow-lg p-2 text-xs">
          {violations.map((v, i) => (
            <div key={i} className="text-red-600">{v}</div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## Performance Optimization

### Memoization

```typescript
import { useMemo } from 'react'

export function ShiftCalendar({ shifts }: { shifts: Shift[] }) {
  const events = useMemo(() => {
    return shifts.map(shift => ({
      id: shift.id,
      title: `${shift.staff.name} - ${shift.location.name}`,
      start: new Date(shift.date + 'T' + shift.duty_code.start_time),
      end: new Date(shift.date + 'T' + shift.duty_code.end_time),
      resource: shift,
    }))
  }, [shifts])
  
  return <Calendar events={events} {...otherProps} />
}
```

### Virtual Scrolling for Large Datasets

For calendars with many events, consider using virtualization:

```typescript
import { FixedSizeList } from 'react-window'

// For day/week views with many shifts
function VirtualizedDayView({ shifts }: { shifts: Shift[] }) {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <ShiftCard shift={shifts[index]} />
    </div>
  )
  
  return (
    <FixedSizeList
      height={600}
      itemCount={shifts.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  )
}
```

## Custom CSS Styling

```css
/* styles/calendar.css */

/* Override default calendar styles */
.rbc-calendar {
  font-family: inherit;
}

/* Month view cells */
.rbc-day-bg {
  @apply border-gray-200;
}

.rbc-today {
  @apply bg-blue-50;
}

/* Events */
.rbc-event {
  @apply rounded shadow-sm;
  background-color: transparent !important;
}

.rbc-event-label {
  @apply text-xs;
}

/* Selected event */
.rbc-event.rbc-selected {
  @apply ring-2 ring-blue-500;
}

/* Time slots */
.rbc-time-slot {
  @apply min-h-[40px];
}

/* Header */
.rbc-header {
  @apply py-2 font-semibold border-b-2;
}

/* Toolbar */
.rbc-toolbar {
  @apply mb-4;
}

/* Weekend styling */
.rbc-day-bg.rbc-off-range-bg {
  @apply bg-gray-50;
}
```

## Accessibility

```typescript
<Calendar
  // ... other props
  messages={{
    date: '日付',
    time: '時間',
    event: 'シフト',
    allDay: '終日',
    week: '週',
    work_week: '平日',
    day: '日',
    month: '月',
    previous: '前へ',
    next: '次へ',
    yesterday: '昨日',
    tomorrow: '明日',
    today: '今日',
    agenda: '予定',
    noEventsInRange: 'この期間にシフトはありません。',
    showMore: (total) => `+${total}件表示`,
  }}
/>
```

## Example: Complete Shift Calendar Component

```typescript
'use client'

import { useState, useCallback } from 'react'
import { Calendar, dateFnsLocalizer, SlotInfo } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { ja } from 'date-fns/locale'
import 'react-big-calendar/lib/css/react-big-calendar.css'

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales: { ja },
})

interface ShiftCalendarProps {
  shifts: Shift[]
  onCreateShift: (slotInfo: SlotInfo) => void
  onUpdateShift: (shift: Shift) => void
}

export function ShiftCalendar({ 
  shifts, 
  onCreateShift,
  onUpdateShift 
}: ShiftCalendarProps) {
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')
  const [date, setDate] = useState(new Date())
  
  const events = shifts.map(shift => ({
    id: shift.id,
    title: `${shift.staff.name} - ${shift.location.name}`,
    start: new Date(`${shift.date}T${shift.duty_code.start_time}`),
    end: new Date(`${shift.date}T${shift.duty_code.end_time}`),
    resource: shift,
  }))
  
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    onCreateShift(slotInfo)
  }, [onCreateShift])
  
  const handleSelectEvent = useCallback((event: any) => {
    onUpdateShift(event.resource)
  }, [onUpdateShift])
  
  return (
    <div className="h-[800px] bg-white rounded-lg shadow p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        onView={setView}
        onNavigate={setDate}
        view={view}
        date={date}
        selectable
        views={['month', 'week', 'day']}
        culture="ja"
        min={new Date(2025, 0, 1, 4, 0)}
        max={new Date(2025, 0, 1, 23, 59)}
      />
    </div>
  )
}
```
