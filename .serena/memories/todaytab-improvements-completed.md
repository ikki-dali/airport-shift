# TodayTab 改善完了 (2026-02-09)

## 実装した変更

### 1. StatBarをTodayから除外 → Monthヘッダーに移動
- `app/page.tsx` — StatBar削除、fillRate/shortageDaysをDashboardTabsにprop渡し
- `components/dashboard/DashboardTabs.tsx` — MonthセクションPageHeaderに充足率・不足日数バッジ表示

### 2. 状態列削除 + 3状態の行スタイリング
- テーブルから「状態」列を完全削除（5列→4列: #, 配置, 氏名, 時間/記号, タイムライン）
- `isFinished()` 関数追加（日またぎシフトは常にfalse）
- 勤務中: `bg-green-50` + 名前左にパルスドット
- 退勤済み: `opacity-50` グレーアウト
- 未出勤: 通常表示
- ヘッダーサマリに「退勤済 N人」追加

### 3. 欠勤マーク + 応援要請モーダル
- 名前セルにホバー時の小さな×ボタン
- 欠勤確認AlertDialog → updateShift(status: 'キャンセル')
- 欠勤後に応援要請ダイアログ自動表示
- 楽観的更新で即座にUI反映（失敗時巻き戻し）
- キャンセル済み行: 赤背景 + 取り消し線 + 「欠勤」表示

### 既存バグ修正（ビルド通過のため）
- DutyCodeFormDialog: total_hours追加
- ShiftRequestForm/ShiftRequestModal/ShiftRequestsEditor: RequestType → A〜G形式
- ShiftCreationBoard: 未使用ShiftRequestsPanel呼び出し削除
- types/database.ts: staffにemployment_type/expo_push_token、system_settingsテーブル追加
- shift-tasks.ts/task-types.ts: import path修正
