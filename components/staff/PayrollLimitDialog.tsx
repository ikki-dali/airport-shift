'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { upsertStaffPayrollSetting } from '@/lib/actions/staff-payroll-settings'
import { LIMIT_TYPE_LABELS, type LimitType, PAYROLL_LIMITS } from '@/lib/payroll/calculator'
import { Loader2 } from 'lucide-react'

interface PayrollLimitDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffId: string
  staffName: string
  currentSetting?: {
    limit_type: LimitType
    target_limit: number
    custom_note: string | null
    warning_threshold_percent: number
    caution_threshold_percent: number
  }
}

export function PayrollLimitDialog({
  open,
  onOpenChange,
  staffId,
  staffName,
  currentSetting,
}: PayrollLimitDialogProps) {
  const [limitType, setLimitType] = useState<LimitType>(
    currentSetting?.limit_type || 'tax_dependent_103'
  )
  const [customAmount, setCustomAmount] = useState(
    limitType === 'custom' ? currentSetting?.target_limit || 1030000 : 1030000
  )
  const [customNote, setCustomNote] = useState(currentSetting?.custom_note || '')
  const [warningPercent, setWarningPercent] = useState(
    currentSetting?.warning_threshold_percent || 85
  )
  const [cautionPercent, setCautionPercent] = useState(
    currentSetting?.caution_threshold_percent || 75
  )
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)

    try {
      await upsertStaffPayrollSetting({
        staffId,
        limitType,
        customAmount: limitType === 'custom' ? customAmount : undefined,
        customNote: customNote || undefined,
        warningThresholdPercent: warningPercent,
        cautionThresholdPercent: cautionPercent,
      })

      onOpenChange(false)
      window.location.reload() // 簡易的にリロード
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の保存に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const currentLimit =
    limitType === 'custom'
      ? customAmount
      : limitType === 'tax_dependent_103'
      ? PAYROLL_LIMITS.TAX_DEPENDENT_103
      : limitType === 'insurance_106'
      ? PAYROLL_LIMITS.INSURANCE_106
      : limitType === 'insurance_130'
      ? PAYROLL_LIMITS.INSURANCE_130
      : PAYROLL_LIMITS.SPOUSE_150

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{staffName}さんの給与上限設定</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 上限タイプ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              目標上限額
            </label>
            <select
              value={limitType}
              onChange={(e) => setLimitType(e.target.value as LimitType)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="tax_dependent_103">{LIMIT_TYPE_LABELS.tax_dependent_103}</option>
              <option value="insurance_106">{LIMIT_TYPE_LABELS.insurance_106}</option>
              <option value="insurance_130">{LIMIT_TYPE_LABELS.insurance_130}</option>
              <option value="spouse_150">{LIMIT_TYPE_LABELS.spouse_150}</option>
              <option value="custom">{LIMIT_TYPE_LABELS.custom}</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              現在の上限額: {(currentLimit / 10000).toFixed(0)}万円
            </p>
          </div>

          {/* カスタム金額入力 */}
          {limitType === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カスタム上限額（円）
              </label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(parseInt(e.target.value) || 0)}
                step="10000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}

          {/* 備考 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              備考（任意）
            </label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="例: 扶養内で働きたい"
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          {/* アラート閾値設定 */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-sm font-medium text-gray-700">アラート設定</h3>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                警告レベル（{warningPercent}%以上で🟠警告）
              </label>
              <input
                type="range"
                min="70"
                max="95"
                step="5"
                value={warningPercent}
                onChange={(e) => setWarningPercent(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                {((currentLimit * warningPercent) / 1000000).toFixed(1)}万円以上で警告
              </p>
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                注意レベル（{cautionPercent}%以上で⚠️注意）
              </label>
              <input
                type="range"
                min="60"
                max="85"
                step="5"
                value={cautionPercent}
                onChange={(e) => setCautionPercent(parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500">
                {((currentLimit * cautionPercent) / 1000000).toFixed(1)}万円以上で注意
              </p>
            </div>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            キャンセル
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
