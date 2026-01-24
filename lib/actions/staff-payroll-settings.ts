'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getLimitAmount, type LimitType } from '@/lib/payroll/calculator'
import { handleSupabaseError } from '@/lib/errors/helpers'

export interface StaffPayrollSetting {
  id: string
  staff_id: string
  target_limit: number
  limit_type: LimitType
  custom_note: string | null
  warning_threshold_percent: number
  caution_threshold_percent: number
  created_at: string
  updated_at: string
}

/**
 * スタッフの給与設定を取得
 */
export async function getStaffPayrollSetting(staffId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff_payroll_settings')
    .select('*')
    .eq('staff_id', staffId)
    .maybeSingle()

  if (error) handleSupabaseError(error, { action: 'getStaffPayrollSetting', entity: '給与設定' })
  return data as StaffPayrollSetting | null
}

/**
 * 全スタッフの給与設定を取得
 */
export async function getAllStaffPayrollSettings() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff_payroll_settings')
    .select(`
      *,
      staff:staff_id (
        id,
        employee_number,
        name
      )
    `)
    .order('created_at', { ascending: false })

  if (error) handleSupabaseError(error, { action: 'getAllStaffPayrollSettings', entity: '給与設定' })
  return data
}

/**
 * スタッフの給与設定を作成・更新
 */
export async function upsertStaffPayrollSetting(input: {
  staffId: string
  limitType: LimitType
  customAmount?: number
  customNote?: string
  warningThresholdPercent?: number
  cautionThresholdPercent?: number
}) {
  const supabase = await createClient()

  const targetLimit = getLimitAmount(input.limitType, input.customAmount)

  const { data, error } = await supabase
    .from('staff_payroll_settings')
    .upsert(
      {
        staff_id: input.staffId,
        target_limit: targetLimit,
        limit_type: input.limitType,
        custom_note: input.customNote || null,
        warning_threshold_percent: input.warningThresholdPercent || 85,
        caution_threshold_percent: input.cautionThresholdPercent || 75,
      },
      {
        onConflict: 'staff_id',
      }
    )
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'upsertStaffPayrollSetting', entity: '給与設定' })

  revalidatePath('/staff')
  revalidatePath('/payroll')
  return data as StaffPayrollSetting
}

/**
 * スタッフの給与設定を削除（デフォルトに戻す）
 */
export async function deleteStaffPayrollSetting(staffId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('staff_payroll_settings')
    .delete()
    .eq('staff_id', staffId)

  if (error) handleSupabaseError(error, { action: 'deleteStaffPayrollSetting', entity: '給与設定' })

  revalidatePath('/staff')
  revalidatePath('/payroll')
}

/**
 * 一括でデフォルト設定を作成（103万円の壁）
 */
export async function createDefaultSettingsForAllStaff() {
  const supabase = await createClient()

  // 全スタッフを取得
  const { data: allStaff, error: staffError } = await supabase
    .from('staff')
    .select('id')
    .eq('is_active', true)

  if (staffError) handleSupabaseError(staffError, { action: 'createDefaultSettingsForAllStaff', entity: 'スタッフ' })

  // 既存の設定があるスタッフを除外
  const { data: existingSettings, error: settingsError } = await supabase
    .from('staff_payroll_settings')
    .select('staff_id')

  if (settingsError) handleSupabaseError(settingsError, { action: 'createDefaultSettingsForAllStaff', entity: '給与設定' })

  const existingStaffIds = new Set(existingSettings!.map((s) => s.staff_id))
  const newStaff = allStaff!.filter((s) => !existingStaffIds.has(s.id))

  // デフォルト設定を作成
  const defaultSettings = newStaff.map((staff) => ({
    staff_id: staff.id,
    target_limit: 1030000, // 103万円
    limit_type: 'tax_dependent_103' as LimitType,
    warning_threshold_percent: 85,
    caution_threshold_percent: 75,
  }))

  if (defaultSettings.length > 0) {
    const { error: insertError } = await supabase
      .from('staff_payroll_settings')
      .insert(defaultSettings)

    if (insertError) handleSupabaseError(insertError, { action: 'createDefaultSettingsForAllStaff', entity: '給与設定' })
  }

  revalidatePath('/staff')
  revalidatePath('/payroll')

  return { created: defaultSettings.length }
}
