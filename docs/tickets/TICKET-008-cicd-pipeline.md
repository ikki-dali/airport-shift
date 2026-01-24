# TICKET-008: CI/CDパイプライン構築（GitHub Actions）

## 担当
Infra

## 背景
- 現在CI/CDなし、手動デプロイ
- テスト基盤（Vitest）が入ったのでCIで自動実行可能に
- PR時に自動チェック → マージ後にデプロイ

## 要件

### 1. CI: PRチェック（`.github/workflows/ci.yml`）
- トリガー: PR作成時、プッシュ時
- ステップ:
  - Node.js 20セットアップ
  - `npm ci`
  - `npm run lint`（ESLint）
  - `npm test`（Vitest）
  - `npm run build`（型チェック含む）

### 2. CD: Vercel自動デプロイ（既存のVercel連携確認）
- Vercelの自動デプロイが既に設定されているなら、確認のみ
- されていないなら、GitHub連携設定手順をドキュメント化

## 注意事項
- テストでDB接続は不要（モック済み）
- 環境変数はGitHub Secretsに設定しない（テストにSupabase不要）
- ビルド時に型チェックが走るのでlint + test + buildで十分

## 完了条件
- [ ] `.github/workflows/ci.yml`が作成されている
- [ ] PRを作成するとCIが自動実行される
- [ ] lint + test + buildが全てパスする
- [ ] PRを作成してURL報告
