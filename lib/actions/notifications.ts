'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { logger } from '@/lib/errors/logger'
import { requireAuth } from '@/lib/auth'
import { validateData, notificationCreateSchema } from '@/lib/validators/schemas'

export interface Notification {
  id: string
  staff_id: string
  type: 'shift_created' | 'shift_updated' | 'shift_deleted' | 'shift_confirmed' | 'shift_request'
  title: string
  message: string
  related_shift_id: string | null
  is_read: boolean
  created_at: string
  updated_at: string
}

/**
 * スタッフの通知を取得
 */
export async function getNotifications(staffId?: string): Promise<Notification[]> {
  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (staffId) {
    query = query.eq('staff_id', staffId)
  }

  const { data, error } = await query

  if (error) handleSupabaseError(error, { action: 'getNotifications', entity: '通知' })

  return data as Notification[]
}

/**
 * 未読通知の数を取得
 */
export async function getUnreadCount(staffId?: string): Promise<number> {
  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('is_read', false)

  // スタッフIDが指定されている場合のみフィルタ
  if (staffId) {
    query = query.eq('staff_id', staffId)
  }

  const { count, error } = await query

  if (error) {
    logger.error('Failed to fetch unread count', { action: 'getUnreadCount' }, error)
    return 0
  }

  return count || 0
}

/**
 * 通知を作成
 */
export async function createNotification(data: {
  staff_id: string
  type: Notification['type']
  title: string
  message: string
  related_shift_id?: string
}): Promise<Notification> {
  await requireAuth()

  // バリデーション
  const validated = validateData(notificationCreateSchema, data)

  const supabase = await createClient()

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      staff_id: validated.staff_id,
      type: validated.type,
      title: validated.title,
      message: validated.message,
      related_shift_id: validated.related_shift_id || null,
    })
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'createNotification', entity: '通知' })

  revalidatePath('/notifications')
  return notification as Notification
}

/**
 * 複数のスタッフに一斉通知を作成
 */
export async function createBulkNotifications(
  staffIds: string[],
  data: {
    type: Notification['type']
    title: string
    message: string
    related_shift_id?: string
  }
): Promise<{ count: number }> {
  await requireAuth()
  const supabase = await createClient()

  const notifications = staffIds.map((staffId) => ({
    staff_id: staffId,
    type: data.type,
    title: data.title,
    message: data.message,
    related_shift_id: data.related_shift_id || null,
  }))

  const { data: result, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select()

  if (error) handleSupabaseError(error, { action: 'createBulkNotifications', entity: '通知' })

  revalidatePath('/notifications')
  return { count: result?.length || 0 }
}

/**
 * 通知を既読にする
 */
export async function markAsRead(notificationId: string): Promise<void> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) handleSupabaseError(error, { action: 'markAsRead', entity: '通知' })

  revalidatePath('/notifications')
}

/**
 * すべての通知を既読にする
 */
export async function markAllAsRead(staffId?: string): Promise<void> {
  await requireAuth()
  const supabase = await createClient()

  let query = supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('is_read', false)

  // スタッフIDが指定されている場合のみフィルタ
  if (staffId) {
    query = query.eq('staff_id', staffId)
  }

  const { error } = await query

  if (error) handleSupabaseError(error, { action: 'markAllAsRead', entity: '通知' })

  revalidatePath('/notifications')
}

/**
 * 通知を削除
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await requireAuth()
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) handleSupabaseError(error, { action: 'deleteNotification', entity: '通知' })

  revalidatePath('/notifications')
}


/**
 * 応援依頼を送信
 * - 指定された日に出勤可能なパートスタッフを探す
 * - アプリ内通知を作成
 * - Expoプッシュ通知を送信（トークンがある場合）
 */
