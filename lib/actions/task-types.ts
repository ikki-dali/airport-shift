'use server'

import { createClient } from '@/lib/supabase/server'
import { handleSupabaseError } from '@/lib/errors/helpers'
import type { Database } from '@/types/database'

export type TaskType = Database['public']['Tables']['task_types']['Row']

export async function getTaskTypes() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_types')
    .select('*')
    .order('display_order')

  if (error) handleSupabaseError(error, { action: 'getTaskTypes', entity: '業務種別' })
  return data as TaskType[]
}

export async function getTaskType(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_types')
    .select('*')
    .eq('id', id)
    .single()

  if (error) handleSupabaseError(error, { action: 'getTaskType', entity: '業務種別' })
  return data as TaskType
}

export async function getTaskTypeByCode(code: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('task_types')
    .select('*')
    .eq('code', code)
    .single()

  if (error) handleSupabaseError(error, { action: 'getTaskTypeByCode', entity: '業務種別' })
  return data as TaskType
}
