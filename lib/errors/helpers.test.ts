import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleSupabaseError, isPostgrestError, getSafeErrorMessage } from './helpers'
import { DatabaseError, ValidationError, AppError } from './index'

// loggerをモック
vi.mock('./logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}))

describe('errors/helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleSupabaseError', () => {
    it('23505 (unique_violation) → DatabaseError「既に登録されています」', () => {
      const error = { code: '23505', message: 'duplicate key', details: null, hint: null }
      expect(() =>
        handleSupabaseError(error, { action: 'createStaff', entity: 'スタッフ' })
      ).toThrow(DatabaseError)

      try {
        handleSupabaseError(error, { action: 'createStaff', entity: 'スタッフ' })
      } catch (e) {
        expect(e).toBeInstanceOf(DatabaseError)
        expect((e as DatabaseError).message).toContain('スタッフ')
        expect((e as DatabaseError).message).toContain('既に登録')
        expect((e as DatabaseError).pgCode).toBe('23505')
      }
    })

    it('23503 (foreign_key_violation) → DatabaseError「存在しないか、使用中」', () => {
      const error = { code: '23503', message: 'foreign key violation', details: null, hint: null }
      expect(() =>
        handleSupabaseError(error, { action: 'deleteLocation', entity: '配置箇所' })
      ).toThrow(DatabaseError)

      try {
        handleSupabaseError(error, { action: 'deleteLocation', entity: '配置箇所' })
      } catch (e) {
        expect(e).toBeInstanceOf(DatabaseError)
        expect((e as DatabaseError).message).toContain('配置箇所')
        expect((e as DatabaseError).message).toContain('存在しない')
      }
    })

    it('23502 (not_null_violation) → ValidationError「必須項目」', () => {
      const error = { code: '23502', message: 'null value', details: null, hint: null }
      expect(() =>
        handleSupabaseError(error, { action: 'createShift' })
      ).toThrow(ValidationError)

      try {
        handleSupabaseError(error, { action: 'createShift' })
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError)
        expect((e as ValidationError).message).toContain('必須項目')
      }
    })

    it('42501 (insufficient_privilege) → DatabaseError「権限がありません」', () => {
      const error = { code: '42501', message: 'permission denied', details: null, hint: null }
      expect(() =>
        handleSupabaseError(error, { action: 'deleteStaff' })
      ).toThrow(DatabaseError)

      try {
        handleSupabaseError(error, { action: 'deleteStaff' })
      } catch (e) {
        expect(e).toBeInstanceOf(DatabaseError)
        expect((e as DatabaseError).message).toContain('権限')
      }
    })

    it('未知のエラーコード → DatabaseError「処理中にエラーが発生」', () => {
      const error = { code: '99999', message: 'unknown error', details: null, hint: null }
      expect(() =>
        handleSupabaseError(error, { action: 'unknownAction', entity: 'データ' })
      ).toThrow(DatabaseError)

      try {
        handleSupabaseError(error, { action: 'unknownAction', entity: 'データ' })
      } catch (e) {
        expect(e).toBeInstanceOf(DatabaseError)
        expect((e as DatabaseError).message).toContain('エラーが発生')
      }
    })

    it('entityが未指定の場合「データ」をデフォルトとして使用', () => {
      const error = { code: '23505', message: 'dup', details: null, hint: null }
      try {
        handleSupabaseError(error, { action: 'create' })
      } catch (e) {
        expect((e as DatabaseError).message).toContain('データ')
      }
    })
  })

  describe('isPostgrestError', () => {
    it('正しいPostgrestErrorオブジェクトを検知する', () => {
      const error = { code: '23505', message: 'dup', details: null, hint: null }
      expect(isPostgrestError(error)).toBe(true)
    })

    it('nullはfalse', () => {
      expect(isPostgrestError(null)).toBe(false)
    })

    it('undefinedはfalse', () => {
      expect(isPostgrestError(undefined)).toBe(false)
    })

    it('文字列はfalse', () => {
      expect(isPostgrestError('error')).toBe(false)
    })

    it('codeがないオブジェクトはfalse', () => {
      expect(isPostgrestError({ message: 'err', details: null })).toBe(false)
    })

    it('messageがないオブジェクトはfalse', () => {
      expect(isPostgrestError({ code: '23505', details: null })).toBe(false)
    })

    it('detailsがないオブジェクトはfalse', () => {
      expect(isPostgrestError({ code: '23505', message: 'err' })).toBe(false)
    })
  })

  describe('getSafeErrorMessage', () => {
    it('AppErrorはそのmessageを返す', () => {
      const error = new AppError('カスタムエラー')
      expect(getSafeErrorMessage(error)).toBe('カスタムエラー')
    })

    it('DatabaseErrorはそのmessageを返す', () => {
      const error = new DatabaseError('DB障害')
      expect(getSafeErrorMessage(error)).toBe('DB障害')
    })

    it('ValidationErrorはそのmessageを返す', () => {
      const error = new ValidationError('入力エラー')
      expect(getSafeErrorMessage(error)).toBe('入力エラー')
    })

    it('通常のErrorは汎用メッセージを返す', () => {
      const error = new Error('内部エラー詳細')
      expect(getSafeErrorMessage(error)).toBe('予期しないエラーが発生しました')
    })

    it('文字列は汎用メッセージを返す', () => {
      expect(getSafeErrorMessage('some error')).toBe('予期しないエラーが発生しました')
    })

    it('nullは汎用メッセージを返す', () => {
      expect(getSafeErrorMessage(null)).toBe('予期しないエラーが発生しました')
    })
  })
})
