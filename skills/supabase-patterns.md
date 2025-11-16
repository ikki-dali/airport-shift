# Supabase Integration Patterns

## Setup

### Installation

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Client Configuration

```typescript
// lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

export const createClient = () => 
  createClientComponentClient<Database>()
```

```typescript
// lib/supabase/server.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'

export const createServerClient = () =>
  createServerComponentClient<Database>({ cookies })
```

## Type Generation

Generate TypeScript types from your Supabase schema:

```bash
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

Re-run this command whenever your database schema changes.

## Database Patterns

### Basic CRUD Operations

```typescript
// Create
const { data, error } = await supabase
  .from('shifts')
  .insert({
    staff_id: '123',
    location_id: '456',
    date: '2025-01-01',
    duty_code_id: '789'
  })
  .select()
  .single()

// Read
const { data, error } = await supabase
  .from('shifts')
  .select('*')
  .eq('date', '2025-01-01')

// Update
const { data, error } = await supabase
  .from('shifts')
  .update({ status: 'confirmed' })
  .eq('id', shiftId)
  .select()

// Delete
const { data, error } = await supabase
  .from('shifts')
  .delete()
  .eq('id', shiftId)
```

### Joins and Relations

```typescript
// One-to-many join
const { data, error } = await supabase
  .from('shifts')
  .select(`
    *,
    staff:staff_id (*),
    location:location_id (*),
    duty_code:duty_code_id (*)
  `)
  .eq('date', '2025-01-01')

// Type the response
type ShiftWithRelations = Database['public']['Tables']['shifts']['Row'] & {
  staff: Database['public']['Tables']['staff']['Row']
  location: Database['public']['Tables']['locations']['Row']
  duty_code: Database['public']['Tables']['duty_codes']['Row']
}

const shifts: ShiftWithRelations[] = data || []
```

### Filtering

```typescript
// Multiple conditions
const { data } = await supabase
  .from('shifts')
  .select('*')
  .eq('status', 'confirmed')
  .gte('date', '2025-01-01')
  .lte('date', '2025-01-31')
  .order('date', { ascending: true })

// OR conditions
const { data } = await supabase
  .from('shifts')
  .select('*')
  .or('status.eq.confirmed,status.eq.pending')

// IN operator
const { data } = await supabase
  .from('shifts')
  .select('*')
  .in('staff_id', ['id1', 'id2', 'id3'])

// Array contains
const { data } = await supabase
  .from('staff')
  .select('*')
  .contains('tags', ['リーダー', 'フォークリフト'])

// Text search
const { data } = await supabase
  .from('staff')
  .select('*')
  .ilike('name', '%田中%')
```

### Pagination

```typescript
const PAGE_SIZE = 20

const { data, error, count } = await supabase
  .from('shifts')
  .select('*', { count: 'exact' })
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  .order('date', { ascending: true })

const totalPages = Math.ceil((count || 0) / PAGE_SIZE)
```

### Aggregation

```typescript
// Count
const { count } = await supabase
  .from('shifts')
  .select('*', { count: 'exact', head: true })
  .eq('date', '2025-01-01')

// With RPC for complex aggregations
const { data, error } = await supabase
  .rpc('get_shift_stats', {
    start_date: '2025-01-01',
    end_date: '2025-01-31'
  })
```

## Real-Time Subscriptions

### Basic Subscription

```typescript
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeShifts(date: string) {
  const [shifts, setShifts] = useState<Shift[]>([])
  const supabase = createClient()
  
  useEffect(() => {
    // Initial fetch
    const fetchShifts = async () => {
      const { data } = await supabase
        .from('shifts')
        .select('*')
        .eq('date', date)
      setShifts(data || [])
    }
    
    fetchShifts()
    
    // Subscribe to changes
    const channel = supabase
      .channel(`shifts:${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shifts',
          filter: `date=eq.${date}`
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
  
  return shifts
}
```

### Presence (Who's Online)

```typescript
const channel = supabase.channel('shift-editor')

channel
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState()
    console.log('Online users:', state)
  })
  .on('presence', { event: 'join' }, ({ newPresences }) => {
    console.log('User joined:', newPresences)
  })
  .on('presence', { event: 'leave' }, ({ leftPresences }) => {
    console.log('User left:', leftPresences)
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id: userId, online_at: new Date() })
    }
  })
```

## Row Level Security (RLS)

### Enable RLS

```sql
-- Enable RLS on a table
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read all shifts
CREATE POLICY "Anyone can read shifts"
  ON shifts FOR SELECT
  TO authenticated
  USING (true);

-- Create policy: Only managers can insert shifts
CREATE POLICY "Managers can insert shifts"
  ON shifts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.id = auth.uid()
      AND staff.role_id IN (
        SELECT id FROM roles WHERE name = '管理者'
      )
    )
  );

-- Create policy: Users can only update their own shifts
CREATE POLICY "Users can update own shifts"
  ON shifts FOR UPDATE
  TO authenticated
  USING (staff_id = auth.uid())
  WITH CHECK (staff_id = auth.uid());
```

## Authentication

### Sign In

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const supabase = createClient()
  
  const handleLogin = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    if (error) {
      console.error('Login error:', error.message)
      return
    }
    
    // Redirect to dashboard
    window.location.href = '/dashboard'
  }
  
  return (
    // Login form UI
  )
}
```

### Get Current User

```typescript
// Server Component
import { createServerClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = createServerClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  return <div>Welcome, {user.email}</div>
}
```

```typescript
// Client Component
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function UserProfile() {
  const [user, setUser] = useState(null)
  const supabase = createClient()
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    
    getUser()
  }, [supabase])
  
  return <div>{user?.email}</div>
}
```

### Middleware for Protected Routes

```typescript
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Redirect to login if not authenticated
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  return res
}

