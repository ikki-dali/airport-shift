# コードスタイル・規約

## 全般
- TypeScript strict
- セミコロンなし（Prettierデフォルト）
- シングルクォート
- 末尾カンマあり

## ファイル命名
- コンポーネント: PascalCase (例: SettingsForm.tsx)
- Server Actions: camelCase (例: settings.ts)
- マイグレーション: YYYYMMDD_description.sql

## Server Actions パターン
```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/auth'

export async function actionName() {
  await requireAuth()  // 書き込み操作の場合
  const supabase = await createClient()
  // ...
  revalidatePath('/path')
}
```

## コンポーネントパターン
- Server Component (デフォルト): データ取得してクライアントコンポーネントに渡す
- Client Component ('use client'): インタラクション、状態管理

## インポートパス
- `@/` エイリアスでプロジェクトルートから参照

## UI
- shadcn/ui + Tailwind CSS
- トースト通知: sonner
- アイコン: lucide-react
