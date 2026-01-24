# TICKET-023: Server Actions入力バリデーション強化

## 担当
Backend

## 背景
- 現在Server Actionsの入力検証が不十分
- フロントのフォームバリデーションのみに依存している箇所がある
- 直接APIを叩かれた場合にSQLインジェクションやXSSのリスク
- 本番運用にはサーバーサイドバリデーション必須

## 要件

### 1. Zodスキーマ定義（lib/validators/schemas.ts）
- 各エンティティの入力スキーマをZodで定義
- Staff: name(1-50文字), employee_id(optional, format), email(optional, email format)
- Location: name(1-100文字), required_staff(1-99)
- DutyCode: code(1-10文字), start_time/end_time(HH:mm format)
- Shift: staff_id(uuid), location_id(uuid), date(YYYY-MM-DD), duty_code_id(uuid)
- Tag: name(1-50文字)
- Role: name(1-50文字)

### 2. Server Actionsにバリデーション適用
- 全てのcreate/update Actionsの先頭でZodパース
- パース失敗時はValidationErrorをthrow
- エラーメッセージは日本語で（「名前は1〜50文字で入力してください」等）

### 3. XSS対策
- 文字列入力のサニタイズ（HTMLタグ除去）は不要（React側でエスケープ済み）
- ただしnoteフィールド等でscriptタグ混入を防ぐため、特殊文字のバリデーションは行う

## 注意事項
- Zodは既にpackage.jsonに含まれている（確認して、なければインストール）
- 既存のlib/validators/shift-validator.tsと共存する形で
- フロントのバリデーションは変更しない（二重チェック）

## 完了条件
- [ ] Zodスキーマが全エンティティ分定義されている
- [ ] 全create/update Actionsにバリデーション適用
- [ ] バリデーションエラー時にValidationErrorがthrowされる
- [ ] 既存テストがパス + バリデーションテスト追加
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
