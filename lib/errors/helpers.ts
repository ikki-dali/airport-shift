/**
 * エラーハンドリングユーティリティ
 */

import { AppError, DatabaseError, ValidationError } from './index'
import { logger } from './logger'

interface PostgrestError {
  code: string
  message: string
  details: string | null
  hint: string | null
}

/**
 * Supabase PostgrestError を DatabaseError に変換してthrowする
 * 既知のPGエラーコードをユーザーフレンドリーな日本語メッセージに変換
 */
export function handleSupabaseError(
  error: PostgrestError,
  context: { action: string; entity?: string }
): never {
  const entityName = context.entity || 'データ'

  logger.error(`Database error in ${context.action}`, { action: context.action, pgCode: error.code }, new Error(error.message))

  switch (error.code) {
    case '23505': // unique_violation
      throw new DatabaseError(`この${entityName}は既に登録されています`, {
        pgCode: error.code,
        cause: new Error(error.message),
        context: { action: context.action },
      })
    case '23503': // foreign_key_violation
      throw new DatabaseError(`関連する${entityName}が存在しないか、使用中のため操作できません`, {
        pgCode: error.code,
        cause: new Error(error.message),
        context: { action: context.action },
      })
    case '23502': // not_null_violation
      throw new ValidationError(`必須項目が入力されていません`, {
        action: context.action,
      })
    case '42501': // insufficient_privilege
      throw new DatabaseError('この操作を行う権限がありません', {
        pgCode: error.code,
        cause: new Error(error.message),
        context: { action: context.action },
      })
    default:
      throw new DatabaseError(`${entityName}の処理中にエラーが発生しました`, {
        pgCode: error.code,
        cause: new Error(error.message),
        context: { action: context.action },
      })
  }
}

/**
 * PostgrestError の型ガード
 */
export function isPostgrestError(error: unknown): error is PostgrestError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    'details' in error
  )
}

/**
 * エラーから安全なユーザー向けメッセージを抽出する
 * 内部エラー詳細は絶対に露出しない
 */
export function getSafeErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message
  }
  return '予期しないエラーが発生しました'
}
