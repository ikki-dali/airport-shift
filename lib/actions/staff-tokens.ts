'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { sendShiftRequestInvitation } from '@/lib/email/send-shift-request-invitation'

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

/**
 * スタッフにシフト希望提出リンクをメール送信
 */
export async function sendShiftRequestEmail(staffId: string, deadline?: string) {
  const supabase = await createClient()

  // スタッフ情報を取得
  const { data, error: staffError } = await supabase
    .from('staff')
    .select('id, name, email, request_token')
    .eq('id', staffId)
    .single()

  if (staffError || !data) {
    console.error('Failed to get staff:', staffError)
    return { success: false, error: 'スタッフ情報の取得に失敗しました' }
  }

  const staff = data as { id: string; name: string; email: string | null; request_token: string | null }

  if (!staff.email) {
    return { success: false, error: 'メールアドレスが登録されていません' }
  }

  // トークンがない場合は生成
  let token = staff.request_token
  if (!token) {
    token = await generateStaffToken(staffId)
    if (!token) {
      return { success: false, error: 'トークンの生成に失敗しました' }
    }
  }

  // メール送信
  const result = await sendShiftRequestInvitation({
    to: staff.email,
    staffName: staff.name,
    token,
    deadline,
  })

  return result
}

/**
 * 複数のスタッフにシフト希望提出リンクを一括メール送信（順次処理）
 */
export async function sendBulkShiftRequestEmails(staffIds: string[], deadline?: string) {
  const results = []

  // レート制限を避けるため、順次処理
  for (const staffId of staffIds) {
    const result = await sendShiftRequestEmail(staffId, deadline)
    results.push({ staffId, ...result })

    // 各メール送信後に少し待機（レート制限対策）
    if (results.length < staffIds.length) {
      await new Promise(resolve => setTimeout(resolve, 600)) // 0.6秒待機
    }
  }

  const successCount = results.filter((r) => r.success).length
  const failCount = results.filter((r) => !r.success).length

  return {
    success: failCount === 0,
    successCount,
    failCount,
    results,
  }
}

// getTokenUrl は lib/utils/token-url.ts に移動しました
