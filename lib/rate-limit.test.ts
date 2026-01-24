import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RateLimiter } from './rate-limit'

describe('RateLimiter', () => {
  let limiter: RateLimiter

  beforeEach(() => {
    limiter = new RateLimiter({
      interval: 60000, // 1分
      limit: 5,
      message: 'テスト: 上限到達',
    })
  })

  afterEach(() => {
    limiter.destroy()
  })

  describe('check()', () => {
    it('制限内ではsuccessを返す', () => {
      const result = limiter.check('ip-1')
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('5回まではsuccessを返す', () => {
      for (let i = 0; i < 5; i++) {
        const result = limiter.check('ip-1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('6回目でAppErrorをthrowする', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('ip-1')
      }

      expect(() => limiter.check('ip-1')).toThrow('テスト: 上限到達')
    })

    it('エラーにRATE_LIMIT_EXCEEDEDコードが含まれる', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('ip-1')
      }

      try {
        limiter.check('ip-1')
      } catch (e: unknown) {
        expect((e as { code?: string }).code).toBe('RATE_LIMIT_EXCEEDED')
      }
    })

    it('異なるキーは独立にカウントされる', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('ip-1')
      }

      // ip-2は別カウント
      const result = limiter.check('ip-2')
      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('ウィンドウ経過後はカウントがリセットされる', () => {
      vi.useFakeTimers()

      try {
        // 5回使い切る
        for (let i = 0; i < 5; i++) {
          limiter.check('ip-1')
        }
        expect(() => limiter.check('ip-1')).toThrow()

        // 1分経過
        vi.advanceTimersByTime(60001)

        // リセットされている
        const result = limiter.check('ip-1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(4)
      } finally {
        vi.useRealTimers()
      }
    })

    it('sliding windowで古いタイムスタンプのみ除去される', () => {
      vi.useFakeTimers()

      try {
        // 3回リクエスト
        for (let i = 0; i < 3; i++) {
          limiter.check('ip-1')
        }

        // 30秒経過
        vi.advanceTimersByTime(30000)

        // さらに2回（合計5回、ウィンドウ内は5回）
        limiter.check('ip-1')
        limiter.check('ip-1')

        // 6回目は拒否
        expect(() => limiter.check('ip-1')).toThrow()

        // さらに31秒経過（最初の3回がウィンドウ外に）
        vi.advanceTimersByTime(31000)

        // 最初の3回がスライドアウト、残り2回のみカウント
        const result = limiter.check('ip-1')
        expect(result.success).toBe(true)
        expect(result.remaining).toBe(2) // limit(5) - 2(残存) - 1(今回) = 2
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('cleanup()', () => {
    it('期限切れエントリが削除される', () => {
      vi.useFakeTimers()

      try {
        limiter.check('ip-1')
        limiter.check('ip-2')
        expect(limiter.size).toBe(2)

        // 1分経過
        vi.advanceTimersByTime(60001)

        limiter.cleanup()
        expect(limiter.size).toBe(0)
      } finally {
        vi.useRealTimers()
      }
    })

    it('有効なエントリは残る', () => {
      vi.useFakeTimers()

      try {
        limiter.check('ip-1')

        vi.advanceTimersByTime(30000)

        limiter.check('ip-2')

        vi.advanceTimersByTime(31000) // ip-1は期限切れ、ip-2は有効

        limiter.cleanup()
        expect(limiter.size).toBe(1)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('reset()', () => {
    it('全エントリがクリアされる', () => {
      limiter.check('ip-1')
      limiter.check('ip-2')
      limiter.check('ip-3')
      expect(limiter.size).toBe(3)

      limiter.reset()
      expect(limiter.size).toBe(0)
    })

    it('リセット後は再度リクエスト可能', () => {
      for (let i = 0; i < 5; i++) {
        limiter.check('ip-1')
      }
      expect(() => limiter.check('ip-1')).toThrow()

      limiter.reset()

      const result = limiter.check('ip-1')
      expect(result.success).toBe(true)
    })
  })

  describe('カスタム設定', () => {
    it('limit=1で1回目から2回目で拒否', () => {
      const strict = new RateLimiter({ interval: 60000, limit: 1 })
      try {
        strict.check('ip-1')
        expect(() => strict.check('ip-1')).toThrow()
      } finally {
        strict.destroy()
      }
    })

    it('interval=0で即座にリセット', () => {
      const instant = new RateLimiter({ interval: 0, limit: 1 })
      try {
        instant.check('ip-1')
        // interval=0のため全タイムスタンプが即座に期限切れ
        const result = instant.check('ip-1')
        expect(result.success).toBe(true)
      } finally {
        instant.destroy()
      }
    })

    it('デフォルトメッセージが使用される', () => {
      const defaultMsg = new RateLimiter({ interval: 60000, limit: 1 })
      try {
        defaultMsg.check('ip-1')
        expect(() => defaultMsg.check('ip-1')).toThrow('リクエスト回数の上限に達しました')
      } finally {
        defaultMsg.destroy()
      }
    })
  })
})
