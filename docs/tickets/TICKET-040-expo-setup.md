# TICKET-040: Expoアプリ 別リポジトリ初期セットアップ

## 担当
Frontend

## 概要
バイト向けのモバイルアプリをExpo（React Native）で新規作成する。
別リポジトリとして `airport-shift-mobile` を作成。

## リポジトリ
- 新規作成: `ikki-dali/airport-shift-mobile`

## 技術スタック
- Expo (SDK 52+)
- React Native
- TypeScript
- Supabase（現状のバックエンドを流用）
- Expo Router（ファイルベースルーティング）

## 初期セットアップ内容

### 1. プロジェクト作成
```bash
npx create-expo-app@latest airport-shift-mobile --template tabs
```

### 2. 必要なパッケージ追加
- @supabase/supabase-js
- expo-secure-store（認証トークン保存）
- date-fns（日付処理）

### 3. 基本構成
```
airport-shift-mobile/
├── app/                    # Expo Router
│   ├── (tabs)/
│   │   ├── index.tsx      # ホーム（確定シフト一覧）
│   │   ├── request.tsx    # シフト希望送信
│   │   └── recruit.tsx    # 募集一覧
│   └── _layout.tsx
├── src/
│   ├── components/        # UIコンポーネント
│   ├── lib/
│   │   └── supabase.ts   # Supabaseクライアント
│   └── types/            # 型定義
├── .env.example
└── README.md
```

### 4. Supabase連携
- 既存のSupabaseプロジェクトに接続
- 環境変数設定（EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY）

### 5. 基本画面（プレースホルダー）
- ホームタブ: 「確定シフト一覧（準備中）」
- リクエストタブ: 「シフト希望送信（準備中）」
- 募集タブ: 「募集一覧（準備中）」

## 完了条件
- [ ] GitHubリポジトリ `airport-shift-mobile` が作成されている
- [ ] Expoプロジェクトが初期化されている
- [ ] Supabaseクライアントが設定されている
- [ ] 3つのタブ（ホーム、リクエスト、募集）がある
- [ ] `npx expo start` で起動できる
- [ ] README.mdにセットアップ手順が書かれている

## 備考
- 認証は後回し（今回のサンプルでは未実装でOK）
- UIは最低限でOK、次のチケットで作り込む
