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

export type DutyCodeInput = Omit<DutyCode, 'id' | 'created_at' | 'updated_at'>

export async function createDutyCode(input: DutyCodeInput) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .insert([input])
    .select()
    .single()

  if (error) throw error
  return data as DutyCode
}

export async function updateDutyCode(id: string, input: Partial<DutyCodeInput>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as DutyCode
}

export async function deleteDutyCode(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('duty_codes')
    .delete()
    .eq('id', id)

  if (error) throw error
  return { success: true }
}
