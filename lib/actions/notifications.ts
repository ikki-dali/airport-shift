'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

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

  if (error) {
    console.error('Error fetching notifications:', error)
    throw new Error(`通知取得エラー: ${error.message}`)
  }

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
    console.error('Error fetching unread count:', error)
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

  if (error) {
    console.error('Error creating notification:', error)
    throw new Error(`通知作成エラー: ${error.message}`)
  }

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

  if (error) {
    console.error('Error creating bulk notifications:', error)
    throw new Error(`一斉通知作成エラー: ${error.message}`)
  }

  revalidatePath('/notifications')
  return { count: result?.length || 0 }
}

/**
 * 通知を既読にする
 */
export async function markAsRead(notificationId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)

  if (error) {
    console.error('Error marking notification as read:', error)
    throw new Error(`通知既読エラー: ${error.message}`)
  }

  revalidatePath('/notifications')
}

/**
 * すべての通知を既読にする
 */
export async function markAllAsRead(staffId?: string): Promise<void> {
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

  if (error) {
    console.error('Error marking all notifications as read:', error)
    throw new Error(`全通知既読エラー: ${error.message}`)
  }

  revalidatePath('/notifications')
}

/**
 * 通知を削除
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId)

  if (error) {
    console.error('Error deleting notification:', error)
    throw new Error(`通知削除エラー: ${error.message}`)
  }

  revalidatePath('/notifications')
}
