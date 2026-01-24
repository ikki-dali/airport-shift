/**
 * 構造化ロガー
 * console.log/error を統一し、構造化されたJSON形式で出力する
 */

type LogLevel = 'error' | 'warn' | 'info'

interface LogContext {
  action?: string
  [key: string]: unknown
}

function formatLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown
) {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  }

  if (error instanceof Error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  } else if (error) {
    entry.error = error
  }

  return entry
}

export const logger = {
  error(message: string, context?: LogContext, error?: unknown) {
    console.error(JSON.stringify(formatLog('error', message, context, error)))
  },

  warn(message: string, context?: LogContext) {
    console.warn(JSON.stringify(formatLog('warn', message, context)))
  },

  info(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      console.log(JSON.stringify(formatLog('info', message, context)))
    }
  },
}
