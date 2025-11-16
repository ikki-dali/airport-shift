# Supabase Database Migrations

このディレクトリには、シフト管理システムのデータベーススキーマとマイグレーションファイルが含まれています。

## 📁 ディレクトリ構造

```
supabase/
├── README.md
└── migrations/
    ├── 20251115000001_initial_schema.sql      # 初期スキーマ
    └── 20251115000002_seed_initial_data.sql   # 初期データ投入
```

## 🗄️ データベーススキーマ

### テーブル一覧

1. **roles** - 役職マスタ
2. **tags** - タグマスタ（技能・資格）
3. **staff** - スタッフ情報
4. **duty_codes** - 勤務記号マスタ（28種類）
5. **locations** - 配属箇所マスタ
6. **location_requirements** - 配属箇所要件
7. **shift_requests** - 希望提出
8. **shifts** - シフト

### ER図（簡略版）

```
roles ────┐
          ↓
        staff ────┐
                  ↓
            shift_requests

duty_codes ─────┬─────┐
                ↓     ↓
locations ←─ location_requirements
    ↓
  shifts ←─ staff
    ↑
duty_codes
```

## 🚀 マイグレーション実行方法

### オプション1: Supabase CLI（推奨）

```bash
# Supabase CLIのインストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトのリンク
supabase link --project-ref your-project-ref

# マイグレーション実行
supabase db push

# ステータス確認
supabase db status
```

### オプション2: Supabase Dashboard

1. https://supabase.com/dashboard にアクセス
2. プロジェクトを選択
3. **SQL Editor** を開く
4. マイグレーションファイルの内容をコピー&ペースト
5. **Run** をクリック

### オプション3: psql（ローカル開発）

```bash
# Supabaseローカル環境を起動
supabase start

# マイグレーション実行
supabase db reset
```

## 📊 初期データ

### 役職マスタ（4件）
- 一般社員
- サブリーダー（責任者）
- リーダー（責任者）
- 管理者（責任者）

### タグマスタ（5件）
- 保安検査
- バス案内
- 横特
- OSS
- 番台

### 勤務記号マスタ（28種類）
- T3中央: 12種類
- T3北: 3種類
- T2中央: 5種類
- バス案内: 10種類
- 横特: 1種類

### 配属箇所マスタ（5件）
- T3中央（T3C）
- T3北（T3N）
- T2中央（T2C）
- バス案内（BUS）
- 東方航空バゲージ（TOU）

## 🔐 Row Level Security (RLS)

全てのテーブルでRLSが有効化されており、認証済みユーザーのみがアクセス可能です。

```sql
-- 例: staffテーブルのポリシー
CREATE POLICY "認証済みユーザーはstaff閲覧可能"
ON staff FOR SELECT
TO authenticated
USING (true);
```

MVP版では全ての認証済みユーザーに同じ権限を付与していますが、将来的には役割ベースのアクセス制御（RBAC）に拡張可能です。

## 🔄 自動更新トリガー

以下のテーブルでは`updated_at`カラムが自動更新されます:

- staff
- duty_codes
- locations
- shift_requests
- shifts

```sql
CREATE TRIGGER update_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 📝 TypeScript型生成

Supabaseスキーマから TypeScript型を生成:

```bash
# 型生成
npx supabase gen types typescript --project-id your-project-id > types/database.ts

# または
supabase gen types typescript --linked > types/database.ts
```

スキーマ変更後は必ず型を再生成してください。

## 🧪 テストデータ投入

開発・テスト用のサンプルデータを投入する場合は、`lib/seed/seed-data.ts`を使用します。

```bash
# シードスクリプト実行
npm run seed

# または
tsx lib/seed/seed-data.ts
```

## 🗑️ データリセット

テストデータをクリアする場合:

```sql
-- 全データ削除（CASCADE）
TRUNCATE TABLE shifts CASCADE;
TRUNCATE TABLE shift_requests CASCADE;
TRUNCATE TABLE location_requirements CASCADE;
TRUNCATE TABLE locations CASCADE;
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE duty_codes CASCADE;
TRUNCATE TABLE tags CASCADE;
TRUNCATE TABLE roles CASCADE;

-- 初期データ再投入
-- 20251115000002_seed_initial_data.sql を再実行
```

## 📖 参考資料

- [TICKET-002: データベーススキーマ構築](../docs/tickets/TICKET-002-database-schema.md)
- [Supabase公式ドキュメント](https://supabase.com/docs)
- [skills/supabase-patterns.md](../skills/supabase-patterns.md)

## ⚠️ 注意事項

1. **本番環境での実行前に必ずバックアップを取得**
2. マイグレーションは順番に実行すること
3. RLSポリシーの変更は慎重に行うこと
4. CASCADE削除の影響範囲を理解すること

## 🔧 トラブルシューティング

### マイグレーションエラー
```bash
# ロールバック
supabase db reset

# 再実行
supabase db push
```

### RLSエラー
認証が必要なクエリでエラーが発生する場合、Supabase Clientが正しく設定されているか確認:

```typescript
// lib/supabase/server.ts で正しく認証情報を渡しているか確認
const supabase = await createClient()
```

### 型の不一致
スキーマ変更後に型エラーが発生する場合、型を再生成:

```bash
supabase gen types typescript --linked > types/database.ts
```

---

**最終更新**: 2025-11-15
**関連チケット**: TICKET-002
