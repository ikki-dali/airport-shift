# Task Plan: airport-shift-dev 製品化 - 見えない課題の修正

## Goal
現状のairport-shift-devプロトタイプを製品レベルに引き上げるため、「見えない課題」（セキュリティ、型安全性、エラーハンドリング、データ整合性、インフラ）を優先的に修正する。

## Current Phase
Phase 5

## Phases

### Phase 1: 基盤固め（TypeScript・ビルド品質）
- [x] TypeScript strict mode有効化（tsconfig.json）
- [x] ignoreBuildErrors: false に修正（next.config.ts）
- [x] 型エラーの修正（203件修正完了）
- [ ] ESLint設定強化（後回し）
- **Status:** complete
- **担当:** Frontend
- **PR:** https://github.com/ikki-dali/airport-shift/pull/3

### Phase 2: エラーハンドリング統一
- [x] カスタムエラークラス作成（5種）
- [x] Server Actions全体のtry-catch統一（16ファイル）
- [ ] ユーザー向けエラー通知（トースト）統一（Phase 4で対応）
- [x] console.log/errorを構造化ロガーに置換
- [x] OpenAI API呼び出しのタイムアウト+リトライ実装
- **Status:** complete
- **担当:** Backend
- **PR:** https://github.com/ikki-dali/airport-shift/pull/4

### Phase 3: データ整合性
- [x] トランザクション処理実装（confirmShifts RPC化）
- [x] 楽観的ロック実装（versionカラム + トリガー + ConflictError）
- [x] DB制約の追加（式インデックスでUNIQUE）
- [x] Supabase型自動生成スクリプト追加（gen:types）
- **Status:** complete
- **担当:** Backend
- **PR:** https://github.com/ikki-dali/airport-shift/pull/5

### Phase 4: セキュリティ（認証・認可）
- [ ] Supabase Auth導入（TICKET-004）
- [ ] middleware.ts作成（TICKET-004）
- [ ] RLSポリシー書き直し（TICKET-004）
- [ ] ログインUI実装（TICKET-005、TICKET-004完了後）
- [ ] 入力バリデーション強化（Zodスキーマ適用）→ 後回し
- [ ] リクエストトークンに有効期限追加 → 後回し
- **Status:** complete
- **担当:** Backend + Frontend
- **認証方式:** Email/Password（Supabase Auth）
- **PR:** https://github.com/ikki-dali/airport-shift/pull/6, https://github.com/ikki-dali/airport-shift/pull/7

### Phase 5: インフラ・運用準備
- [ ] テスト導入（TICKET-006、作業中）
- [ ] CI/CDパイプライン構築（GitHub Actions）
- [ ] モニタリング導入（Sentry）
- [ ] 環境分離（dev/staging/prod）→ 後回し
- [ ] バックアップ戦略策定 → 後回し
- [ ] APIレート制限実装 → 後回し
- **Status:** in_progress
- **担当:** Infra

### Phase 6: パフォーマンス最適化
- [ ] バンドルサイズ最適化（動的インポート）
- [ ] データフェッチ戦略見直し（ISR/SWR）
- [ ] DBインデックス追加
- [ ] AI生成のバックグラウンドジョブ化
- [ ] メール送信のキュー化
- **Status:** pending
- **担当:** Backend + Infra

## Key Questions
1. 認証方式: Supabase Auth（Magic Link? Email/Password?）→ ユーザー確認必要
2. 環境分離: Supabaseプロジェクト分離 or ブランチ機能？→ コスト次第
3. テスト戦略: どこまでカバレッジ求める？→ 最低限E2E + ビジネスロジックUnit

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Phase 1を最優先 | strict modeなしでは他の修正の型安全性が保証されない |
| 認証より先にデータ整合性 | トランザクションは認証なしでも実装可能、先にデータ壊れるリスクを潰す |
| テストはPhase 5 | CI/CDと一緒に入れないと意味が薄い |
| 認証方式: Email/Password | シンプルで確実、管理者がアカウント発行 |
| RBAC(管理者/一般)は将来対応 | まずは全員同権限で運用開始 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
|       | 1       |            |

## Notes
- 64件の課題をarchitectサブエージェントが洗い出し済み
- Critical: 16件、High: 22件、Medium: 20件、Low: 6件
- 「見えない課題」優先 = ユーザーに影響見えにくいが製品品質に直結する部分
- ShiftCreationBoardのV1/V2/V3問題は後回し（見える課題）
