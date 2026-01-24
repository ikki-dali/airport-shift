'use server'

import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/errors/logger'

/**
 * トークンでスタッフ情報を取得
 */
export async function getStaffByToken(token: string) {
  const supabase = await createClient()

  const { data: staff, error } = await supabase
    .from('staff')
    .select('id, employee_number, name, email, role_id, roles(name)')
    .eq('request_token', token)
    .single()

  if (error || !staff) {
    return null
  }

  return staff
}

/**
 * トークンでスタッフのシフトを取得（確定のみ）
 */
export async function getStaffShiftsByToken(token: string) {
  const staff = await getStaffByToken(token)

  if (!staff) {
    return null
  }

  const supabase = await createClient()

  const { data: shifts, error } = await supabase
    .from('shifts')
    .select(`
      *,
      location:location_id (
        id,
        location_name,
        code
      ),
      duty_code:duty_code_id (
        id,
        code,
        start_time,
        end_time,
        category
      )
    `)
    .eq('staff_id', staff.id)
    .eq('status', '確定')
    .order('date', { ascending: true })

  if (error) {
    logger.error('Error fetching staff shifts', { action: 'getStaffShiftsByToken' }, error)
    return null
  }

  return {
    staff,
    shifts,
  }
}
