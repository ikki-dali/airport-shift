'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { requireAuth } from '@/lib/auth'
import { validateData, dutyCodeSchema, dutyCodeUpdateSchema } from '@/lib/validators/schemas'

export type DutyCode = Database['public']['Tables']['duty_codes']['Row']

export async function getDutyCodes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .select('*')
    .order('category', { ascending: true })
    .order('code', { ascending: true })

  if (error) handleSupabaseError(error, { action: 'getDutyCodes', entity: '勤務記号' })
  return data as DutyCode[]
}

export async function getDutyCode(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .select('*')
    .eq('id', id)
    .single()

  if (error) handleSupabaseError(error, { action: 'getDutyCode', entity: '勤務記号' })
  return data as DutyCode
}

export async function getDutyCodesByCategory(category: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .select('*')
    .eq('category', category)
    .order('code', { ascending: true })

  if (error) handleSupabaseError(error, { action: 'getDutyCodesByCategory', entity: '勤務記号' })
  return data as DutyCode[]
}

export type DutyCodeInput = Omit<DutyCode, 'id' | 'created_at' | 'updated_at'>

export async function createDutyCode(input: DutyCodeInput) {
  await requireAuth()
  const validated = validateData(dutyCodeSchema, input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .insert([validated as Database['public']['Tables']['duty_codes']['Insert']])
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'createDutyCode', entity: '勤務記号' })
  return data as DutyCode
}

export async function updateDutyCode(id: string, input: Partial<DutyCodeInput>) {
  await requireAuth()
  const validated = validateData(dutyCodeUpdateSchema, input)
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('duty_codes')
    .update(validated as Database['public']['Tables']['duty_codes']['Update'])
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'updateDutyCode', entity: '勤務記号' })
  return data as DutyCode
}

export async function deleteDutyCode(id: string) {
  await requireAuth()
  const supabase = await createClient()
  const { error } = await supabase
    .from('duty_codes')
    .delete()
    .eq('id', id)

  if (error) handleSupabaseError(error, { action: 'deleteDutyCode', entity: '勤務記号' })
  return { success: true }
}
