# Next.js App Router Patterns

## Directory Structure

```
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── layout.tsx
├── (dashboard)/
│   ├── shifts/
│   │   ├── page.tsx          # Shift list/calendar
│   │   ├── [id]/
│   │   │   └── page.tsx      # Individual shift details
│   │   └── new/
│   │       └── page.tsx      # Create new shift
│   ├── staff/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── locations/
│   │   └── page.tsx
│   └── layout.tsx            # Shared dashboard layout
├── api/
│   ├── shifts/
│   │   └── route.ts          # API endpoint for shifts
│   └── validate/
│       └── route.ts          # Constraint validation endpoint
└── layout.tsx                # Root layout

components/
├── ui/                       # shadcn/ui components
├── shifts/
│   ├── ShiftCalendar.tsx
│   ├── ShiftCard.tsx
│   └── AssignmentForm.tsx
└── shared/
    ├── Header.tsx
    └── Sidebar.tsx

lib/
├── supabase/
│   ├── client.ts             # Client-side Supabase
│   ├── server.ts             # Server-side Supabase
│   └── middleware.ts         # Auth middleware
├── utils/
│   ├── date.ts
│   └── validation.ts
└── hooks/
    ├── useShifts.ts
    └── useStaff.ts

types/
├── supabase.ts               # Generated from Supabase
└── index.ts                  # Custom types
```

## Server Components vs Client Components

### Use Server Components (default) for:

- Data fetching
- Accessing backend resources directly
- Keeping sensitive information secure
- Reducing client-side JavaScript

```typescript
// app/shifts/page.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ShiftsPage() {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: shifts } = await supabase
    .from('shifts')
    .select('*, staff(*), locations(*)')
    .order('date', { ascending: true })
  
  return <ShiftList shifts={shifts} />
}
```

### Use Client Components ('use client') for:

- Interactive UI (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser-only APIs
- Real-time subscriptions

```typescript
// components/shifts/ShiftCalendar.tsx
'use client'

import { useState } from 'react'
import { useShifts } from '@/lib/hooks/useShifts'

export function ShiftCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const { shifts, loading } = useShifts(selectedDate)
  
  return (
    <div onClick={() => setSelectedDate(new Date())}>
      {/* Calendar UI */}
    </div>
  )
}
```

## Data Fetching Patterns

### Pattern 1: Server Component with Async/Await

```typescript
// app/shifts/[id]/page.tsx
export default async function ShiftDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: shift } = await supabase
    .from('shifts')
    .select('*, staff(*), duty_code(*)')
    .eq('id', params.id)
    .single()
  
  if (!shift) notFound()
  
  return <ShiftDetail shift={shift} />
}
```

### Pattern 2: Client Component with SWR/React Query

```typescript
// components/shifts/ShiftList.tsx
'use client'

import useSWR from 'swr'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function ShiftList() {
  const supabase = createClientComponentClient()
  
  const { data: shifts, mutate } = useSWR(
    'shifts',
    async () => {
      const { data } = await supabase
        .from('shifts')
        .select('*')
        .order('date')
      return data
    }
  )
  
  return <div>{/* Render shifts */}</div>
}
```

### Pattern 3: Real-Time Subscriptions

```typescript
// lib/hooks/useShifts.ts
'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export function useShifts(date: Date) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const supabase = createClientComponentClient()
  
  useEffect(() => {
    // Initial fetch
    const fetchShifts = async () => {
      const { data } = await supabase
        .from('shifts')
        .select('*')
        .eq('date', date.toISOString())
      setShifts(data || [])
    }
    
    fetchShifts()
    
    // Subscribe to real-time changes
    const channel = supabase
      .channel('shifts')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'shifts',
          filter: `date=eq.${date.toISOString()}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setShifts(prev => [...prev, payload.new as Shift])
          } else if (payload.eventType === 'UPDATE') {
            setShifts(prev => prev.map(s => 
              s.id === payload.new.id ? payload.new as Shift : s
            ))
          } else if (payload.eventType === 'DELETE') {
            setShifts(prev => prev.filter(s => s.id !== payload.old.id))
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [date, supabase])
  
  return { shifts, setShifts }
}
```

## Route Handlers (API Routes)

```typescript
// app/api/shifts/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const body = await request.json()
  
  // Validate shift constraints
  const violations = await validateShift(body)
  if (violations.length > 0) {
    return NextResponse.json(
      { errors: violations },
      { status: 400 }
    )
  }
  
  // Create shift
  const { data, error } = await supabase
    .from('shifts')
    .insert(body)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json(data)
}

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  
  let query = supabase
    .from('shifts')
    .select('*, staff(*), locations(*)')
  
  if (date) {
    query = query.eq('date', date)
  }
  
  const { data, error } = await query.order('date')
  
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json(data)
}
```

## Loading and Error States

### Loading UI

```typescript
// app/shifts/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 bg-gray-200 rounded animate-pulse" />
      <div className="h-64 bg-gray-200 rounded animate-pulse" />
    </div>
  )
}
```

### Error Boundary

```typescript
// app/shifts/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold">エラーが発生しました</h2>
      <p className="text-sm text-gray-600">{error.message}</p>
      <button 
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        再試行
      </button>
    </div>
  )
}
```

## Metadata and SEO

```typescript
// app/shifts/page.tsx
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'シフト管理',
  description: 'スタッフのシフトを管理します',
}

