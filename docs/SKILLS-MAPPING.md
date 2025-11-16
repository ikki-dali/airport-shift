# スキルファイルとチケットのマッピング

このドキュメントでは、`skills/` フォルダ内の専門知識ファイルと各チケットの対応関係を示します。

---

## 📚 利用可能なスキルファイル

### 1. `skills/SKILL.md`
シフト管理システム全体の包括的ガイド
- プロジェクトセットアップ
- 技術スタック選定
- 主要機能の実装パターン
- 型安全性、楽観的更新、段階的な機能拡張の原則

### 2. `skills/nextjs-app-router.md`
Next.js 14 App Routerのベストプラクティス
- App Routerのファイル構造
- Server Components vs Client Components
- Server Actions
- データフェッチング戦略

### 3. `skills/supabase-patterns.md`
Supabaseとの統合パターン
- データベーススキーマ設計
- Row Level Security (RLS)
- TypeScript型生成
- リアルタイムサブスクリプション
- 楽観的更新

### 4. `skills/calendar-ui.md`
カレンダーUIの実装パターン
- react-big-calendar / FullCalendar
- 月/週/日表示の切り替え
- シフトセルのレンダリング
- レスポンシブデザイン

### 5. `skills/drag-and-drop.md`
ドラッグ&ドロップの実装
- @dnd-kit/coreのセットアップ
- ドラッグ可能なコンポーネント
- ドロップゾーン
- 衝突検知
- 視覚的フィードバック

---

## 🎯 チケットとスキルの対応表

| チケット | 主要スキル | 参照セクション |
|---------|-----------|---------------|
| **TICKET-001**: プロジェクト基盤 | `SKILL.md`, `nextjs-app-router.md` | Project Setup, Tech Stack |
| **TICKET-002**: データベーススキーマ | `supabase-patterns.md` | Database Schema, RLS, Type Generation |
| **TICKET-003**: 役職・タグ管理 | `nextjs-app-router.md`, `supabase-patterns.md` | CRUD Patterns, Server Actions |
| **TICKET-004**: 勤務記号管理 | `nextjs-app-router.md`, `supabase-patterns.md` | CRUD Patterns, Server Actions |
| **TICKET-005**: スタッフ管理 | `nextjs-app-router.md`, `supabase-patterns.md` | CRUD Patterns, Filtering, Search |
| **TICKET-006**: 配属箇所管理 | `nextjs-app-router.md`, `supabase-patterns.md` | Complex CRUD, Nested Data |
| **TICKET-007**: Excel取り込み | `nextjs-app-router.md` | File Upload, Server Actions |
| **TICKET-008**: 希望データ表示 | `calendar-ui.md` | Calendar View, Data Visualization |
| **TICKET-009**: シフト作成UI | `calendar-ui.md`, `SKILL.md` | Calendar Interface, State Management |
| **TICKET-010**: ドラッグ&ドロップ | `drag-and-drop.md`, `SKILL.md` | @dnd-kit, Shift Assignment Flow |
| **TICKET-011**: 制約チェック | `SKILL.md` | Real-Time Constraint Checking, Validation |
| **TICKET-012**: バリデーション強化 | `SKILL.md` | Constraint Checking Pattern |
| **TICKET-013**: Excel/CSV出力 | `nextjs-app-router.md` | API Routes, File Generation |
| **TICKET-014**: 履歴管理 | `supabase-patterns.md` | Database Triggers, Audit Logs |
| **TICKET-015**: シフト確定 | `supabase-patterns.md`, `SKILL.md` | State Management, Validation |
| **TICKET-016**: 認証 | `supabase-patterns.md` | Supabase Auth, RLS |
| **TICKET-017**: テスト | 全て | Integration Testing |
| **TICKET-018**: デプロイ | `nextjs-app-router.md` | Production Build, Environment |

---

## 📖 推奨読書順序

### Phase 1-2 着手前（基盤・マスタ管理）
1. `SKILL.md` - 全体像の把握
2. `nextjs-app-router.md` - App Routerの理解
3. `supabase-patterns.md` - データベース統合

### Phase 3 着手前（希望管理）
4. `calendar-ui.md` - カレンダーUIの理解

### Phase 4 着手前（シフト作成）
5. `drag-and-drop.md` - D&D実装の理解
6. `SKILL.md` 再読 - Shift Assignment Flow、Constraint Checking

---

## 🔧 各チケット実装時の参照方法

### TICKET-002: データベーススキーマ構築
**読むべきスキル**: `supabase-patterns.md`
```markdown
参照セクション:
- Database Schema Setup
- Row Level Security (RLS)
- TypeScript Type Generation
- Migration Patterns

実装時のポイント:
- スキーマ設計のベストプラクティス
- RLS設定のパターン
- 型安全性の確保
```

### TICKET-009: シフト作成画面 - 基本UI
**読むべきスキル**: `calendar-ui.md`, `SKILL.md`
```markdown
参照セクション:
calendar-ui.md:
- Calendar Component Setup
- Month/Week/Day Views
- Custom Event Rendering

SKILL.md:
- Calendar-Based Shift View
- State Management Pattern

実装時のポイント:
- カレンダーライブラリの選定
- レスポンシブデザイン
- Zustandでの状態管理
```

### TICKET-010: ドラッグ&ドロップ実装
**読むべきスキル**: `drag-and-drop.md`, `SKILL.md`
```markdown
参照セクション:
drag-and-drop.md:
- @dnd-kit Setup
- Draggable Components
- Droppable Zones
- Visual Feedback

SKILL.md:
- Shift Assignment Flow
- Optimistic Updates

実装時のポイント:
- @dnd-kit/coreの設定
- ドラッグ中の視覚的フィードバック
- 楽観的更新の実装
```

### TICKET-011: 制約チェック
**読むべきスキル**: `SKILL.md`
```markdown
参照セクション:
- Real-Time Constraint Checking
- Constraint Checking Pattern
- Validation Hooks

実装時のポイント:
- クライアント側バリデーション
- リアルタイムチェック
- 違反の可視化
```

---

## 💡 スキルファイル活用のベストプラクティス

### 1. チケット着手前に該当スキルを読む
各チケットに取り組む前に、対応するスキルファイルを確認し、推奨パターンを理解してから実装を開始する。

### 2. コード例を参考にする
スキルファイルに含まれるコード例をベースに、プロジェクト固有の要件に合わせてカスタマイズする。

### 3. 原則に従う
- **型安全性第一**: TypeScript strict mode
- **楽観的更新**: UXの向上
- **段階的機能拡張**: 基本 → 高度な機能
- **モバイルファースト**: レスポンシブデザイン

### 4. パターンを再利用する
スキルファイルで紹介されているパターン（Shift Assignment Flow、Constraint Checkingなど）を一貫して使用する。

---

## 🚀 実装開始時のチェックリスト

### チケット着手前
- [ ] 該当するスキルファイルを読んだ
- [ ] 推奨パターンを理解した
- [ ] コード例を確認した
- [ ] 依存関係を確認した

### 実装中
- [ ] スキルファイルのベストプラクティスに従っている
- [ ] 型安全性が保たれている
- [ ] 必要に応じてスキルファイルを参照している

### 実装完了後
- [ ] パターンに沿った実装になっているか確認
- [ ] 次のチケットで参照すべきスキルを確認

---

**最終更新**: 2025-11-15
**関連ドキュメント**:
- [プロジェクトロードマップ](./PROJECT-ROADMAP.md)
- [チケット一覧](./tickets/README.md)
