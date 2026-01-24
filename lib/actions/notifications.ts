'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { logger } from '@/lib/errors/logger'
import { requireAuth } from '@/lib/auth'

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
  const supabase = await createClient()

  const { data: notification, error } = await supabase
    .from('notifications')
    .insert({
      staff_id: data.staff_id,
      type: data.type,
      title: data.title,
      message: data.message,
      related_shift_id: data.related_shift_id || null,
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