export default function ShiftsPage() {
  return <div>Shifts</div>
}
```

## Server Actions (for forms)

```typescript
// app/shifts/actions.ts
'use server'

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export async function createShift(formData: FormData) {
  const supabase = createServerComponentClient({ cookies })
  
  const shift = {
    staff_id: formData.get('staff_id'),
    location_id: formData.get('location_id'),
    date: formData.get('date'),
    duty_code_id: formData.get('duty_code_id'),
  }
  
  const { error } = await supabase
    .from('shifts')
    .insert(shift)
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/shifts')
  return { success: true }
}
```

```typescript
// app/shifts/new/page.tsx
import { createShift } from '../actions'

export default function NewShiftPage() {
  return (
    <form action={createShift}>
      <input name="staff_id" type="text" />
      <input name="location_id" type="text" />
      <input name="date" type="date" />
      <button type="submit">作成</button>
    </form>
  )
}
```

## Performance Optimization

### Use Streaming with Suspense

```typescript
// app/shifts/page.tsx
import { Suspense } from 'react'

export default function ShiftsPage() {
  return (
    <div>
      <h1>シフト管理</h1>
      <Suspense fallback={<ShiftListSkeleton />}>
        <ShiftList />
      </Suspense>
    </div>
  )
}
```

### Parallel Data Fetching

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  // Fetch in parallel
  const [shifts, staff, locations] = await Promise.all([
    fetchShifts(),
    fetchStaff(),
    fetchLocations(),
  ])
  
  return (
    <Dashboard 
      shifts={shifts}
      staff={staff}
      locations={locations}
    />
  )
}
```

### Image Optimization

```typescript
import Image from 'next/image'

<Image
  src="/staff-photo.jpg"
  alt="スタッフ写真"
  width={400}
  height={400}
  priority={false}
  placeholder="blur"
/>
```

## Type Safety Tips

```typescript
// types/index.ts
import { Database } from './supabase'

export type Shift = Database['public']['Tables']['shifts']['Row']
export type ShiftInsert = Database['public']['Tables']['shifts']['Insert']
export type ShiftUpdate = Database['public']['Tables']['shifts']['Update']

// Add custom types
export type ShiftWithRelations = Shift & {
  staff: Staff
  location: Location
  duty_code: DutyCode
}
```

## Best Practices

1. **Colocate related files** - Keep components, hooks, and utilities near where they're used
2. **Use TypeScript strict mode** - Catch errors at compile time
3. **Leverage Server Components** - Reduce JavaScript sent to client
4. **Implement error boundaries** - Graceful error handling
5. **Use loading states** - Better UX with skeleton screens
6. **Optimize images** - Use Next.js Image component
7. **Cache strategically** - Use revalidation for dynamic data
