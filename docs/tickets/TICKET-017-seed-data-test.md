# TICKET-017: 初期データ投入・テスト

## ステータス
✅ 完了

## 優先度
⭐⭐⭐⭐ 高

## 複雑度
Medium

## 概要
モックデータの作成とテスト運用

## 成果物
- [x] `/lib/seed/seed-data.ts` - シードデータ生成スクリプト
- [x] サンプルデータ投入（Web UI `/admin/seed` とAPIエンドポイント `/api/seed` で実行可能）
- [x] 動作確認テスト（テストシナリオドキュメント作成済み）
- [x] テストシナリオドキュメント（`/docs/test-scenarios.md`）

## 依存関係
- All previous tickets（全ての機能実装完了後）

## シードデータ内容

### 1. 役職マスタ
```typescript
const roles = [
  { name: '一般社員', is_responsible: false, priority: 1 },
  { name: 'サブリーダー', is_responsible: true, priority: 2 },
  { name: 'リーダー', is_responsible: true, priority: 3 },
  { name: '管理者', is_responsible: true, priority: 4 },
]
```

### 2. タグマスタ
```typescript
const tags = [
  { name: '保安検査', description: 'T3中央、T3北、T2中央での保安検査業務' },
  { name: 'バス案内', description: 'バス案内業務' },
  { name: '横特', description: '東方航空バゲージ業務' },
  { name: 'OSS', description: 'OSS業務' },
  { name: '番台', description: '番台業務' },
]
```

### 3. 勤務記号マスタ
```typescript
// DEFAULT_DUTY_CODES から28種類を投入（既存）
import { DEFAULT_DUTY_CODES, parseDutyCode } from '@/lib/duty-code-parser'
```

### 4. 配属箇所マスタ
```typescript
const locations = [
  { business_type: '保安検査場案内業務', location_name: 'T3中央', code: 'T3C' },
  { business_type: '保安検査場案内業務', location_name: 'T3北', code: 'T3N' },
  { business_type: '保安検査場案内業務', location_name: 'T2中央', code: 'T2C' },
  { business_type: 'バス案内業務', location_name: 'バス案内', code: 'BUS' },
  { business_type: '横特業務', location_name: '東方航空バゲージ', code: 'TOU' },
]
```

### 5. スタッフマスタ（15-20名のサンプル）
```typescript
const staffSamples = [
  { employee_number: '0001', name: '山田太郎', email: 'yamada@example.com', role: 'リーダー', tags: ['保安検査', 'バス案内'] },
  { employee_number: '0002', name: '佐藤花子', email: 'sato@example.com', role: 'サブリーダー', tags: ['保安検査'] },
  { employee_number: '0003', name: '鈴木次郎', email: 'suzuki@example.com', role: '一般社員', tags: ['保安検査'] },
  { employee_number: '0004', name: '田中美咲', email: 'tanaka@example.com', role: '一般社員', tags: ['バス案内'] },
  { employee_number: '0005', name: '高橋健太', email: 'takahashi@example.com', role: '一般社員', tags: ['保安検査'] },
  { employee_number: '0006', name: '伊藤舞', email: 'ito@example.com', role: 'サブリーダー', tags: ['バス案内', 'OSS'] },
  { employee_number: '0007', name: '渡辺大輔', email: 'watanabe@example.com', role: '一般社員', tags: ['保安検査'] },
  { employee_number: '0008', name: '中村優子', email: 'nakamura@example.com', role: '一般社員', tags: ['横特'] },
  { employee_number: '0009', name: '小林誠', email: 'kobayashi@example.com', role: '一般社員', tags: ['保安検査'] },
  { employee_number: '0010', name: '加藤明美', email: 'kato@example.com', role: '一般社員', tags: ['バス案内'] },
  { employee_number: '0011', name: '吉田隆史', email: 'yoshida@example.com', role: 'リーダー', tags: ['保安検査', '番台'] },
  { employee_number: '0012', name: '山本彩', email: 'yamamoto@example.com', role: '一般社員', tags: ['保安検査'] },
  { employee_number: '0013', name: '佐々木翔', email: 'sasaki@example.com', role: '一般社員', tags: ['バス案内'] },
  { employee_number: '0014', name: '森田里奈', email: 'morita@example.com', role: '一般社員', tags: ['保安検査'] },
  { employee_number: '0015', name: '林拓也', email: 'hayashi@example.com', role: 'サブリーダー', tags: ['保安検査', 'バス案内'] },
]
```

### 6. 配属箇所要件
```typescript
// T3中央の要件例
const locationRequirements = [
  {
    location: 'T3中央',
    duty_code: '06G5DA',
    required_staff_count: 5,
    required_responsible_count: 1,
    required_tags: ['保安検査'],
    day_of_week: null, // デフォルト
  },
  {
    location: 'T3中央',
    duty_code: '06G5DA',
    required_staff_count: 8,
    required_responsible_count: 2,
    required_tags: ['保安検査'],
    day_of_week: 1, // 月曜日
  },
  // 他の配属箇所・勤務記号の組み合わせ
]
```

### 7. サンプルシフトデータ
```typescript
// 2025年12月分のサンプルシフト（1週間分程度）
// 実際の運用に近いデータ
```

## シードスクリプト実装

