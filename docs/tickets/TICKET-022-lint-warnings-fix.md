# TICKET-022: ESLint Warning修正（86件 → 0件）

## 担当
Frontend

## 背景
- CI/CD導入時にESLint 9を新規導入
- 現在86件のwarningが出ている（error 0件）
- 主な問題:
  - `react-hooks/exhaustive-deps`: useEffectの依存配列漏れ（ステールクロージャバグの原因）
  - `react-hooks/error-boundaries`: try/catch内のJSX（Reactのエラー捕捉が効かない）
- warningのまま放置すると本番で潜在バグになる

## 要件

### 1. exhaustive-deps修正
- useEffect/useCallback/useMemoの依存配列を正しく設定
- 不要な再実行を避けるため、関数はuseCallbackで包む
- 依存配列に入れるとループする場合はuseRefパターンを使う

### 2. error-boundaries修正
- try/catch内のJSXを除去
- Server ComponentsのデータフェッチエラーはNext.jsのerror.tsxに任せる
- `notFound()`はtry/catchの外で条件分岐して呼ぶ

### 3. その他のwarning
- `import/no-anonymous-default-export`等あれば対応
- 全て修正し、warningを0件にする

## 注意事項
- warnをoffにして逃げるのはNG（実バグリスク）
- eslint.config.mjsのルール設定は変更しない（warnのまま、修正で対応）
- テストファイル（*.test.ts）はignore済みなので対象外

## 完了条件
- [ ] `npm run lint`でwarning 0件、error 0件
- [ ] `npm test`が80件全パス
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
