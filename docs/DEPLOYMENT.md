# デプロイメントガイド

このドキュメントでは、空港シフト管理システムをVercelにデプロイする手順を説明します。

## 前提条件

- Node.js 18以上がインストールされていること
- npm 9以上がインストールされていること
- GitHubアカウントを持っていること
- Vercelアカウントを持っていること（無料でOK）
- Supabaseプロジェクトが作成されていること

## 1. 環境変数の準備

### 1.1 Supabase情報の取得

1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. プロジェクトを選択
3. Settings → API に移動
4. 以下の値をメモ:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - anon/public key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)

### 1.2 ローカル環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成:

```bash
cp .env.local.example .env.local
```

`.env.local` を編集して、Supabaseの情報を入力:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 2. ローカルビルドテスト

デプロイ前に、ローカルでプロダクションビルドをテスト:

```bash
# 依存パッケージのインストール
npm install

# プロダクションビルド
npm run build

# ビルド結果の確認
npm run start
```

ブラウザで `http://localhost:3000` にアクセスして、全ての機能が正常に動作することを確認。

## 3. Gitリポジトリの準備

### 3.1 .gitignoreの確認

`.gitignore` ファイルが存在し、以下が含まれていることを確認:

```
node_modules/
.next/
.env.local
.env*.local
.vercel
```

### 3.2 GitHubリポジトリの作成