### seed-data.ts
```typescript
import { createClient } from '@/lib/supabase/server'
import { DEFAULT_DUTY_CODES, parseDutyCode } from '@/lib/duty-code-parser'

export async function seedDatabase() {
  const supabase = await createClient()

  console.log('🌱 Seeding database...')

  // 1. 役職マスタ
  console.log('Seeding roles...')
  const roles = [
    { name: '一般社員', is_responsible: false, priority: 1 },
    { name: 'サブリーダー', is_responsible: true, priority: 2 },
    { name: 'リーダー', is_responsible: true, priority: 3 },
    { name: '管理者', is_responsible: true, priority: 4 },
  ]

  const { data: insertedRoles } = await supabase
    .from('roles')
    .insert(roles)
    .select()

  console.log(`✅ Inserted ${insertedRoles?.length} roles`)

  // 2. タグマスタ
  console.log('Seeding tags...')
  const tags = [
    { name: '保安検査', description: 'T3中央、T3北、T2中央での保安検査業務' },
    { name: 'バス案内', description: 'バス案内業務' },
    { name: '横特', description: '東方航空バゲージ業務' },
    { name: 'OSS', description: 'OSS業務' },
    { name: '番台', description: '番台業務' },
  ]

  const { data: insertedTags } = await supabase
    .from('tags')
    .insert(tags)
    .select()

  console.log(`✅ Inserted ${insertedTags?.length} tags`)

  // 3. 勤務記号マスタ
  console.log('Seeding duty codes...')
  const dutyCodes = DEFAULT_DUTY_CODES.map(({ code, category }) => {
    const parsed = parseDutyCode(code)
    return {
      code: parsed.code,
      start_time: parsed.startTime,
      end_time: parsed.endTime,
      duration_hours: parsed.durationHours,
      duration_minutes: parsed.durationMinutes,
      break_minutes: parsed.breakMinutes,
      is_overnight: parsed.isOvernight,
      category,
    }
  })

  const { data: insertedDutyCodes } = await supabase
    .from('duty_codes')
    .insert(dutyCodes)
    .select()

  console.log(`✅ Inserted ${insertedDutyCodes?.length} duty codes`)

  // 4. 配属箇所マスタ
  console.log('Seeding locations...')
  const locations = [
    { business_type: '保安検査場案内業務', location_name: 'T3中央', code: 'T3C' },
    { business_type: '保安検査場案内業務', location_name: 'T3北', code: 'T3N' },
    { business_type: '保安検査場案内業務', location_name: 'T2中央', code: 'T2C' },
    { business_type: 'バス案内業務', location_name: 'バス案内', code: 'BUS' },
    { business_type: '横特業務', location_name: '東方航空バゲージ', code: 'TOU' },
  ]

  const { data: insertedLocations } = await supabase
    .from('locations')
    .insert(locations)
    .select()

  console.log(`✅ Inserted ${insertedLocations?.length} locations`)

  // 5. スタッフマスタ
  console.log('Seeding staff...')
  // (上記のstaffSamplesを使用して投入)

  // 6. 配属箇所要件
  console.log('Seeding location requirements...')
  // (配属箇所要件を投入)

  console.log('✅ Database seeding completed!')
}
```

### 実行方法
```typescript
// /app/api/seed/route.ts
import { NextResponse } from 'next/server'
import { seedDatabase } from '@/lib/seed/seed-data'

export async function POST() {
  try {
    await seedDatabase()
    return NextResponse.json({ message: 'Seeding completed' })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

または npm scripts:
```json
{
  "scripts": {
    "seed": "tsx lib/seed/seed-data.ts"
  }
}
```

## テストシナリオ

### 1. マスタ管理のテスト
- [ ] 役職の追加・編集・削除
- [ ] タグの追加・編集・削除
- [ ] 勤務記号の表示・フィルタリング
- [ ] スタッフの追加・編集・削除
- [ ] 配属箇所の追加・編集
- [ ] 配属箇所要件の設定

### 2. 希望提出管理のテスト
- [ ] Excelファイルの取り込み
- [ ] 希望データの表示
- [ ] フィルタリング

### 3. シフト作成のテスト
- [ ] スタッフのドラッグ&ドロップ
- [ ] 制約チェックの動作確認
- [ ] エラー・警告の表示
- [ ] シフトの保存

### 4. 制約チェックのテスト
- [ ] 必要人数不足の検出
- [ ] 責任者不足の検出
- [ ] 必要タグ不足の検出

### 5. 出力機能のテスト
- [ ] Excel出力
- [ ] CSV出力
- [ ] ファイルの内容確認

### 6. シフト確定のテスト
- [ ] 個別確定
- [ ] 一括確定
- [ ] 制約チェックとの連携

### 7. 認証のテスト（実装した場合）
- [ ] ログイン
- [ ] ログアウト
- [ ] アクセス制御

## パフォーマンステスト
- [ ] 150名のスタッフで動作確認
- [ ] 1ヶ月分（約1000件）のシフトで動作確認
- [ ] レスポンス時間の計測

## テストデータ削除
```sql
-- テストデータのクリア
TRUNCATE TABLE shifts CASCADE;
TRUNCATE TABLE shift_requests CASCADE;
TRUNCATE TABLE location_requirements CASCADE;
TRUNCATE TABLE locations CASCADE;
TRUNCATE TABLE staff CASCADE;
TRUNCATE TABLE duty_codes CASCADE;
TRUNCATE TABLE tags CASCADE;
TRUNCATE TABLE roles CASCADE;
```

## 完了条件
- [ ] 全てのマスタデータが投入されている
- [ ] サンプルシフトデータが投入されている
- [ ] 全ての機能が正常に動作する
- [ ] テストシナリオが全て通過する
- [ ] パフォーマンスが良好

## 見積もり工数
6-8時間

## 開始予定日
2025-11-27

## 完了予定日
2025-11-28
