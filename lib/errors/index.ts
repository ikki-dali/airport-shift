/**
 * カスタムエラークラス定義
 * アプリケーション全体で統一されたエラーハンドリングを実現する
 */

/**
 * 基底アプリケーションエラー
 */
export class AppError extends Error {
  public readonly code: string
  public readonly statusCode: number
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>

  constructor(
    message: string,
    options: {
      code?: string
      statusCode?: number
      isOperational?: boolean
      context?: Record<string, unknown>
      cause?: Error
    } = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.code = options.code || 'APP_ERROR'
    this.statusCode = options.statusCode || 500
    this.isOperational = options.isOperational ?? true
    this.context = options.context
    if (options.cause) this.cause = options.cause
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

/**
 * バリデーションエラー（ユーザー入力不正）
 */
export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, {
      code: 'VALIDATION_ERROR',
      statusCode: 400,
      isOperational: true,
      context,
    })
    this.name = 'ValidationError'
  }
}

/**
 * データベースエラー（Supabase/Postgres）
 */
export class DatabaseError extends AppError {
  public readonly pgCode?: string

  constructor(
    userMessage: string,
    options: {
      pgCode?: string
      cause?: Error
      context?: Record<string, unknown>
    } = {}
  ) {
    super(userMessage, {
      code: 'DATABASE_ERROR',
      statusCode: 500,
      isOperational: true,
      cause: options.cause,
      context: options.context,
    })
    this.name = 'DatabaseError'
    this.pgCode = options.pgCode
  }
}

/**
 * 外部APIエラー（OpenAI, Resend等）
 */
export class ExternalAPIError extends AppError {
  public readonly service: string

  constructor(
    service: string,
    userMessage: string,
    options: {
      cause?: Error
      context?: Record<string, unknown>
    } = {}
  ) {
    super(userMessage, {
      code: 'EXTERNAL_API_ERROR',
      statusCode: 502,
      isOperational: true,
      cause: options.cause,
      context: options.context,
    })
    this.name = 'ExternalAPIError'
    this.service = service
  }
}

/**
 * 認証・認可エラー（将来用）
 */
export class AuthError extends AppError {
  constructor(message: string = '認証エラーが発生しました') {
    super(message, {
      code: 'AUTH_ERROR',
      statusCode: 401,
      isOperational: true,
    })
    this.name = 'AuthError'
  }
}
