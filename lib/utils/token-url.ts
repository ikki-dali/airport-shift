/**
 * トークンURLを生成するユーティリティ関数
 */
export function getTokenUrl(token: string): string {
  // クライアントサイドでは window.location.origin を使用
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/shift-request/${token}`
  }
  // サーバーサイドではフォールバック
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${baseUrl}/shift-request/${token}`
}
