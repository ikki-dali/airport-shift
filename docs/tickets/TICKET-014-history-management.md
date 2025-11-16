# TICKET-014: 履歴管理機能

## ステータス
📋 未着手

## 優先度
⭐⭐⭐ 中

## 複雑度
Simple

## 概要
シフト変更履歴の記録

## 成果物
- [ ] `created_by` / `updated_by` フィールドの自動設定
- [ ] `/app/shifts/history/page.tsx` - 履歴一覧ページ（オプション）
- [ ] 変更履歴の表示機能（オプション）

## 依存関係
- TICKET-010: ドラッグ&ドロップ実装

## 機能要件

### 基本的な履歴記録（MVP版）

#### 自動記録項目
- `created_by`: シフト作成者のユーザーID
- `updated_by`: シフト更新者のユーザーID
- `created_at`: 作成日時（自動）
- `updated_at`: 更新日時（自動）

### Server Actionsでの実装

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

async function getCurrentUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
}

export async function createShift(data: {
  staffId: string
  locationId: string
  dutyCodeId: string
  date: string
  status: string
}) {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { error } = await supabase.from('shifts').insert({
    staff_id: data.staffId,
    location_id: data.locationId,
    duty_code_id: data.dutyCodeId,
    date: data.date,
    status: data.status,
    created_by: userId,
    updated_by: userId,
  })

  if (error) throw error
}

export async function updateShift(
  shiftId: string,
  data: Partial<{
    locationId: string
    dutyCodeId: string
    status: string
    note: string
  }>
) {
  const supabase = await createClient()
  const userId = await getCurrentUserId()

  const { error } = await supabase
    .from('shifts')
    .update({
      ...data,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', shiftId)

  if (error) throw error
}
```

### updated_atの自動更新トリガー（Supabase）

```sql
-- updated_at自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- shiftsテーブルにトリガー設定
CREATE TRIGGER update_shifts_updated_at
BEFORE UPDATE ON shifts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 他のテーブルにも同様に設定
CREATE TRIGGER update_staff_updated_at
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_duty_codes_updated_at
BEFORE UPDATE ON duty_codes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at
BEFORE UPDATE ON locations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shift_requests_updated_at
BEFORE UPDATE ON shift_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

## 拡張機能（オプション）

### 変更履歴テーブル（将来実装）

```sql
CREATE TABLE shift_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shift_id UUID REFERENCES shifts(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES staff(id),
  location_id UUID REFERENCES locations(id),
  duty_code_id UUID REFERENCES duty_codes(id),
  date DATE NOT NULL,
  status TEXT NOT NULL,
  note TEXT,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now(),
  changes JSONB -- 変更内容の詳細
);

CREATE INDEX idx_shift_history_shift_id ON shift_history(shift_id);
CREATE INDEX idx_shift_history_changed_at ON shift_history(changed_at);
```

### 履歴記録トリガー（将来実装）

```sql
CREATE OR REPLACE FUNCTION log_shift_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO shift_history (
      shift_id, staff_id, location_id, duty_code_id, date, status, note,
      action, changed_by
    ) VALUES (
      NEW.id, NEW.staff_id, NEW.location_id, NEW.duty_code_id, NEW.date,
      NEW.status, NEW.note, 'created', NEW.created_by
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO shift_history (
      shift_id, staff_id, location_id, duty_code_id, date, status, note,
      action, changed_by, changes
    ) VALUES (
      NEW.id, NEW.staff_id, NEW.location_id, NEW.duty_code_id, NEW.date,
      NEW.status, NEW.note, 'updated', NEW.updated_by,
      jsonb_build_object(
        'old', to_jsonb(OLD),
        'new', to_jsonb(NEW)
      )
    );
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO shift_history (
      shift_id, staff_id, location_id, duty_code_id, date, status, note,
      action, changed_by
    ) VALUES (
      OLD.id, OLD.staff_id, OLD.location_id, OLD.duty_code_id, OLD.date,
      OLD.status, OLD.note, 'deleted', OLD.updated_by
    );
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_shift_changes_trigger
AFTER INSERT OR UPDATE OR DELETE ON shifts
FOR EACH ROW
EXECUTE FUNCTION log_shift_changes();
```

### 履歴一覧ページ（将来実装）

```typescript
'use client'

interface ShiftHistoryProps {
  shiftId?: string
  staffId?: string
  dateFrom?: string
  dateTo?: string
}

export default function ShiftHistoryPage({
  shiftId,
  staffId,
  dateFrom,
  dateTo,
}: ShiftHistoryProps) {
  // 履歴データ取得
  const { data: history } = useShiftHistory({ shiftId, staffId, dateFrom, dateTo })

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">シフト変更履歴</h1>

      <div className="space-y-4">
        {history?.map((record) => (
          <div key={record.id} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">
                {record.action === 'created' && '作成'}
                {record.action === 'updated' && '更新'}
                {record.action === 'deleted' && '削除'}
              </span>
              <span className="text-sm text-gray-600">
                {new Date(record.changed_at).toLocaleString('ja-JP')}
              </span>
            </div>

            <div className="text-sm">
              <div>スタッフ: {record.staff.name}</div>
              <div>配属箇所: {record.location.location_name}</div>
              <div>勤務記号: {record.duty_code.code}</div>
              <div>日付: {record.date}</div>
              {record.note && <div>備考: {record.note}</div>}
            </div>

            {record.changes && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-blue-600">
                  変更詳細を表示
                </summary>
                <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                  {JSON.stringify(record.changes, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## MVP版の実装範囲

### 必須
- [ ] `created_by` / `updated_by` の自動設定
- [ ] `updated_at` の自動更新トリガー

### オプション（時間があれば）
- [ ] 変更履歴テーブルの作成
- [ ] 履歴記録トリガーの設定
- [ ] 履歴一覧ページ

## テスト項目
- [ ] シフト作成時に created_by が設定される
- [ ] シフト更新時に updated_by が設定される
- [ ] updated_at が自動更新される
- [ ] 履歴テーブルに正しく記録される（オプション）
- [ ] 履歴一覧が表示される（オプション）

## 完了条件
- [ ] created_by / updated_by が正しく記録される
- [ ] updated_at トリガーが動作する
- [ ] （オプション）履歴テーブルが正常に動作する

## 見積もり工数
3-4時間（基本機能のみ）
6-8時間（拡張機能含む）

## 開始予定日
2025-11-26

## 完了予定日
2025-11-26
