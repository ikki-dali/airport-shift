# TICKET-001: TypeScript strict mode有効化 + ビルドエラー修正

## 担当
Frontend

## 背景
- tsconfig.jsonで`strict: false`になっており型安全性が不十分
- next.config.tsで`ignoreBuildErrors: true`になっており型エラーが本番に混入する
- 製品化に向けて、これが全修正の土台となる

## 要件
- tsconfig.jsonで`strict: true`に変更
- next.config.tsで`typescript.ignoreBuildErrors`を`false`に変更（または削除）
- 上記変更で発生する型エラーを全て修正
- ビルドが通ることを確認（`npm run build`）

## 注意事項
- 型エラーが大量に出る可能性あり。段階的に修正してOK
- `any`型は極力排除し、適切な型定義に置換
- 既存の動作を壊さないこと
- ShiftCreationBoardのV1/V2/V3問題は今回スコープ外（型エラー修正のみ）

## 完了条件
- [ ] tsconfig.json: strict: true
- [ ] next.config.ts: ignoreBuildErrors削除 or false
- [ ] `npm run build` が成功
- [ ] 型エラー0件
- [ ] PRを作成してURL報告
