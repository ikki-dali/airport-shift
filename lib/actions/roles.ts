'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { ValidationError } from '@/lib/errors'

type Role = Database['public']['Tables']['roles']['Row']
type RoleInsert = Database['public']['Tables']['roles']['Insert']
type RoleUpdate = Database['public']['Tables']['roles']['Update']

/**
 * 全ての役職を取得
 */
export async function getRoles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('priority', { ascending: false })

  if (error) handleSupabaseError(error, { action: 'getRoles', entity: '役職' })
  return data as Role[]
}

/**
 * 役職を1件取得
 */
export async function getRole(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .eq('id', id)
    .single()

  if (error) handleSupabaseError(error, { action: 'getRole', entity: '役職' })
  return data as Role
}

/**
 * 役職を作成
 */
export async function createRole(formData: FormData) {
  const supabase = await createClient()

  const role: RoleInsert = {
    name: formData.get('name') as string,
    is_responsible: formData.get('is_responsible') === 'on',
    priority: parseInt(formData.get('priority') as string) || 0,
  }

  const { data, error } = await supabase
    .from('roles')
    .insert(role)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'createRole', entity: '役職' })

  revalidatePath('/roles')
  return data as Role
}

/**
 * 役職を更新
 */
export async function updateRole(id: string, formData: FormData) {
  const supabase = await createClient()

  const role: RoleUpdate = {
    name: formData.get('name') as string,
    is_responsible: formData.get('is_responsible') === 'on',
    priority: parseInt(formData.get('priority') as string) || 0,
  }

  const { data, error } = await supabase
    .from('roles')
    .update(role)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'updateRole', entity: '役職' })

  revalidatePath('/roles')
  return data as Role
}

/**
 * 役職を削除
 */
export async function deleteRole(id: string) {
  const supabase = await createClient()

  // 使用中かチェック
  const { count } = await supabase
    .from('staff')
    .select('id', { count: 'exact', head: true })
    .eq('role_id', id)

  if (count && count > 0) {
    throw new ValidationError('この役職は使用中のため削除できません')
  }

  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id)

  if (error) handleSupabaseError(error, { action: 'deleteRole', entity: '役職' })

  revalidatePath('/roles')
}
