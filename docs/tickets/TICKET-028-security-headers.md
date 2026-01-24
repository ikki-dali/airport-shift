# TICKET-028: セキュリティヘッダー設定

## 担当
Infra

## 背景
- 本番運用に向けてブラウザセキュリティヘッダーが必要
- XSS、クリックジャッキング、MIMEスニッフィング等の対策
- Next.jsのnext.config.tsで設定可能

## 要件

### next.config.tsにheaders設定追加
```typescript
headers: async () => [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ],
  },
]
```

## 注意事項
- Content-Security-Policy(CSP)は複雑なので今回は見送り（shadcn/uiのinline styleと競合する可能性）
- Strict-Transport-Security(HSTS)はVercelが自動設定するため不要
- ヘッダー追加のみ、既存機能への影響なし

## 完了条件
- [ ] セキュリティヘッダーが設定されている
- [ ] `npm run build`が成功
- [ ] PRを作成してURL報告
