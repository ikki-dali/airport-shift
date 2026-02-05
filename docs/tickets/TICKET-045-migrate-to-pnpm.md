# TICKET-045: pnpmへの移行

## 担当
Frontend

## 概要
npm から pnpm に移行する。ディスク容量削減・インストール高速化のため。

## 対象リポジトリ
1. `ikki-dali/airport-shift`（Web）
2. `ikki-dali/airport-shift-mobile`（Mobile）

## 作業内容

### 各リポジトリで実行

```bash
# 1. node_modulesとpackage-lock.jsonを削除
rm -rf node_modules package-lock.json

# 2. pnpmでインストール
pnpm install

# 3. package.jsonにpackageManagerを追加
# "packageManager": "pnpm@10.20.0"

# 4. 動作確認
pnpm dev  # または pnpm expo start
```

### .gitignoreの確認
`pnpm-lock.yaml` がコミットされるようになっていることを確認

## 完了条件
- [ ] airport-shift: pnpm移行完了
- [ ] airport-shift-mobile: pnpm移行完了
- [ ] 両方で `packageManager` フィールドが追加されている
- [ ] 両方でビルド/起動が正常に動作する
- [ ] pnpm-lock.yaml がコミットされている
