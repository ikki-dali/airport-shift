'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit, loginRateLimiter } from '@/lib/rate-limit'

export async function login(formData: FormData) {
  // レート制限: 同一IPから5回/分
  try {
    await checkRateLimit(loginRateLimiter)
  } catch {
    return { error: 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。' }
  }

  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'メールアドレスとパスワードを入力してください' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  // ログイン成功: redirectToがあればそこへ、なければホームへ
  const redirectTo = formData.get('redirectTo') as string
  redirect(redirectTo || '/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
