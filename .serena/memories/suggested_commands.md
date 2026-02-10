# 推奨コマンド

## 開発
- `pnpm dev` - 開発サーバー起動 (Turbopack)
- `pnpm build` - 本番ビルド
- `pnpm start` - 本番サーバー起動

## テスト
- `pnpm test` - ユニットテスト実行 (Vitest)
- `pnpm test:watch` - テスト監視モード
- `pnpm test:coverage` - カバレッジ付きテスト
- `pnpm test:e2e` - E2Eテスト (Playwright)

## 品質チェック
- `pnpm lint` - ESLint実行

## DB関連
- `npx supabase migration new <name>` - 新規マイグレーション作成
- `npx supabase db push` - マイグレーション適用
- `pnpm gen:types` - Supabase型定義生成

## システム (macOS/Darwin)
- `git` - バージョン管理
- `rg` (ripgrep) - 高速テキスト検索
