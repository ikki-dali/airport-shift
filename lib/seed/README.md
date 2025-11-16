# シードデータ投入ガイド

## 概要
このディレクトリには、開発・テスト環境でデータベースにサンプルデータを投入するためのスクリプトが含まれています。

## 投入されるデータ

### 1. マスタデータ
- **役職**: 4件（一般社員、サブリーダー、リーダー、管理者）
- **タグ**: 5件（保安検査、バス案内、横特、OSS、番台）
- **勤務記号**: 28件（DEFAULT_DUTY_CODESから）
- **配属箇所**: 5件（T3中央、T3北、T2中央、バス案内、横特）

### 2. スタッフデータ
- **スタッフ**: 15名（社員番号0001-0015）
- **スタッフタグ**: 各スタッフに適切なタグを関連付け

### 3. 配属箇所要件
- 6件の要件（各配属箇所と勤務記号の組み合わせ）
- 必要人数、責任者数、必要タグを設定
- 曜日別の要件も含む（月曜日の特別要件など）

### 4. シフト希望
- 2025年12月分の希望データ（約100件）
- 各スタッフがランダムに5-10日の希望を提出
- 希望タイプ: ◯、休、早朝、早番、遅番、夜勤

## 使用方法

### 方法1: Web UIから実行（推奨）

1. 開発サーバーを起動
```bash
npm run dev
```

2. ブラウザで以下にアクセス
```
http://localhost:3000/admin/seed
```

3. オプションを選択
- **既存データをクリア**: チェックすると、投入前に既存データを全て削除します
  - ⚠️ 注意: このオプションは復元不可能です

4. 「シードデータを投入」ボタンをクリック

5. 投入完了メッセージを確認

### 方法2: APIエンドポイント経由

```bash
# 既存データを保持して追加投入
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"clearExisting": false}'

# 既存データをクリアして投入
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"clearExisting": true}'
```

### 方法3: スクリプトから直接実行

```typescript
import { seedDatabase } from '@/lib/seed/seed-data'

// オプション1: 既存データを保持
await seedDatabase()

// オプション2: 既存データをクリア
await seedDatabase({ clearExisting: true })
```

## 投入後の確認

### 1. マスタデータの確認
```
http://localhost:3000/roles       # 役職
http://localhost:3000/tags        # タグ
http://localhost:3000/duty-codes  # 勤務記号
http://localhost:3000/staff       # スタッフ
http://localhost:3000/locations   # 配属箇所
```

### 2. 希望データの確認
```
http://localhost:3000/requests/2025-12
```

### 3. シフト作成の確認
```
http://localhost:3000/shifts/create?yearMonth=2025-12&date=2025-12-01
```

## 注意事項

### ⚠️ 使用上の警告
1. **本番環境では絶対に使用しないでください**
2. 「既存データをクリア」オプションは、全てのデータを削除します（復元不可）
3. 開発・テスト環境でのみ使用してください

### 推奨される使用タイミング
- 初回セットアップ時
- 開発環境のリセット時
- 新機能のテスト前
- デモ・プレゼンテーション前

### データの削除方法

全てのシードデータを削除する場合は、Supabase SQL Editorで以下を実行:

```sql
-- シフトと希望を削除
TRUNCATE TABLE shifts CASCADE;
TRUNCATE TABLE shift_requests CASCADE;

-- 関連データを削除
TRUNCATE TABLE location_requirements CASCADE;
TRUNCATE TABLE staff_tags CASCADE;

-- マスタデータを削除
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE locations CASCADE;
TRUNCATE TABLE duty_codes CASCADE;
TRUNCATE TABLE tags CASCADE;
TRUNCATE TABLE roles CASCADE;
```

## カスタマイズ

### スタッフデータのカスタマイズ
`lib/seed/seed-data.ts` の `staffSamples` 配列を編集してください。

```typescript
const staffSamples = [
  { 
    employee_number: '0001', 
    name: '山田太郎', 
    email: 'yamada@example.com', 
    role: 'リーダー', 
    tags: ['保安検査', 'バス案内'] 
  },
  // 追加のスタッフ...
]
```

### 配属箇所要件のカスタマイズ
`locationRequirements` 配列を編集してください。

```typescript
{
  location_id: locationMap.get('T3C'),
  duty_code_id: dutyCodeMap.get('06G5DA'),
  required_staff_count: 5,      // 必要人数
  required_responsible_count: 1, // 必要責任者数
  required_tags: ['保安検査'],   // 必要タグ
  day_of_week: null,             // 曜日指定（null=全日）
}
```

### シフト希望のカスタマイズ
年月を変更する場合は、`year` と `month` 変数を編集してください。

```typescript
const year = 2025
const month = 12  // 1-12
```

## トラブルシューティング

### エラー: "duplicate key value violates unique constraint"
- 原因: 同じデータが既に存在する
- 解決策: 「既存データをクリア」オプションを有効にして再実行

### エラー: "foreign key constraint violation"
- 原因: 関連データの投入順序が間違っている
- 解決策: スクリプトを確認し、正しい順序で投入されているか確認

### データが表示されない
- 原因: RLS（Row Level Security）ポリシーの問題
- 解決策: Supabaseの認証状態を確認

## 開発時のTips

### シードデータの定期的なリセット
開発中、データが乱雑になった場合は定期的にリセットすることをお勧めします。

```bash
# クリーンな状態に戻す
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{"clearExisting": true}'
```

### テストデータの追加
新しいテストケースに必要なデータがある場合は、`seed-data.ts` を拡張してください。

## 関連ドキュメント
- [テストシナリオドキュメント](../../docs/test-scenarios.md)
- [TICKET-017: 初期データ投入・テスト](../../docs/tickets/TICKET-017-seed-data-test.md)
