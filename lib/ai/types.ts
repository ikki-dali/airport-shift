/**
 * AI自動割り当てで使用する型定義
 * 既存のaction型をre-exportして統一的に使用する
 */

import type { StaffWithRole } from '@/lib/actions/staff'
import type { DutyCode } from '@/lib/actions/duty-codes'
import type { Shift } from '@/lib/actions/shifts'
import type { Database } from '@/types/database'

// Re-export既存の型
export type { StaffWithRole, DutyCode, Shift }

// ShiftRequest型 - shift-requests.tsから
export type ShiftRequest = Database['public']['Tables']['shift_requests']['Row'] & {
  staff: {
    id: string
    employee_number: string
    name: string
  }
}

// 拡張型を追加
export type StaffWithRoleExtended = StaffWithRole & {
  is_responsible: boolean  // roles.is_responsibleから計算
  tags: string[]          // staff.tagsを保証
}
