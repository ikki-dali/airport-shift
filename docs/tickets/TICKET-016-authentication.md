# TICKET-016: 認証機能（オプション）

## ステータス
📋 未着手

## 優先度
⭐⭐⭐ 中（オプション）

## 複雑度
Medium

## 概要
Supabase Authを使用した管理者認証

## 成果物
- [ ] `/app/login/page.tsx` - ログインページ
- [ ] `/middleware.ts` - 認証ミドルウェア
- [ ] `/lib/auth/` - 認証ヘルパー
- [ ] RLS設定

## 依存関係
- TICKET-002: データベーススキーマ構築

## 機能要件

### 認証方式
- メールアドレス + パスワード
- または Magic Link（パスワードレス）

### ログイン機能
- メールアドレス入力
- パスワード入力
- ログインボタン
- エラーメッセージ表示

### ログアウト機能
- ログアウトボタン
- セッションクリア

### セッション管理
- 自動ログイン（リフレッシュトークン）
- セッション有効期限（7日間）

### アクセス制御
- 未認証時は /login にリダイレクト
- 認証済みユーザーのみアクセス可能

## 実装例

### Supabase Auth設定

Supabaseダッシュボードで以下を設定:
1. Email Authを有効化
2. Site URLを設定
3. Redirect URLsを設定

### ログインページ
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold mb-6 text-center">
          シフト管理システム
        </h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

### middleware.ts
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 未認証でログインページ以外にアクセスしようとした場合
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 認証済みでログインページにアクセスしようとした場合
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### レイアウトでのユーザー情報表示
```typescript
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from '@/components/auth/LogoutButton'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="ja">
      <body>
        {user && (
          <header className="bg-white border-b">
            <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="text-lg font-semibold">
                シフト管理システム
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  {user.email}
                </span>
                <LogoutButton />
              </div>
            </div>
          </header>
        )}

        {children}
      </body>
    </html>
  )
}
```

### LogoutButton.tsx
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
    >
      ログアウト
    </button>
  )
}
```

### RLS設定

```sql
-- staffテーブルのRLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "認証済みユーザーは全てのスタッフを閲覧可能"
ON staff FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "認証済みユーザーはスタッフを追加可能"
ON staff FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "認証済みユーザーはスタッフを更新可能"
ON staff FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "認証済みユーザーはスタッフを削除可能"
ON staff FOR DELETE
TO authenticated
USING (true);

-- 他のテーブルも同様に設定
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE duty_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE location_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- 全てのテーブルに認証済みユーザーのみアクセス可能なポリシーを設定
-- (上記と同様のポリシーを各テーブルに適用)
```

### 初期ユーザーの作成

Supabaseダッシュボードまたはコマンドで:
```sql
-- SQL Editorで実行
INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
VALUES ('admin@example.com', crypt('password123', gen_salt('bf')), now());
```

または、アプリ内で登録フォームを作成:
```typescript
const { error } = await supabase.auth.signUp({
  email: 'admin@example.com',
  password: 'password123',
})
```

## テスト項目
- [ ] ログインができる
- [ ] ログアウトができる
- [ ] 未認証時はログインページにリダイレクトされる
- [ ] 認証済みユーザーはシステムにアクセスできる
- [ ] RLSが正しく機能する
- [ ] セッションが正しく維持される

## MVP版での割り切り
- 管理者1名のみ想定
- 権限管理なし（全員が同じ権限）
- ユーザー管理画面なし

## 完了条件
- [ ] ログイン・ログアウトが正常に動作する
- [ ] 未認証ユーザーはシステムにアクセスできない
- [ ] RLSが設定されている

## 見積もり工数
4-6時間

## 開始予定日
2025-11-27（時間があれば）

## 完了予定日
2025-11-27
