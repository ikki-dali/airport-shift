import { describe, it, expect } from 'vitest'
import {
  checkDuplicateStaffShift,
  checkLocationStaffCount,
  checkRequiredTags,
  validateNewShift,
  checkResponsibleStaff,
} from './shift-constraints'
import type { Shift } from './actions/shifts'

// テスト用ヘルパー: 最小限のShiftオブジェクトを生成
function createShift(overrides: Partial<Shift> = {}): Shift {
  return {
    id: 'shift-1',
    staff_id: 'staff-1',
    location_id: 'loc-1',
    duty_code_id: 'dc-1',
    date: '2025-01-15',
    status: '予定',
    note: null,
    version: 1,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    created_by: null,
    updated_by: null,
    ...overrides,
  }
}

describe('shift-constraints', () => {
  describe('checkDuplicateStaffShift', () => {
    it('重複がある場合エラーを返す', () => {
      const shifts = [createShift({ staff_id: 'staff-1', date: '2025-01-15' })]
      const result = checkDuplicateStaffShift(shifts, {
        staffId: 'staff-1',
        date: '2025-01-15',
      })
      expect(result).not.toBeNull()
      expect(result!.type).toBe('error')
      expect(result!.message).toContain('2025-01-15')
    })

    it('重複がない場合nullを返す', () => {
      const shifts = [createShift({ staff_id: 'staff-1', date: '2025-01-15' })]
      const result = checkDuplicateStaffShift(shifts, {
        staffId: 'staff-2',
        date: '2025-01-15',
      })
      expect(result).toBeNull()
    })

    it('別の日付なら重複しない', () => {
      const shifts = [createShift({ staff_id: 'staff-1', date: '2025-01-15' })]
      const result = checkDuplicateStaffShift(shifts, {
        staffId: 'staff-1',
        date: '2025-01-16',
      })
      expect(result).toBeNull()
    })
  })

  describe('checkLocationStaffCount', () => {
    it('必要人数が不足している場合warningを返す', () => {
      const shifts = [createShift({ location_id: 'loc-1', date: '2025-01-15' })]
      const result = checkLocationStaffCount(shifts, 'loc-1', '2025-01-15', 3)
      expect(result).not.toBeNull()
      expect(result!.type).toBe('warning')
      expect(result!.message).toContain('3名')
      expect(result!.message).toContain('1名')
    })

    it('必要人数を満たしている場合nullを返す', () => {
      const shifts = [
        createShift({ location_id: 'loc-1', date: '2025-01-15', staff_id: 'staff-1' }),
        createShift({ location_id: 'loc-1', date: '2025-01-15', staff_id: 'staff-2', id: 'shift-2' }),
        createShift({ location_id: 'loc-1', date: '2025-01-15', staff_id: 'staff-3', id: 'shift-3' }),
      ]
      const result = checkLocationStaffCount(shifts, 'loc-1', '2025-01-15', 3)
      expect(result).toBeNull()
    })

    it('別の日付のシフトはカウントしない', () => {
      const shifts = [
        createShift({ location_id: 'loc-1', date: '2025-01-15' }),
        createShift({ location_id: 'loc-1', date: '2025-01-16', id: 'shift-2' }),
      ]
      const result = checkLocationStaffCount(shifts, 'loc-1', '2025-01-15', 2)
      expect(result).not.toBeNull()
    })

    it('別のロケーションのシフトはカウントしない', () => {
      const shifts = [
        createShift({ location_id: 'loc-1', date: '2025-01-15' }),
        createShift({ location_id: 'loc-2', date: '2025-01-15', id: 'shift-2' }),
      ]
      const result = checkLocationStaffCount(shifts, 'loc-1', '2025-01-15', 2)
      expect(result).not.toBeNull()
    })
  })

  describe('checkRequiredTags', () => {
    const baseStaff = [
      { id: 'staff-1', name: 'スタッフ1', tags: ['大型免許', '危険物'], role_id: 'r1', is_active: true, email: null, employee_id: null, created_at: '', updated_at: '', payroll_limit_type: null, payroll_limit_amount: null },
      { id: 'staff-2', name: 'スタッフ2', tags: ['フォークリフト'], role_id: 'r1', is_active: true, email: null, employee_id: null, created_at: '', updated_at: '', payroll_limit_type: null, payroll_limit_amount: null },
    ] as any[]

    it('必要なタグを持つスタッフが配置されている場合nullを返す', () => {
      const shifts = [
        createShift({ staff_id: 'staff-1', location_id: 'loc-1', date: '2025-01-15' }),
      ]
      const result = checkRequiredTags(shifts, baseStaff, 'loc-1', '2025-01-15', ['大型免許'])
      expect(result).toBeNull()
    })

    it('必要なタグを持つスタッフが不足している場合warningを返す', () => {
      const shifts = [
        createShift({ staff_id: 'staff-2', location_id: 'loc-1', date: '2025-01-15' }),
      ]
      const result = checkRequiredTags(shifts, baseStaff, 'loc-1', '2025-01-15', ['大型免許'])
      expect(result).not.toBeNull()
      expect(result!.type).toBe('warning')
      expect(result!.message).toContain('大型免許')
    })

    it('requiredTagsが空配列の場合nullを返す', () => {
      const shifts = [createShift()]
      const result = checkRequiredTags(shifts, baseStaff, 'loc-1', '2025-01-15', [])
      expect(result).toBeNull()
    })

    it('複数のタグが不足している場合すべて表示する', () => {
      const shifts = [
        createShift({ staff_id: 'staff-2', location_id: 'loc-1', date: '2025-01-15' }),
      ]
      const result = checkRequiredTags(shifts, baseStaff, 'loc-1', '2025-01-15', ['大型免許', '危険物'])
      expect(result).not.toBeNull()
      expect(result!.message).toContain('大型免許')
      expect(result!.message).toContain('危険物')
    })
  })

  describe('validateNewShift', () => {
    it('重複があるシフトを追加するとエラー配列を返す', () => {
      const shifts = [createShift({ staff_id: 'staff-1', date: '2025-01-15' })]
      const violations = validateNewShift(shifts, {
        staffId: 'staff-1',
        locationId: 'loc-1',
        date: '2025-01-15',
      })
      expect(violations.length).toBe(1)
      expect(violations[0].type).toBe('error')
    })

    it('問題がないシフト追加なら空配列を返す', () => {
      const shifts = [createShift({ staff_id: 'staff-1', date: '2025-01-15' })]
      const violations = validateNewShift(shifts, {
        staffId: 'staff-2',
        locationId: 'loc-1',
        date: '2025-01-15',
      })
      expect(violations.length).toBe(0)
    })
  })

  describe('checkResponsibleStaff', () => {
    it('責任者が0名の場合常にwarningを返す（仮実装のため）', () => {
      const shifts = [
        createShift({ staff_id: 'staff-1', location_id: 'loc-1', date: '2025-01-15' }),
      ]
      const staff = [
        { id: 'staff-1', name: 'スタッフ1', tags: [], role_id: 'r1', is_active: true, email: null, employee_id: null, created_at: '', updated_at: '', payroll_limit_type: null, payroll_limit_amount: null },
      ] as any[]
      const result = checkResponsibleStaff(shifts, staff, 'loc-1', '2025-01-15', 1)
      // 現在の実装はTODO(仮実装)のため常にwarningが返る
      expect(result).not.toBeNull()
      expect(result!.type).toBe('warning')
    })
  })
})
