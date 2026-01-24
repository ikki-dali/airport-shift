'use server'

import { createClient } from '@/lib/supabase/server'
import { AuthError } from '@/lib/errors'
import type { User } from '@supabase/supabase-js'

/**
 * 現在の認証ユーザーを取得する
 * 未認証の場合はnullを返す
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

/**
 * 認証を要求する
 * 未認証の場合はAuthErrorをスローする
 * Server Actionsの書き込み操作の冒頭で使用する
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthError('認証が必要です。ログインしてください。')
  }
  return user
}