export const config = {
  matcher: ['/dashboard/:path*']
}
```

## Optimistic Updates

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function ShiftAssignment() {
  const [shifts, setShifts] = useState<Shift[]>([])
  const supabase = createClient()
  
  const assignShift = async (newShift: ShiftInsert) => {
    // Optimistic update
    const optimisticShift = { ...newShift, id: crypto.randomUUID() }
    setShifts(prev => [...prev, optimisticShift as Shift])
    
    try {
      // Actual insert
      const { data, error } = await supabase
        .from('shifts')
        .insert(newShift)
        .select()
        .single()
      
      if (error) throw error
      
      // Replace optimistic with real data
      setShifts(prev => prev.map(s =>
        s.id === optimisticShift.id ? data : s
      ))
    } catch (error) {
      // Rollback on error
      setShifts(prev => prev.filter(s => s.id !== optimisticShift.id))
      console.error('Failed to assign shift:', error)
    }
  }
  
  return (
    // UI
  )
}
```

## Error Handling

```typescript
type SupabaseError = {
  message: string
  details?: string
  hint?: string
  code?: string
}

const handleSupabaseError = (error: SupabaseError) => {
  // Log to error tracking service
  console.error('Supabase error:', {
    message: error.message,
    code: error.code,
    details: error.details
  })
  
  // User-friendly messages
  const userMessage = error.code === '23505'
    ? 'このシフトは既に登録されています'
    : error.code === '23503'
    ? '関連するデータが見つかりません'
    : 'エラーが発生しました。もう一度お試しください。'
  
  return userMessage
}
```

## Performance Optimization

### Use Indexes

```sql
-- Add index for frequently queried columns
CREATE INDEX idx_shifts_date ON shifts(date);
CREATE INDEX idx_shifts_staff_id ON shifts(staff_id);
CREATE INDEX idx_shifts_location_id ON shifts(location_id);

-- Composite index for common query patterns
CREATE INDEX idx_shifts_date_staff ON shifts(date, staff_id);
```

### Limit Select Fields

```typescript
// ❌ Bad: Fetching all columns
const { data } = await supabase
  .from('shifts')
  .select('*')

// ✅ Good: Only fetch needed columns
const { data } = await supabase
  .from('shifts')
  .select('id, date, staff_id, status')
```

### Use Views for Complex Queries

```sql
-- Create a materialized view for shift statistics
CREATE MATERIALIZED VIEW shift_stats AS
SELECT
  date,
  COUNT(*) as total_shifts,
  COUNT(DISTINCT staff_id) as unique_staff,
  COUNT(DISTINCT location_id) as locations_covered
FROM shifts
GROUP BY date;

-- Refresh periodically
REFRESH MATERIALIZED VIEW shift_stats;
```

## Testing with Supabase

```typescript
// lib/supabase/test-client.ts
import { createClient } from '@supabase/supabase-js'

export const createTestClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for tests
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
```

## Common Patterns

### Upsert (Insert or Update)

```typescript
const { data, error } = await supabase
  .from('shifts')
  .upsert({
    id: shiftId,
    staff_id: staffId,
    date: date,
    // ... other fields
  })
  .select()
```

### Transactions with RPC

```sql
-- Create a database function for atomic operations
CREATE OR REPLACE FUNCTION assign_shift_with_validation(
  p_staff_id UUID,
  p_location_id UUID,
  p_date DATE,
  p_duty_code_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_violations TEXT[];
  v_shift_id UUID;
BEGIN
  -- Validate constraints
  -- (Add validation logic here)
  
  -- If valid, insert shift
  INSERT INTO shifts (staff_id, location_id, date, duty_code_id)
  VALUES (p_staff_id, p_location_id, p_date, p_duty_code_id)
  RETURNING id INTO v_shift_id;
  
  RETURN json_build_object(
    'shift_id', v_shift_id,
    'violations', v_violations
  );
END;
$$;
```

```typescript
// Call from TypeScript
const { data, error } = await supabase
  .rpc('assign_shift_with_validation', {
    p_staff_id: staffId,
    p_location_id: locationId,
    p_date: date,
    p_duty_code_id: dutyCodeId
  })
```
