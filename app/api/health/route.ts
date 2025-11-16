import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 環境変数チェック
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓' : '✗',
    }

    // データベース接続チェック
    const { data, error } = await supabase.from('staff').select('count').limit(1)

    return Response.json({
      status: 'ok',
      envCheck,
      dbConnection: error ? `Error: ${error.message}` : '✓ Connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return Response.json({
      status: 'error',
      error: error.message,
      stack: error.stack,
    }, { status: 500 })
  }
}
