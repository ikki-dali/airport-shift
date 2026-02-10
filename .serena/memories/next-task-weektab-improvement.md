# 次のタスク: WeekTab 改善

## 前提
- TodayTabの改善は完了済み（todaytab-improvements-completed参照）
- ホーム画面のダッシュボードは Today → Week → Month の3セクション構成
- DashboardTabs.tsx でWeekTab/MonthTabを表示、ページ送り機能あり
- StatBarの統計バッジはMonthセクションヘッダーに移動済み

## 対象ファイル
- `components/dashboard/WeekTab.tsx` — 週間表示コンポーネント
- `components/dashboard/DashboardTabs.tsx` — 親コンポーネント（ページ送り制御）

## ユーザーの意向
- WeekTabの改善を行う（具体的な要件はユーザーに確認すること）
- ホーム画面全体を「確認に特化した画面」にする方針

## 現状の構成
- WeekTab: 週間カレンダー表示（日別の充足状況）
- DayDetailModal: 日をクリックすると詳細モーダル（応援要請ボタン付き）
- DAY_EVENTS: サンプルイベントデータ（祝日、VIP視察など）
