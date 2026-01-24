/**
 * インメモリ Sliding Window レート制限
 *
 * 注意:
 * - Vercel Serverless環境ではインスタンス間でメモリ共有不可
 * - 完璧なレート制限にはRedis等が必要（将来対応）
 * - MVP段階ではインメモリで十分（同一インスタンス内での制限）
 */

import { headers } from 'next/headers'
import { AppError } from '@/lib/errors'

interface RateLimitEntry {
  timestamps: number[]
}

interface RateLimiterConfig {
  /** ウィンドウ期間（ミリ秒） */
  interval: number
  /** ウィンドウ内の最大リクエスト数 */
  limit: number
  /** エラーメッセージ */
  message?: string
}

/**
 * Sliding Window レートリミッター
 */
export class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map()
  private config: Required<RateLimiterConfig>
  private cleanupTimer: ReturnType<typeof setInterval> | null = null

  constructor(config: RateLimiterConfig) {
    this.config = {
      interval: config.interval,
      limit: config.limit,
      message: config.message || 'リクエスト回数の上限に達しました。しばらく待ってから再試行してください。',
    }

    // メモリリーク防止: 5分ごとに期限切れエントリをクリーンアップ
    this.cleanupTimer = setInterval(() => this.cleanup(), 5 * 60 * 1000)

    // Node.jsプロセス終了時にタイマー解放（テスト時のハングアップ防止）
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref()
    }
  }

  /**
   * リクエストを記録し、レート制限を超えていないかチェック
   * @returns { success: true } or throws AppError
   */
  check(key: string): { success: true; remaining: number } {
    const now = Date.now()
    const windowStart = now - this.config.interval

    const entry = this.store.get(key)

    if (!entry) {
      // 新規エントリ
      this.store.set(key, { timestamps: [now] })
      return { success: true, remaining: this.config.limit - 1 }
    }

    // ウィンドウ外のタイムスタンプを除去（sliding window）
    entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)

    if (entry.timestamps.length >= this.config.limit) {
      throw new AppError(this.config.message, {
        code: 'RATE_LIMIT_EXCEEDED',
        statusCode: 429,
        isOperational: true,
        context: { key, limit: this.config.limit, interval: this.config.interval },
      })
    }

    // 新しいタイムスタンプを追加
    entry.timestamps.push(now)
    return { success: true, remaining: this.config.limit - entry.timestamps.length }
  }

  /**
   * 期限切れエントリをクリーンアップ
   */
  cleanup(): void {
    const now = Date.now()
    const windowStart = now - this.config.interval

    for (const [key, entry] of this.store.entries()) {
      entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)
      if (entry.timestamps.length === 0) {
        this.store.delete(key)
      }
    }
  }

  /**
   * テスト用: ストアをリセット
   */
  reset(): void {
    this.store.clear()
  }

  /**
   * テスト用: タイマーを停止
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }
  }

  /**
   * 現在のエントリ数を取得（テスト・デバッグ用）
   */
  get size(): number {
    return this.store.size
  }
}

// ========================================
// プリセットのレートリミッター
// ========================================

/** ログイン用: 同一IPから5回/分 */
export const loginRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1分
  limit: 5,
  message: 'ログイン試行回数が上限に達しました。しばらく待ってから再試行してください。',
})

/** 書き込み操作用: 同一IPから30回/分 */
export const writeRateLimiter = new RateLimiter({
  interval: 60 * 1000, // 1分
  limit: 30,
  message: 'リクエスト回数の上限に達しました。しばらく待ってから再試行してください。',
})

// ========================================
// ヘルパー
// ========================================

/**
 * リクエストヘッダーからIPアドレスを取得
 * Vercel/Cloudflare環境ではx-forwarded-forヘッダーを使用
 */
export async function getClientIp(): Promise<string> {
  const headersList = await headers()
  const forwarded = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')

  if (forwarded) {
    // x-forwarded-for は "client, proxy1, proxy2" 形式
    return forwarded.split(',')[0].trim()
  }

  if (realIp) {
    return realIp.trim()
  }

  return 'unknown'
}

/**
 * レート制限チェック（IPベース）
 * Server Action内で使用
 */
export async function checkRateLimit(limiter: RateLimiter): Promise<void> {
  const ip = await getClientIp()
  limiter.check(ip)
}
