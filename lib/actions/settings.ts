'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { handleSupabaseError } from '@/lib/errors/helpers'
import { requireAuth } from '@/lib/auth'

export interface SystemSetting {
  key: string
  value: string
  description: string | null
  category: string
  updated_at: string
}

export interface SettingsMap {
  [key: string]: string
}

/**
 * 全設定を取得
 */
export async function getSettings(): Promise<SystemSetting[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('category')
    .order('key')

  if (error) handleSupabaseError(error, { action: 'getSettings', entity: '設定' })
  return data as SystemSetting[]
}

/**
 * カテゴリ別に設定を取得
 */
export async function getSettingsByCategory(category: string): Promise<SystemSetting[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('category', category)
    .order('key')

  if (error) handleSupabaseError(error, { action: 'getSettingsByCategory', entity: '設定' })
  return data as SystemSetting[]
}

/**
 * 単一設定を取得
 */
export async function getSetting(key: string): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', key)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // レコードが見つからない場合はnullを返す
      return null
    }
    handleSupabaseError(error, { action: 'getSetting', entity: '設定' })
  }
  return data?.value ?? null
}

/**
 * 設定をMapとして取得（キー→値のオブジェクト）
 */
export async function getSettingsAsMap(): Promise<SettingsMap> {
  const settings = await getSettings()
  const map: SettingsMap = {}
  settings.forEach((s) => {
    map[s.key] = s.value
  })
  return map
}

/**
 * 単一設定を更新
 */
export async function updateSetting(key: string, value: string): Promise<SystemSetting> {
  await requireAuth()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('system_settings')
    .update({ value })
    .eq('key', key)
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'updateSetting', entity: '設定' })
  
  revalidatePath('/admin/settings')
  revalidatePath('/')
  
  return data as SystemSetting
}

/**
 * 複数設定を一括更新
 */
export async function updateSettings(settings: Record<string, string>): Promise<void> {
  await requireAuth()
  const supabase = await createClient()

  // 各設定を個別に更新（upsertで新規作成も対応）
  const promises = Object.entries(settings).map(async ([key, value]) => {
    const { error } = await supabase
      .from('system_settings')
      .update({ value })
      .eq('key', key)

    if (error) handleSupabaseError(error, { action: 'updateSettings', entity: '設定' })
  })

  await Promise.all(promises)
  
  revalidatePath('/admin/settings')
  revalidatePath('/')
}

/**
 * 設定を作成または更新（upsert）
 */
export async function upsertSetting(
  key: string,
  value: string,
  description?: string,
  category?: string
): Promise<SystemSetting> {
  await requireAuth()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('system_settings')
    .upsert({
      key,
      value,
      description: description ?? null,
      category: category ?? 'general',
    })
    .select()
    .single()

  if (error) handleSupabaseError(error, { action: 'upsertSetting', entity: '設定' })
  
  revalidatePath('/admin/settings')
  revalidatePath('/')
  
  return data as SystemSetting
}
