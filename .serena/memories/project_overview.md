# Airport Shift Dev - プロジェクト概要

## 目的
空港スタッフのシフト管理Webアプリケーション。配属箇所ごとの必要人数管理、シフト作成・確定、勤務記号管理などを提供。

## 技術スタック
- **フレームワーク**: Next.js 16 (App Router, Turbopack)
- **言語**: TypeScript
- **UI**: React 19, Tailwind CSS 3, Radix UI (shadcn/ui), Lucide Icons
- **DB**: Supabase (PostgreSQL + RLS)
- **状態管理**: Zustand
- **フォームバリデーション**: Zod
- **テスト**: Vitest (unit), Playwright (E2E)
- **パッケージマネージャ**: pnpm 10

## コードスタイル・パターン
- Server Components（データ取得）→ Client Components（インタラクション）のパターン
- Server Actions (`'use server'`) を `lib/actions/` に配置
- `requireAuth()` による認証チェック
- `handleSupabaseError()` によるエラーハンドリング
- `revalidatePath()` によるキャッシュ再検証
- コンポーネントは `components/` ディレクトリ配下にドメイン別サブディレクトリ

## 主要ディレクトリ構造
```
app/                  # Next.js App Router pages
  admin/settings/     # システム設定
  shifts/create/      # シフト作成
  staff/              # スタッフ管理
  locations/          # 配属箇所管理
  duty-codes/         # 勤務記号管理
components/           # UIコンポーネント
  admin/              # 管理画面コンポーネント
  dashboard/          # ダッシュボード（Today/Week/Month）
  shifts/             # シフト関連
  layout/             # レイアウト（サイドバー等）
  ui/                 # shadcn/ui基盤コンポーネント
lib/
  actions/            # Server Actions
  supabase/           # Supabase クライアント
  auth/               # 認証ヘルパー
  errors/             # エラーハンドリング
  validators/         # バリデーションスキーマ
supabase/migrations/  # DBマイグレーション
types/                # 型定義
```
