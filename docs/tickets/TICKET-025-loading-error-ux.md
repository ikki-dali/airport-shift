# TICKET-025: Loading/Error UX改善

## 担当
Frontend

## 背景
- 現在、ページ遷移時にローディング表示がない（白画面）
- エラー発生時の表示が不統一（一部はconsole.logのみ）
- 本番ユーザーに対して適切なフィードバックが必要

## 要件

### 1. loading.tsx追加（各ルートグループ）
- app/(authenticated)/loading.tsx: メインレイアウト用のスケルトンUI
- 最低限: スピナー or プログレスバー付きのローディング画面
- shadcn/uiのSkeletonコンポーネント活用

### 2. error.tsx追加（各ルートグループ）
- app/(authenticated)/error.tsx: エラーバウンダリ
- 「エラーが発生しました」+ リトライボタン + ホームへ戻るリンク
- エラー詳細はconsole.errorに出力（ユーザーには見せない）

### 3. not-found.tsx改善
- app/not-found.tsx: 404ページ
- 「ページが見つかりません」+ ホームへ戻るリンク
- デザインはshadcn/uiのCard使用

### 4. トースト通知の統一
- 成功/失敗時のフィードバックをtoast（shadcn/ui）で統一
- 既存のalert()呼び出しがあれば置き換え

## 注意事項
- loading.tsxはServer Components内のSuspense境界として機能する
- error.tsxは'use client'が必須
- 過度なアニメーションは避ける（業務アプリなのでシンプルに）

## 完了条件
- [ ] loading.tsx、error.tsx、not-found.tsxが存在する
- [ ] ページ遷移時にローディング表示される
- [ ] エラー時にユーザーフレンドリーな画面が表示される
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