export async function sendReinforcementRequest(data: {
  date: string
  shortage: number
}): Promise<{ success: boolean; sentCount?: number; error?: string }> {
  await requireAuth()
  const supabase = await createClient()

  try {
    // 1. 指定された日に出勤可能なパートスタッフを探す
    // - shift_requestsで「◯」または時間帯グループ（A〜G）を出しているスタッフ
    // - かつ、その日にまだシフトが入っていないスタッフ
    const { data: availableRequests, error: requestError } = await supabase
      .from('shift_requests')
      .select(`
        staff_id,
        request_type,
        staff (
          id,
          name,
          employment_type,
          expo_push_token
        )
      `)
      .eq('date', data.date)
      .in('request_type', ['◯', 'A', 'B', 'C', 'D', 'E', 'F', 'G'])

    if (requestError) {
      logger.error('Failed to fetch available requests', { action: 'sendReinforcementRequest' }, requestError)
      return { success: false, error: '出勤可能なスタッフの取得に失敗しました' }
    }

    // 2. その日に既にシフトが入っているスタッフを除外
    const { data: existingShifts, error: shiftError } = await supabase
      .from('shifts')
      .select('staff_id')
      .eq('date', data.date)

    if (shiftError) {
      logger.error('Failed to fetch existing shifts', { action: 'sendReinforcementRequest' }, shiftError)
      return { success: false, error: 'シフト情報の取得に失敗しました' }
    }

    const assignedStaffIds = new Set(existingShifts?.map(s => s.staff_id) || [])

    // パートスタッフかつまだシフトが入っていないスタッフをフィルタ
    const targetStaff = availableRequests
      ?.filter(req => 
        req.staff && 
        (req.staff as any).employment_type === 'part_time' &&
        !assignedStaffIds.has(req.staff_id)
      )
      .map(req => req.staff as { id: string; name: string; expo_push_token?: string })
      .filter((staff, index, self) => 
        // 重複を除去
        index === self.findIndex(s => s.id === staff.id)
      ) || []

    if (targetStaff.length === 0) {
      return { success: false, error: '出勤可能なパートスタッフがいません' }
    }

    // 3. アプリ内通知を作成
    const dateFormatted = data.date.replace(/-/g, '/')
    const notifications = targetStaff.map(staff => ({
      staff_id: staff.id,
      type: 'shift_request' as const,
      title: '応援依頼',
      message: `${dateFormatted}に${data.shortage}人不足しています。出勤できる方はいませんか？`,
      related_shift_id: null,
    }))

    const { error: notifyError } = await supabase
      .from('notifications')
      .insert(notifications)

    if (notifyError) {
      logger.error('Failed to create notifications', { action: 'sendReinforcementRequest' }, notifyError)
      return { success: false, error: '通知の作成に失敗しました' }
    }

    // 4. Expoプッシュ通知を送信（トークンがあるスタッフのみ）
    const staffWithTokens = targetStaff.filter(s => s.expo_push_token)
    if (staffWithTokens.length > 0) {
      await sendExpoPushNotifications(
        staffWithTokens.map(s => s.expo_push_token!),
        {
          title: '応援依頼',
          body: `${dateFormatted}に${data.shortage}人不足しています。出勤できる方はいませんか？`,
          data: { type: 'reinforcement_request', date: data.date },
        }
      )
    }

    revalidatePath('/notifications')
    return { success: true, sentCount: targetStaff.length }
  } catch (error) {
    logger.error('Failed to send reinforcement request', { action: 'sendReinforcementRequest' }, error as Error)
    return { success: false, error: '応援依頼の送信に失敗しました' }
  }
}

/**
 * Expo Push Notificationを送信
 */
async function sendExpoPushNotifications(
  tokens: string[],
  message: {
    title: string
    body: string
    data?: Record<string, any>
  }
): Promise<void> {
  if (tokens.length === 0) return

  try {
    const messages = tokens.map(token => ({
      to: token,
      sound: 'default',
      title: message.title,
      body: message.body,
      data: message.data || {},
    }))

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logger.error('Expo push notification failed', { action: 'sendExpoPushNotifications', status: response.status, error: errorText })
    }
  } catch (error) {
    logger.error('Failed to send Expo push notifications', { action: 'sendExpoPushNotifications' }, error as Error)
  }
}
