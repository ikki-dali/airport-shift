/**
 * AI自動割り当てで使用する型定義
 * 既存のaction型をre-exportして統一的に使用する
 */

import type { StaffWithRole } from '@/lib/actions/staff'
import type { DutyCode } from '@/lib/actions/duty-codes'
import type { Shift as ActionShift } from '@/lib/actions/shifts'
import type { Database } from '@/types/database'

// Re-export既存の型
export type { StaffWithRole, DutyCode }

// AI自動割り当て用の拡張Shift型（is_responsibleフィールドを含む、一部フィールドをオプショナルに）
export type Shift = Omit<ActionShift, 'status' | 'note' | 'created_by' | 'updated_by'> & {
  status?: string
  note?: string | null
  created_by?: string | null
  updated_by?: string | null
  is_responsible?: boolean
}

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
