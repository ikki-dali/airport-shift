import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

/**
 * 認証不要のパス
 * - /login: ログインページ
 * - /shift-request/: トークンベースのスタッフ確認ページ
 * - /api/health: ヘルスチェック
 */
const PUBLIC_PATHS = ['/login', '/shift-request/', '/api/health']

/**
 * 静的ファイル等（matcherで除外しきれないもの）
 */
const STATIC_PREFIXES = ['/_next/', '/favicon.ico', '/icons/', '/manifest', '/logo.svg', '/logo-white.svg', '/ana-logo.png', '/icon.svg', '/icon.png']

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname.startsWith(path))
}

function isStaticPath(pathname: string): boolean {
  return STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 静的ファイルはスキップ
  if (isStaticPath(pathname)) {
    return NextResponse.next()
  }

  // 認証不要ページはセッション更新のみ（リダイレクトしない）
  if (isPublicPath(pathname)) {
    const { supabaseResponse } = await updateSession(request)
    return supabaseResponse
  }

  // セッション更新 + ユーザー確認
  const { user, supabaseResponse } = await updateSession(request)

  // 未認証の場合、ログインページにリダイレクト
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // リダイレクト先にもとのURLを保持（ログイン後に戻るため）
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - icons/ (PWA icons)
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|logo\\.svg|logo-white\\.svg|ana-logo\\.png|icon\\.svg|icon\\.png).*)',
  ],
}
