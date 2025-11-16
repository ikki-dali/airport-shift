# TICKET-018: デプロイ・環境設定

## ステータス
📋 未着手

## 優先度
⭐⭐⭐⭐ 高

## 複雑度
Simple

## 概要
Vercelへのデプロイとプロダクション設定

## 成果物
- [ ] Vercelプロジェクト作成
- [ ] 環境変数設定
- [ ] プロダクションビルド確認
- [ ] ドメイン設定（オプション）
- [ ] デプロイメントドキュメント

## 依存関係
- TICKET-017: 初期データ投入・テスト

## デプロイ手順

### 1. Gitリポジトリの準備

```bash
# Gitリポジトリの初期化（まだの場合）
git init
git add .
git commit -m "Initial commit"

# GitHubリポジトリの作成とpush
git remote add origin https://github.com/your-username/airport-shift-dev.git
git branch -M main
git push -u origin main
```

### .gitignore の確認
```
# .gitignore
node_modules/
.next/
.env.local
.env*.local
.vercel
*.log
.DS_Store
```

### 2. Vercelプロジェクト作成

#### オプション1: Vercel CLI
```bash
# Vercel CLIのインストール
npm i -g vercel

# ログイン
vercel login

# プロジェクトのデプロイ
vercel

# プロダクションデプロイ
vercel --prod
```

#### オプション2: Vercel Dashboard
1. https://vercel.com にアクセス
2. "New Project" をクリック
3. GitHubリポジトリを選択
4. プロジェクト設定
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `npm run build`
   - Output Directory: `.next`
5. 環境変数を設定
6. "Deploy" をクリック

### 3. 環境変数の設定

Vercel Dashboardで以下の環境変数を設定:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

または、Vercel CLIで:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 4. Supabase設定の更新

Supabase Dashboardで以下を更新:

#### Site URL
```
https://your-app.vercel.app
```

#### Redirect URLs
```
https://your-app.vercel.app/**
https://your-app.vercel.app/auth/callback
```

### 5. ビルドの確認

ローカルでプロダクションビルドを確認:
```bash
npm run build
npm run start
```

ビルドエラーがないことを確認。

### 6. デプロイの確認

デプロイ後、以下を確認:
- [ ] サイトが正常に表示される
- [ ] データベース接続が機能する
- [ ] 認証が機能する（実装した場合）
- [ ] 全ての機能が正常に動作する

## プロダクション設定

### next.config.ts の最適化
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // プロダクション最適化
  reactStrictMode: true,

  // 画像最適化（必要な場合）
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },

  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
};

export default nextConfig;
```

### package.json の確認
```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## Vercel設定

### vercel.json（オプション）
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hnd1"]
}
```

### 自動デプロイの設定
- main/master ブランチへのpush → 自動プロダクションデプロイ
- その他のブランチ → プレビューデプロイ

## カスタムドメインの設定（オプション）

### Vercel Dashboard
1. Project Settings → Domains
2. カスタムドメインを入力
3. DNSレコードを設定
   - Aレコードまたはエイリアスレコード
   - Vercelが提供するIPアドレスまたはCNAMEを設定

### SSL証明書
Vercelが自動的にLet's Encrypt証明書を発行・更新

## モニタリング・ログ

### Vercel Analytics（オプション）
```bash
npm install @vercel/analytics
```

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### エラー追跡
Vercel Dashboardの Logs タブでエラーを確認

## パフォーマンス最適化

### 1. 動的インポート
```typescript
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <p>Loading...</p>,
})
```

### 2. 画像最適化
```typescript
import Image from 'next/image'

<Image
  src="/logo.png"
  alt="Logo"
  width={200}
  height={50}
  priority
/>
```

### 3. フォント最適化
```typescript
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  )
}
```

## バックアップ・復旧計画

### Supabaseバックアップ
- Supabase自動バックアップ（有料プラン）
- 手動エクスポート
  ```bash
  supabase db dump -f backup.sql
  ```

### データ復旧
```bash
supabase db push backup.sql
```

## デプロイメントドキュメント

### README.md 更新
```markdown
# シフト管理システム

## 環境構築

### 必要なツール
- Node.js 18以上
- npm 9以上

### セットアップ
\`\`\`bash
npm install
cp .env.local.example .env.local
# .env.local を編集してSupabase情報を入力
npm run dev
\`\`\`

### デプロイ
\`\`\`bash
npm run build
vercel --prod
\`\`\`

## 環境変数
- `NEXT_PUBLIC_SUPABASE_URL`: SupabaseプロジェクトURL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key

## プロダクションURL
https://your-app.vercel.app
```

## チェックリスト

### デプロイ前
- [ ] 全ての機能が動作する
- [ ] テストが通過する
- [ ] ビルドエラーがない
- [ ] 環境変数が設定されている
- [ ] .env.local が .gitignore に含まれている

### デプロイ後
- [ ] サイトにアクセスできる
- [ ] データベース接続が機能する
- [ ] 全ての機能が動作する
- [ ] SSL証明書が有効
- [ ] パフォーマンスが良好

### 運用開始前
- [ ] 本番データの準備
- [ ] ユーザーマニュアルの作成
- [ ] トレーニング実施
- [ ] バックアップ体制の確立

## トラブルシューティング

### ビルドエラー
```bash
# ローカルでビルドテスト
npm run build

# 詳細ログ
vercel --debug
```

### データベース接続エラー
- 環境変数の確認
- Supabase URLとKeyの確認
- SupabaseのAPI制限確認

### パフォーマンス問題
- Vercel Analytics で分析
- Lighthouse で診断
- Next.js Bundle Analyzer で確認

## コスト管理

### Vercel無料枠
- 100 GB帯域幅/月
- 無制限デプロイ
- 自動SSL

### Supabase無料枠
- 500MB データベース
- 1GB ファイルストレージ
- 50,000 月間アクティブユーザー

## 完了条件
- [ ] Vercelにデプロイ完了
- [ ] 環境変数が設定されている
- [ ] プロダクションビルドが成功
- [ ] 全ての機能が動作する
- [ ] デプロイメントドキュメントが作成されている

## 見積もり工数
2-3時間

## 開始予定日
2025-11-28

## 完了予定日
2025-11-28
