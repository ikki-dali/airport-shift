'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { ValidationError } from '@/lib/errors'
import { requireAuth } from '@/lib/auth'
import { validateData, staffCreateSchema, staffUpdateSchema } from '@/lib/validators/schemas'

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

  const staff = validateData(staffCreateSchema, {
    employee_number: formData.get('employee_number') as string,
    name: formData.get('name') as string,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    role_id: (formData.get('role_id') as string) || null,
    tags: formData.getAll('tags') as string[],
    is_active: formData.get('is_active') === 'true',
  })

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

  const staff = validateData(staffUpdateSchema, {
    name: formData.get('name') as string,
    email: (formData.get('email') as string) || null,
    phone: (formData.get('phone') as string) || null,
    role_id: (formData.get('role_id') as string) || null,
    tags: formData.getAll('tags') as string[],
    is_active: formData.get('is_active') === 'true',
  })

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

export interface BulkImportStaffRow {
  employee_number: string
  name: string
  email?: string
  phone?: string
  role_id?: string | null
  tags?: string[]
}

export interface BulkImportResult {
  successCount: number
  skipCount: number
  errors: { row: number; message: string }[]
}

export async function bulkImportStaff(
  rows: BulkImportStaffRow[],
  rowNumbers: number[]
): Promise<BulkImportResult> {
  await requireAuth()
  const supabase = await createClient()

  // 既存の社員番号を取得
  const { data: existingStaff } = await supabase
    .from('staff')
    .select('employee_number')

  const existingNumbers = new Set(
    (existingStaff || []).map((s) => s.employee_number)
  )

  const toInsert: Array<{
    employee_number: string
    name: string
    email: string | null
    phone: string | null
    role_id: string | null
    tags: string[]
    is_active: boolean
  }> = []
  const errors: { row: number; message: string }[] = []
  let skipCount = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNumber = rowNumbers[i]

    // 重複チェック
    if (existingNumbers.has(row.employee_number)) {
      skipCount++
      errors.push({ row: rowNumber, message: `社員番号「${row.employee_number}」は既に登録済みです（スキップ）` })
      continue
    }

    // バリデーション
    const result = staffCreateSchema.safeParse({
      employee_number: row.employee_number,
      name: row.name,
      email: row.email || null,
      phone: row.phone || null,
      role_id: row.role_id || null,
      tags: row.tags || [],
      is_active: true,
    })

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message).join(', ')
      errors.push({ row: rowNumber, message: messages })
      continue
    }

    toInsert.push(result.data as any)
  }

  // バッチインサート（100件ずつ）
  let successCount = 0
  const batchSize = 100

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize)
    const { error } = await supabase.from('staff').insert(batch)

    if (error) {
      // バッチ全体が失敗した場合、個別挿入を試みる
      for (let j = 0; j < batch.length; j++) {
        const { error: singleError } = await supabase.from('staff').insert(batch[j])
        if (singleError) {
          const originalIndex = i + j
          const rowNumber = rowNumbers[originalIndex] || originalIndex + 2
          errors.push({ row: rowNumber, message: singleError.message })
        } else {
          successCount++
        }
      }
    } else {
      successCount += batch.length
    }
  }

  revalidatePath('/staff')
  return { successCount, skipCount, errors }
}
