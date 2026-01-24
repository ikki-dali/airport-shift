# Findings & Decisions

## Requirements
- 現状のプロトタイプを製品レベルに引き上げ
- 「見えない課題」（技術的負債）を優先的に修正
- 特定1社への提供が決定済み

## Research Findings（技術監査結果）

### セキュリティ（Critical 8件）
- RLSポリシーが全て `USING(true)` → 誰でも全データアクセス可能
- middleware.ts未実装 → ルート保護なし
- TypeScript strict: false → 型安全性不十分
- next.config.ts: ignoreBuildErrors: true → 型エラー本番混入
- 通知テーブルRLSがauth.uid()参照するが認証未実装
- CSRF対策なし
- リクエストトークンに有効期限なし
- シークレット管理ドキュメント不足

### エラーハンドリング（Critical 3件）
- shifts.tsはtry-catch有、staff.tsはなし → 不統一
- OpenAI API呼び出しにリトライ・タイムアウトなし
- DBエラーメッセージがユーザーに直接露出

### データ整合性（Critical 4件）
- confirmShifts: 複数更新が別々に実行、途中エラーで不整合
- 楽観的ロックなし → Last Write Wins問題
- 型定義が手動管理 → スキーマ変更時の同期保証なし
- マイグレーションファイルが変更中状態

### コード品質（Critical 1件）
- テストファイルが0件 → リグレッション検出不可

### インフラ（Critical 2件）
- CI/CDパイプラインなし
- バックアップ戦略なし

### パフォーマンス（High）
- 全ページ force-dynamic → 静的生成の機会損失
- AI生成に5-30秒 → タイムアウト設定なし
- メール送信が同期処理 → スタッフ多いと確定処理遅延

### その他注意点
- console.log/error: 91箇所
- ShiftCreationBoard V1/V2/V3が混在
- TODOコメント5箇所
- マジックナンバー多数

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| スタック: Next.js 16 + Supabase | 既存選択を維持、変更コスト大 |
| 認証: Supabase Auth | 既存Supabaseエコシステム活用 |
| テスト: Vitest + Playwright | Next.js公式推奨 |
| CI/CD: GitHub Actions | GitHubリポジトリと統合 |
| モニタリング: Sentry | Vercel/Next.js統合が容易 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
|       |            |

## Resources
- プロジェクトパス: /Users/yamamotoikki/cradle/airport-shift-dev
- Supabaseマイグレーション: supabase/migrations/
- Server Actions: lib/actions/*.ts
- バリデーション: lib/validators/shift-validator.ts
- メール送信: lib/email/send-shift-confirmation.ts
- AI生成: lib/actions/ai-shift-generator.ts
