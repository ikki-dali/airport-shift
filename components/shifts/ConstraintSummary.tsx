'use client'

import { ConstraintViolation } from '@/lib/validators/shift-validator'

interface ConstraintSummaryProps {
  violations: ConstraintViolation[]
}

export function ConstraintSummary({ violations }: ConstraintSummaryProps) {
  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  if (violations.length === 0) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-medium text-green-900">制約違反なし（確定可能）</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-red-900">エラー: {errors.length}件</span>
          </div>
          <ul className="ml-7 space-y-1">
            {errors.map((error, index) => (
              <li key={index} className="text-sm text-red-800">
                {error.message}
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm font-medium text-red-900">
            ⚠️ エラーがあるため確定できません
          </p>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <svg className="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium text-yellow-900">警告: {warnings.length}件</span>
          </div>
          <ul className="ml-7 space-y-1">
            {warnings.map((warning, index) => (
              <li key={index} className="text-sm text-yellow-800">
                {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}


    </div>
  )
}
