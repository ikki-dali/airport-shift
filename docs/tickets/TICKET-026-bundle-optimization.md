# TICKET-026: バンドル最適化

## 担当
Infra

## 背景
- 本番提供に向けてページ読み込み速度を最適化
- 不要なバンドルサイズを削減
- Next.js 16のApp Router最適化機能を活用

## 要件

### 1. バンドル分析
- `@next/bundle-analyzer`導入
- 現在のバンドルサイズを計測・記録
- 大きなチャンクの特定

### 2. 動的インポート最適化
- ダイアログ/モーダルコンポーネントをdynamic importに
- カレンダー系コンポーネント（重い）をlazy load
- next/dynamicのssr: false活用

### 3. 画像最適化
- next/imageの適切な使用確認
- 未使用画像の削除
- favicon/OGP画像の最適化

### 4. フォント最適化
- next/fontの使用確認
- 不要なフォントウェイトの削除

## 完了条件
- [ ] bundle-analyzerが導入され、分析結果が確認できる
- [ ] First Load JSが各ページ200KB以下（目標）
- [ ] 動的インポートが適用されている
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告（分析結果スクショ含む）
