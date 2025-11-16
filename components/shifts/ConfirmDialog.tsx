'use client'

import { useState } from 'react'
import { ConstraintSummary } from './ConstraintSummary'
import { ConstraintViolation } from '@/lib/validators/shift-validator'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  targetDescription: string
  shiftCount: number
  violations: ConstraintViolation[]
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  targetDescription,
  shiftCount,
  violations,
  isLoading = false,
}: ConfirmDialogProps) {
  const errors = violations.filter((v) => v.severity === 'error')
  const warnings = violations.filter((v) => v.severity === 'warning')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-bold">{title}</h2>

        <div className="mb-4 space-y-2">
          <p className="text-sm text-gray-600">
            対象: <span className="font-medium text-gray-900">{targetDescription}</span>
          </p>
          <p className="text-sm text-gray-600">
            件数: <span className="font-medium text-gray-900">{shiftCount}件</span>
          </p>
        </div>

        <div className="mb-6">
          <h3 className="mb-2 font-medium">制約チェック結果</h3>
          <ConstraintSummary violations={violations} />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            キャンセル
          </button>
          {errors.length === 0 && (
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? '処理中...' : warnings.length > 0 ? '警告を無視して確定' : '確定する'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
