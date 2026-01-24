import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * Service Roleクライアント（RLSバイパス）
 * トークンベースのスタッフ確認ページ等、
 * 認証なしでデータアクセスが必要な操作に使用する。
 *
 * 注意: このクライアントはRLSを完全にバイパスするため、
 * Server-only（Server Actions / API Routes）でのみ使用すること。
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for service client. ' +
      'Check your environment variables.'
    )
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
