# TICKET-003: データ整合性強化（トランザクション・ロック）

## 担当
Backend

## 背景
- confirmShifts関数で複数の更新処理が別々に実行、途中エラーで不整合
- 楽観的ロックなし → 同時編集で最後の更新が勝つ（Last Write Wins）
- 型定義が手動管理、スキーマ変更時の同期保証なし

## 要件

### 1. トランザクション処理実装
- `confirmShifts`関数をSupabaseのトランザクション（RPC関数）でラップ
- 途中エラー時は全体ロールバック
- 対象: シフト確定 + メール送信判定を分離

### 2. 楽観的ロック実装
- shiftsテーブルに`version`カラム追加（integer, default 1）
- 更新時にversion一致チェック、不一致なら競合エラー
- フロントエンドに「他のユーザーが更新しました」通知

### 3. DB制約追加
- location_requirementsに複合UNIQUE制約追加
  - `(location_id, duty_code_id, date)`
- shifts.created_by/updated_byに外部キー制約（認証実装後に有効化）

### 4. 型自動生成に移行
- `npx supabase gen types typescript`で型生成
- 手動の`types/database.ts`を自動生成に置換
- package.jsonにgen:typesスクリプト追加

## 完了条件
- [ ] confirmShiftsがトランザクション処理になっている
- [ ] shiftsテーブルにversionカラム追加済み
- [ ] 楽観的ロックが動作する
- [ ] location_requirementsに複合UNIQUE制約追加済み
- [ ] Supabase型が自動生成に移行済み
- [ ] マイグレーションファイル作成済み
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
