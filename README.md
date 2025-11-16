# 空港シフト管理システム

空港スタッフのシフト作成・管理を効率化するWebアプリケーション

## 主な機能

### ✨ シフト管理
- **ドラッグ&ドロップ**でシフトを直感的に作成
- カレンダー表示とリスト表示の切り替え
- シフト希望の表示と考慮
- 制約チェック（連続勤務、休日など）

### 🤖 AI自動割り当て
- スタッフの希望とスキルを考慮した最適なシフト配置
- 配属箇所の要件を自動的に満たす
- 勤務日数の公平性を確保

### 💰 給与計算
- 月次給与の自動計算
- 深夜手当の自動計算
- 年間給与上限の管理（103万円・130万円など）
- 給与上限のアラート機能

### 📊 Excel連携
- シフト希望のExcelインポート
- シフト表のExcel/CSVエクスポート

## 技術スタック

- **フロントエンド**: Next.js 16.0.3 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **データベース**: Supabase (PostgreSQL)
- **ドラッグ&ドロップ**: @dnd-kit
- **日付処理**: date-fns
- **Excel処理**: exceljs

## セットアップ

### 必要な環境
- Node.js 18以上
- npm または yarn

### インストール

```bash
# リポジトリをクローン
git clone https://github.com/ikki-dali/airport-shift.git
cd airport-shift

# 依存関係をインストール
npm install
```

### 環境変数の設定

`.env.local`ファイルを作成し、以下を設定：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### データベースのセットアップ

Supabaseプロジェクトで以下のマイグレーションを実行：

```bash
# supabase/migrations/ 内のSQLファイルを順番に実行
```

### 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

## プロジェクト構成

```
├── app/                    # Next.js App Router
│   ├── shifts/            # シフト管理画面
│   ├── staff/             # スタッフ管理
│   ├── locations/         # 配属箇所管理
│   ├── requests/          # 希望提出
│   └── payroll/           # 給与管理
├── components/            # Reactコンポーネント
├── lib/
│   ├── actions/          # Server Actions
│   ├── ai/               # AI自動割り当てロジック
│   ├── parsers/          # Excelパーサー
│   └── validators/       # バリデーション
├── supabase/
│   └── migrations/       # データベースマイグレーション
└── types/                # TypeScript型定義
```

## 主な画面

- **ホーム** - ダッシュボード
- **シフト作成** - ドラッグ&ドロップでシフトを作成
- **シフト一覧** - シフトの確認と確定
- **スタッフ管理** - スタッフ情報の登録・編集
- **配属箇所管理** - 配属箇所と要件の設定
- **希望提出** - Excelからの希望インポート
- **給与管理** - 給与計算と上限管理

## 解決済みの問題

### エラーコード 22008
- **原因**: PostgreSQLのdatetime field overflowエラー
- **解決**:
  - `created_at`/`updated_at`の不要な明示的設定を削除
  - 月末日の計算を`endOfMonth()`で修正

### Google Fontsエラー
- **原因**: 古い`@next/font`パッケージの使用
- **解決**: パッケージを削除し、Next.js組み込みのフォント機能を使用

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！

## 開発者

🤖 Claude Codeの支援により開発
