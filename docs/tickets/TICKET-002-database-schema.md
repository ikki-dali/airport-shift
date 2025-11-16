# TICKET-002: Supabaseデータベーススキーマ構築

## ステータス
🔄 進行中

## 優先度
⭐⭐⭐⭐⭐ 最高

## 複雑度
Medium

## 概要
要件定義書に基づいた7つのテーブルのマイグレーションSQL作成と実行

## 成果物
- [ ] マイグレーションSQLファイル作成
- [ ] テーブル作成（7テーブル）
  - [ ] roles（役職マスタ）
  - [ ] tags（タグマスタ）
  - [ ] staff（スタッフ）
  - [ ] duty_codes（勤務記号マスタ）
  - [ ] locations（配属箇所）
  - [ ] location_requirements（配属箇所要件）
  - [ ] shift_requests（希望提出）
  - [ ] shifts（シフト）
- [ ] RLS（Row Level Security）設定
- [ ] テーブル間のリレーション設定
- [ ] インデックス設定
- [ ] 初期データ投入（勤務記号28種類）

## 依存関係
- TICKET-001: プロジェクト基盤のセットアップ

## テーブル設計

### 1. roles（役職マスタ）
```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_responsible BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. tags（タグマスタ）
```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 3. staff（スタッフ）
```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role_id UUID REFERENCES roles(id),
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 4. duty_codes（勤務記号マスタ）
```sql
CREATE TABLE duty_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_hours INTEGER NOT NULL,
  duration_minutes INTEGER NOT NULL,
  break_minutes INTEGER NOT NULL,
  is_overnight BOOLEAN DEFAULT false,
  category TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 5. locations（配属箇所）
```sql
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_type TEXT NOT NULL,
  location_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 6. location_requirements（配属箇所要件）
```sql
CREATE TABLE location_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID REFERENCES locations(id) ON DELETE CASCADE,
  duty_code_id UUID REFERENCES duty_codes(id),
  required_staff_count INTEGER NOT NULL,
  required_responsible_count INTEGER DEFAULT 0,
  required_tags TEXT[],
  day_of_week INTEGER, -- 0-6 (日-土)
  specific_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 7. shift_requests（希望提出）
```sql
CREATE TABLE shift_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  request_type TEXT NOT NULL, -- ◯/休/早朝/早番/遅番/夜勤
  note TEXT,
  year_month TEXT NOT NULL, -- YYYY-MM
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 8. shifts（シフト）
```sql
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  location_id UUID REFERENCES locations(id),
  duty_code_id UUID REFERENCES duty_codes(id),
  date DATE NOT NULL,
  status TEXT DEFAULT '予定', -- 予定/確定/変更/キャンセル
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID,
  updated_by UUID
);
```

## インデックス設計
- staff.employee_number（UNIQUE）
- duty_codes.code（UNIQUE）
- locations.code（UNIQUE）
- shift_requests.staff_id + date（複合）
- shifts.staff_id + date（複合）
- shifts.location_id + date（複合）

## 初期データ
- 勤務記号28種類を duty_codes に投入
- サンプル役職（一般社員、サブリーダー、リーダー、管理者）

## RLS設定
モックMVP版では基本的な認証のみ実装

## 注意事項
- updated_at の自動更新トリガーを設定
- CASCADE削除の設定に注意
- 配列型（TEXT[]）の扱いに注意

## 完了条件
- [ ] Supabaseでマイグレーション実行成功
- [ ] 全テーブルが正しく作成されている
- [ ] 初期データが投入されている
- [ ] TypeScriptの型定義と一致している

## 開始予定日
2025-11-15

## 完了予定日
2025-11-15
