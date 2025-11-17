'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'

type Staff = Database['public']['Tables']['staff']['Row']

/**
 * トークンからスタッフ情報を取得
 */
export async function getStaffByToken(token: string): Promise<Staff | null> {
  if (!token || token.trim() === '') {
    return null
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('request_token', token)
    .single()

  if (error || !data) {
    console.error('Failed to get staff by token:', error)
    return null
  }

  return data
}

/**
 * スタッフの request_token を生成・更新
 */
export async function generateStaffToken(staffId: string): Promise<string | null> {
  const supabase = await createClient()

  // UUIDを生成
  const newToken = crypto.randomUUID()

  const { data, error } = await supabase
    .from('staff')
    .update({ request_token: newToken })
    .eq('id', staffId)
    .select('request_token')
    .single()

  if (error || !data) {
    console.error('Failed to generate staff token:', error)
    return null
  }

  return data.request_token
}

/**
 * 全スタッフのトークン情報を取得（管理者用）
 */
export async function getAllStaffTokens() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('staff')
    .select('id, employee_number, name, request_token')
    .order('employee_number')

  if (error) {
    console.error('Failed to get all staff tokens:', error)
    return []
  }

  return data
}

// getTokenUrl は lib/utils/token-url.ts に移動しました
