'use server'

import { createClient } from '@/lib/supabase/server'
import { handleSupabaseError } from '@/lib/errors/helpers'
import type { Database } from '@/types/database'

export type ShiftTask = Database['public']['Tables']['shift_tasks']['Row']

export type ShiftTaskWithTaskType = ShiftTask & {
  task_types: {
    id: string
    code: string
    name: string
  }
}

export async function getShiftTasks(shiftId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shift_tasks')
    .select(`
      *,
      task_types (
        id,
        code,
        name
      )
    `)
    .eq('shift_id', shiftId)
    .order('hours', { ascending: false })

  if (error) handleSupabaseError(error, { action: 'getShiftTasks', entity: 'シフト業務配分' })
  return data as ShiftTaskWithTaskType[]
}

export async function getShiftTasksByShiftIds(shiftIds: string[]) {
  if (shiftIds.length === 0) return []
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shift_tasks')
    .select(`
      *,
      task_types (
        id,
        code,
        name
      )
    `)
    .in('shift_id', shiftIds)

  if (error) handleSupabaseError(error, { action: 'getShiftTasksByShiftIds', entity: 'シフト業務配分' })
  return data as ShiftTaskWithTaskType[]
}

export interface ShiftTaskInput {
  shift_id: string
  task_type_id: string
  hours: number
  notes?: string | null
}

export async function createShiftTask(input: ShiftTaskInput) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shift_tasks')
    .insert([input])
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'createShiftTask', entity: 'シフト業務配分' })
  return data as ShiftTask
}

export async function createShiftTasks(inputs: ShiftTaskInput[]) {
  if (inputs.length === 0) return []
  
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shift_tasks')
    .insert(inputs)
    .select()

  if (error) handleSupabaseError(error, { action: 'createShiftTasks', entity: 'シフト業務配分' })
  return data as ShiftTask[]
}

export async function updateShiftTask(id: string, input: Partial<ShiftTaskInput>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shift_tasks')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'updateShiftTask', entity: 'シフト業務配分' })
  return data as ShiftTask
}

export async function deleteShiftTask(id: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shift_tasks')
    .delete()
    .eq('id', id)

  if (error) handleSupabaseError(error, { action: 'deleteShiftTask', entity: 'シフト業務配分' })
}

export async function deleteShiftTasksByShiftId(shiftId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('shift_tasks')
    .delete()
    .eq('shift_id', shiftId)

  if (error) handleSupabaseError(error, { action: 'deleteShiftTasksByShiftId', entity: 'シフト業務配分' })
}

// シフトに業務配分を一括設定（既存を削除して新規作成）
export async function setShiftTasks(shiftId: string, tasks: Omit<ShiftTaskInput, 'shift_id'>[]) {
  const supabase = await createClient()
  
  // 既存の業務配分を削除
  const { error: deleteError } = await supabase
    .from('shift_tasks')
    .delete()
    .eq('shift_id', shiftId)
  
  if (deleteError) handleSupabaseError(deleteError, { action: 'setShiftTasks', entity: 'シフト業務配分' })
  
  // 新しい業務配分を作成
  if (tasks.length === 0) return []
  
  const inputs = tasks.map(task => ({
    shift_id: shiftId,
    task_type_id: task.task_type_id,
    hours: task.hours,
    notes: task.notes || null
  }))
  
  const { data, error } = await supabase
    .from('shift_tasks')
    .insert(inputs)
    .select()

  if (error) handleSupabaseError(error, { action: 'setShiftTasks', entity: 'シフト業務配分' })
  return data as ShiftTask[]
}