1. [GitHub](https://github.com/)で新しいリポジトリを作成
2. ローカルリポジトリを初期化してpush:

```bash
# Gitリポジトリの初期化（まだの場合）
git init

# ファイルを追加
git add .

# 初回コミット
git commit -m "Initial commit: Airport shift management system"

# GitHubリポジトリをリモートとして追加
git remote add origin https://github.com/your-username/airport-shift-dev.git

# メインブランチに変更
git branch -M main

# GitHubにpush
git push -u origin main
```

## 4. Vercelへのデプロイ

### オプション1: Vercel Dashboard（推奨）

1. [Vercel](https://vercel.com/)にログイン
2. 「New Project」をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定:
   - **Project Name**: `airport-shift-system`（任意）
   - **Framework Preset**: Next.js（自動検出）
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`（デフォルト）
   - **Output Directory**: `.next`（デフォルト）
   - **Install Command**: `npm install`（デフォルト）

5. 環境変数の設定:
   - 「Environment Variables」セクションを展開
   - 以下の環境変数を追加:
     ```
     NEXT_PUBLIC_SUPABASE_URL = https://your-project-id.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
     ```
   - Environment: **Production**, **Preview**, **Development** 全てにチェック

6. 「Deploy」をクリック

7. デプロイ完了を待つ（通常2-3分）

8. デプロイURLを確認（例: `https://airport-shift-system.vercel.app`）

### オプション2: Vercel CLI

```bash
# Vercel CLIのインストール
npm i -g vercel

# Vercelにログイン
vercel login

# プロジェクトのデプロイ（初回は対話的に設定）
vercel

# プロダクションデプロイ
vercel --prod
```

環境変数の設定:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# 値を入力: https://your-project-id.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# 値を入力: your-anon-key-here
```

## 5. Supabase設定の更新

デプロイ後、SupabaseでVercelのURLを許可する必要があります。

1. [Supabase Dashboard](https://app.supabase.com/)にログイン
2. プロジェクトを選択
3. Authentication → URL Configuration に移動
4. 以下を設定:

   **Site URL**:
   ```
   https://your-app-name.vercel.app
   ```

   **Redirect URLs**:
   ```
   https://your-app-name.vercel.app/**
   https://your-app-name.vercel.app/auth/callback
   ```

5. 「Save」をクリック

## 6. デプロイ後の確認

### 6.1 基本動作確認

1. デプロイURLにアクセス
2. 以下を確認:
   - [ ] トップページが表示される
   - [ ] データベース接続が機能する（スタッフ一覧など）
   - [ ] 全てのページにアクセスできる
   - [ ] シフト作成機能が動作する
   - [ ] Excel/CSVエクスポートが動作する

### 6.2 パフォーマンス確認

Google Lighthouseで確認:

1. Chrome DevToolsを開く（F12）
2. Lighthouseタブを選択
3. 「Generate report」をクリック
4. スコアを確認（目標: 90以上）

### 6.3 エラー確認

Vercel Dashboardで確認:

1. Project → Logs タブ
2. エラーがないことを確認
3. もしエラーがあれば、該当箇所を修正してコミット＆push

## 7. 自動デプロイの設定

Vercelは自動的に以下の設定になります:

- **main ブランチ**: 自動プロダクションデプロイ
- **その他のブランチ**: プレビューデプロイ

これにより、`main`ブランチにpushすると自動的にプロダクション環境が更新されます。

```bash
# 変更をコミット
git add .
git commit -m "Update feature"

# mainブランチにpush（自動デプロイされる）
git push origin main
```

## 8. カスタムドメインの設定（オプション）

独自ドメインを使用する場合:

### 8.1 Vercel Dashboardで設定

1. Project Settings → Domains
2. カスタムドメインを入力（例: `shift.example.com`）
3. 「Add」をクリック

### 8.2 DNSレコードの設定

ドメインレジストラのDNS設定で以下を追加:

**Aレコードの場合**:
```
Type: A
Name: shift (または @)
Value: 76.76.21.21
```

**CNAMEの場合**:
```
Type: CNAME
Name: shift
Value: cname.vercel-dns.com
```

### 8.3 SSL証明書

Vercelが自動的にLet's Encrypt SSL証明書を発行・更新します。

## 9. モニタリング設定（オプション）

### 9.1 Vercel Analytics

```bash
npm install @vercel/analytics
```

`app/layout.tsx` に追加:

```typescript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

コミット＆push:

```bash
git add .
git commit -m "Add Vercel Analytics"
git push origin main
```

## 10. シードデータの投入

デプロイ後、初回のみシードデータを投入:

1. ブラウザで以下にアクセス:
   ```
   https://your-app-name.vercel.app/admin/seed
   ```

2. 「既存データをクリア」にチェック（初回のみ）

3. 「シードデータを投入」をクリック

4. 完了メッセージを確認

## 11. 本番データの準備

### 11.1 マスタデータの登録

1. 役職の登録: `/roles`
2. タグの登録: `/tags`
3. 配属箇所の登録: `/locations`
4. スタッフの登録: `/staff`
5. 配属箇所要件の設定

### 11.2 希望データのインポート

1. Excelファイルを準備
2. `/requests/import` でインポート

### 11.3 シフト作成

1. `/shifts/create` でシフトを作成
2. 制約チェックを確認
3. シフトを確定

## 12. バックアップ計画

### 12.1 Supabaseバックアップ

Supabase Dashboard → Database → Backups で自動バックアップを確認。

### 12.2 手動エクスポート

定期的にデータをエクスポート:

```sql
-- Supabase SQL Editorで実行
-- データのエクスポート（CSV形式）
```

## 13. トラブルシューティング

### ビルドエラーが発生する

```bash
# ローカルでビルドテスト
npm run build

# エラーメッセージを確認して修正
```

### 環境変数が反映されない

1. Vercel Dashboard → Project Settings → Environment Variables を確認
2. 環境変数を再入力
3. Redeploy

### データベース接続エラー

1. Supabase URLとKeyを確認
2. Supabaseの API Settings で制限を確認
3. Supabaseの Usage で制限を確認

### パフォーマンスが悪い

1. Vercel Analytics で分析
2. Next.js の動的インポートを活用
3. 画像最適化を確認

## 14. コスト管理

### Vercel 無料プラン

- **帯域幅**: 100 GB/月
- **ビルド時間**: 100時間/月
- **デプロイ**: 無制限
- **SSL**: 無料

### Supabase 無料プラン

- **データベース**: 500 MB
- **ストレージ**: 1 GB
- **月間アクティブユーザー**: 50,000

使用量が上限に近づいたら、有料プランへのアップグレードを検討。

## 15. 運用開始前チェックリスト

### デプロイ前
- [ ] 全ての機能が動作する
- [ ] ローカルでプロダクションビルドが成功する
- [ ] 環境変数が正しく設定されている
- [ ] .env.local が .gitignore に含まれている
- [ ] GitHubにpushされている

### デプロイ後
- [ ] Vercelデプロイが成功している
- [ ] サイトにアクセスできる
- [ ] データベース接続が機能する
- [ ] 全ての機能が動作する
- [ ] SSL証明書が有効
- [ ] パフォーマンスが良好（Lighthouse 90以上）

### 運用開始前
- [ ] シードデータまたは本番データが投入されている
- [ ] ユーザーマニュアルが作成されている
- [ ] トレーニングが実施されている
- [ ] バックアップ体制が確立されている
- [ ] サポート体制が確立されている

## 16. サポート情報

### Vercelドキュメント
- https://vercel.com/docs

### Next.jsドキュメント
- https://nextjs.org/docs

### Supabaseドキュメント
- https://supabase.com/docs

### 問題が発生した場合

1. Vercel Dashboardのログを確認
2. Supabase Dashboardの Usage を確認
3. ローカル環境で再現を試みる
4. GitHubのIssuesで報告

---

**デプロイ成功おめでとうございます！** 🎉
