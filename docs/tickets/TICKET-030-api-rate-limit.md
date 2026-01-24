# TICKET-030: API Rate Limiting

## 担当
Backend

## 背景
- 本番運用でDDoS/ブルートフォース攻撃対策が必要
- 特にログインエンドポイントは攻撃対象になりやすい
- Server Actionsにレート制限を追加

## 要件

### 1. レート制限ユーティリティ（lib/rate-limit.ts）
- インメモリのレート制限（Map + sliding window）
- IP or ユーザーID単位でリクエスト制限
- 設定可能: interval（ウィンドウ期間）、limit（最大回数）

### 2. ログインアクションへの適用
- lib/actions/auth.ts の login() に適用
- 制限: 同一IPから5回/分
- 制限超過時: AppError('ログイン試行回数が上限に達しました。しばらく待ってから再試行してください')

### 3. その他のwrite系アクションへの適用（オプショナル）
- create/update/delete系に緩めの制限（30回/分）
- 必須ではないが、余裕があれば

## 注意事項
- Vercel Serverless環境ではインスタンス間でメモリ共有不可
- 完璧なレート制限にはRedis等が必要だが、MVP段階ではインメモリで十分
- Vercelのエッジでの基本的なDDoS対策は既にある
- インメモリMapは定期的にクリーンアップ（メモリリーク防止）

## 完了条件
- [ ] lib/rate-limit.ts が作成されている
- [ ] ログインアクションにレート制限が適用されている
- [ ] レート制限のユニットテスト追加
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
