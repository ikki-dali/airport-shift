'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { ValidationError } from '@/lib/errors'
import { requireAuth } from '@/lib/auth'

export type Staff = Database['public']['Tables']['staff']['Row']
export type StaffWithRole = Staff & {
  roles: {
    id: string
    name: string
    is_responsible: boolean
  } | null
}

export async function getStaff(filters?: {
  search?: string
  roleId?: string
  tags?: string[]
  isActive?: boolean
}) {
  const supabase = await createClient()

  let query = supabase
    .from('staff')
    .select(`
      *,
      roles (
        id,
        name,
        is_responsible,
        priority
      )
    `)
    .order('employee_number', { ascending: true })

  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,employee_number.ilike.%${filters.search}%`)
  }

  if (filters?.roleId) {
    query = query.eq('role_id', filters.roleId)
  }

  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive)
  }

  // タグフィルタは配列の重複チェックが必要
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags)
  }

  const { data, error } = await query

  if (error) handleSupabaseError(error, { action: 'getStaff', entity: 'スタッフ' })
  return data as StaffWithRole[]
}

export async function getStaffById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff')
    .select(`
      *,
      roles (
        id,
        name,
        is_responsible,
        priority
      )
    `)
    .eq('id', id)
    .single()

  if (error) handleSupabaseError(error, { action: 'getStaffById', entity: 'スタッフ' })
  return data as StaffWithRole
}

export async function createStaff(formData: FormData) {
  await requireAuth()
  const supabase = await createClient()

  const tags = formData.getAll('tags') as string[]

  const staff = {
    employee_number: formData.get('employee_number') as string,
    name: formData.get('name') as string,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    role_id: (formData.get('role_id') as string) || null,
    tags: tags.length > 0 ? tags : [],
    is_active: formData.get('is_active') === 'true',
  }

  const { data, error } = await supabase
    .from('staff')
    .insert(staff)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new ValidationError('この社員番号は既に使用されています')
    }
    handleSupabaseError(error, { action: 'createStaff', entity: 'スタッフ' })
  }

  revalidatePath('/staff')
  return data as Staff
}

export async function updateStaff(id: string, formData: FormData) {
  await requireAuth()
  const supabase = await createClient()

  const tags = formData.getAll('tags') as string[]

  const staff = {
    name: formData.get('name') as string,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    role_id: (formData.get('role_id') as string) || null,
    tags: tags.length > 0 ? tags : [],
    is_active: formData.get('is_active') === 'true',
  }

  const { data, error } = await supabase
    .from('staff')
    .update(staff)
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'updateStaff', entity: 'スタッフ' })

  revalidatePath('/staff')
  revalidatePath(`/staff/${id}`)
  return data as Staff
}

export async function deleteStaff(id: string) {
  await requireAuth()
  const supabase = await createClient()

  // スタッフが使用中かチェック（シフト割り当てなど）
  const { count } = await supabase
    .from('shifts')
    .select('id', { count: 'exact', head: true })
    .eq('staff_id', id)

  if (count && count > 0) {
    throw new ValidationError('このスタッフはシフトに割り当てられているため削除できません')
  }

  const { error } = await supabase.from('staff').delete().eq('id', id)

  if (error) handleSupabaseError(error, { action: 'deleteStaff', entity: 'スタッフ' })

  revalidatePath('/staff')
}

export async function toggleStaffActive(id: string, isActive: boolean) {
  await requireAuth()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'toggleStaffActive', entity: 'スタッフ' })

  revalidatePath('/staff')
  revalidatePath(`/staff/${id}`)
  return data as Staff
}
