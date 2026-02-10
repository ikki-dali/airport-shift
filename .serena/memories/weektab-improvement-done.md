# WeekTab改善 完了メモ (2026-02-09)

## 変更ファイル
- `components/dashboard/WeekTab.tsx` - メイン改修
- `components/dashboard/DashboardTabs.tsx` - 週バッジ追加

## やったこと
1. **デスクトップ/モバイル ハイブリッドレイアウト**: `md:`ブレークポイントで7カラムグリッド⇔縦リスト切替
2. **充足率バー（severity-based）**: 100%+緑 / 90-99%黄 / 70-89%オレンジ / <70%赤+pulse
3. **カードコンパクト化**: p-2, 日付text-sm, 曜日text-xxs, gap-1.5
4. **要請ボタン**: 不足数(-X人)の隣に小さい赤ボタン「📣要請」を横並び配置。AlertDialogで確認→sendReinforcementRequest
5. **週間サマリー → ヘッダーバッジに移動**: WeekTab内のサマリー行削除、DashboardTabsのPageHeaderバッジとして表示
6. **`calcWeekStats` エクスポート**: DashboardTabsから使えるユーティリティ関数

## デザイン判断（ユーザーフィードバック）
- 下部サマリー行は不要 → ヘッダーバッジと同じ形式で十分
- カードがデカすぎ → コンパクト化
- 要請ボタンでかすぎ → 小さく、でもアイコンだけだと認識できない → テキスト「要請」付き
- -X人の隣に置くのが自然

## MonthTab改善に向けてのヒント
- 同じseverityベースの色分け・充足バーの仕組みを使える
- `calcWeekStats`のような統計ユーティリティパターン
- コンパクト志向（ユーザーはデカすぎを嫌う）
- 要請ボタンは不足数の隣が良い
