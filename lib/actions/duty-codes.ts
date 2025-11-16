'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

export type DutyCode = Database['public']['Tables']['duty_codes']['Row']

export async function getDutyCodes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .select('*')
    .order('category', { ascending: true })
    .order('code', { ascending: true })

  if (error) throw error
  return data as DutyCode[]
}

export async function getDutyCode(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as DutyCode
}

export async function getDutyCodesByCategory(category: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .select('*')
    .eq('category', category)
    .order('code', { ascending: true })

  if (error) throw error
  return data as DutyCode[]
}
