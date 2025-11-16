# TICKET-003: マスタ管理機能 - 役職・タグ管理

## ステータス
📋 未着手

## 優先度
⭐⭐⭐⭐ 高

## 複雑度
Simple

## 概要
役職とタグのCRUD機能実装

## 成果物
- [x] `/app/roles/page.tsx` - 役職一覧ページ
- [x] `/app/roles/new/page.tsx` - 役職追加ページ
- [x] `/app/roles/[id]/edit/page.tsx` - 役職編集ページ
- [x] `/app/tags/page.tsx` - タグ一覧ページ
- [x] `/app/tags/new/page.tsx` - タグ追加ページ
- [x] `/app/tags/[id]/edit/page.tsx` - タグ編集ページ
- [x] `/lib/actions/roles.ts` - 役職のServer Actions
- [x] `/lib/actions/tags.ts` - タグのServer Actions
- [x] `/components/roles/` - 役職関連コンポーネント
- [x] `/components/tags/` - タグ関連コンポーネント

## 依存関係
- TICKET-002: データベーススキーマ構築

## 機能要件

### 役職管理
- 役職一覧表示
  - 役職名
  - 責任者フラグ
  - 優先度
  - 作成日
- 役職追加
  - 役職名入力
  - 責任者になれるか（チェックボックス）
  - 優先度（数値）
- 役職編集
  - 既存データの編集
- 役職削除
  - 確認ダイアログ表示
  - 使用中の役職は削除不可（警告表示）

### タグ管理
- タグ一覧表示
  - タグ名
  - 説明
  - 作成日
- タグ追加
  - タグ名入力（重複チェック）
  - 説明入力（任意）
- タグ編集
  - 既存データの編集
- タグ削除
  - 確認ダイアログ表示
  - 使用中のタグは削除不可（警告表示）

## UI設計
- シンプルなテーブル形式
- アクションボタン（編集、削除）
- モーダルまたは別ページで追加・編集
- TailwindCSSでスタイリング

## バリデーション
- 役職名: 必須、1-50文字
- タグ名: 必須、1-30文字、重複不可
- 優先度: 0-100の数値

## Server Actions実装例

### roles.ts
```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getRoles() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('priority', { ascending: false })

  if (error) throw error
  return data
}

export async function createRole(formData: FormData) {
  const supabase = await createClient()

  const role = {
    name: formData.get('name') as string,
    is_responsible: formData.get('is_responsible') === 'on',
    priority: parseInt(formData.get('priority') as string),
  }

  const { error } = await supabase.from('roles').insert(role)

  if (error) throw error

  revalidatePath('/roles')
}

// updateRole, deleteRole も同様に実装
```

## テスト項目
- [ ] 役職一覧が正しく表示される
- [ ] 役職の追加ができる
- [ ] 役職の編集ができる
- [ ] 役職の削除ができる
- [ ] 使用中の役職は削除できない
- [ ] タグ一覧が正しく表示される
- [ ] タグの追加ができる（重複チェック）
- [ ] タグの編集ができる
- [ ] タグの削除ができる
- [ ] バリデーションが機能する

## 並行開発可能
✅ TICKET-004（勤務記号管理）と並行開発可能

## 完了条件
- [ ] 役職のCRUD機能が全て動作する
- [ ] タグのCRUD機能が全て動作する
- [ ] バリデーションが正しく機能する
- [ ] エラーハンドリングが適切

## 見積もり工数
4-6時間

## 開始予定日
2025-11-15

## 完了予定日
2025-11-16
