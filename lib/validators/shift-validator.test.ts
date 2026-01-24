import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Shift } from '@/lib/actions/shifts'

// Supabase clientをモック
const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  single: vi.fn(),
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => mockSupabaseQuery),
  })),
}))

// shift-validatorのインポート（モック後）
import {
  checkDuplicateStaff,
  checkConsecutiveWorkLimit,
  checkStaffCount,
  checkNightShiftRule,
  validateNewShift,
} from './shift-validator'

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

describe('validators/shift-validator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // デフォルトのモック応答をリセット
    mockSupabaseQuery.select.mockReturnThis()
    mockSupabaseQuery.eq.mockReturnThis()
    mockSupabaseQuery.is.mockReturnThis()
    mockSupabaseQuery.in.mockReturnThis()
    mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null })
  })

  describe('checkDuplicateStaff', () => {
    it('重複がある場合エラーを返す', async () => {
      const shifts = [createShift({ staff_id: 'staff-1', date: '2025-01-15' })]
      const result = await checkDuplicateStaff(shifts, 'staff-1', '2025-01-15')
      expect(result).not.toBeNull()
      expect(result!.type).toBe('error')
      expect(result!.severity).toBe('error')
      expect(result!.message).toContain('2025-01-15')
    })

    it('重複がない場合nullを返す', async () => {
      const shifts = [createShift({ staff_id: 'staff-1', date: '2025-01-15' })]
      const result = await checkDuplicateStaff(shifts, 'staff-2', '2025-01-15')
      expect(result).toBeNull()
    })

    it('同じスタッフでも日付が違えばnull', async () => {
      const shifts = [createShift({ staff_id: 'staff-1', date: '2025-01-15' })]
      const result = await checkDuplicateStaff(shifts, 'staff-1', '2025-01-16')
      expect(result).toBeNull()
    })

    it('空のシフト配列ならnull', async () => {
      const result = await checkDuplicateStaff([], 'staff-1', '2025-01-15')
      expect(result).toBeNull()
    })

    it('複数のシフトから正しく重複を検知', async () => {
      const shifts = [
        createShift({ staff_id: 'staff-1', date: '2025-01-14', id: 's1' }),
        createShift({ staff_id: 'staff-2', date: '2025-01-15', id: 's2' }),
        createShift({ staff_id: 'staff-1', date: '2025-01-15', id: 's3' }),
      ]
      const result = await checkDuplicateStaff(shifts, 'staff-1', '2025-01-15')
      expect(result).not.toBeNull()
    })
  })

  describe('checkConsecutiveWorkLimit', () => {
    it('連続勤務日数が上限以下ならnull', async () => {
      const shifts = [
        createShift({ staff_id: 'staff-1', date: '2025-01-13', id: 's1' }),
        createShift({ staff_id: 'staff-1', date: '2025-01-14', id: 's2' }),
        createShift({ staff_id: 'staff-1', date: '2025-01-15', id: 's3' }),
      ]
      const result = await checkConsecutiveWorkLimit(shifts, 'staff-1', '2025-01-14', 6)
      expect(result).toBeNull()
    })

    it('連続勤務日数が上限を超えたらwarning', async () => {
      // 7日連続勤務（上限6日）
      const shifts = Array.from({ length: 7 }, (_, i) =>
        createShift({
          staff_id: 'staff-1',
          date: `2025-01-${String(10 + i).padStart(2, '0')}`,
          id: `s${i}`,
        })
      )
      const result = await checkConsecutiveWorkLimit(shifts, 'staff-1', '2025-01-13', 6)
      expect(result).not.toBeNull()
      expect(result!.type).toBe('warning')
      expect(result!.severity).toBe('warning')
      expect(result!.message).toContain('連続勤務')
    })

    it('別のスタッフのシフトはカウントしない', async () => {
      const shifts = Array.from({ length: 7 }, (_, i) =>
        createShift({
          staff_id: i < 3 ? 'staff-1' : 'staff-2',
          date: `2025-01-${String(10 + i).padStart(2, '0')}`,
          id: `s${i}`,
        })
      )
      const result = await checkConsecutiveWorkLimit(shifts, 'staff-1', '2025-01-11', 6)
      expect(result).toBeNull()
    })

    it('カスタム上限を設定できる', async () => {
      // 4日連続勤務（上限3日）
      const shifts = Array.from({ length: 4 }, (_, i) =>
        createShift({
          staff_id: 'staff-1',
          date: `2025-01-${String(10 + i).padStart(2, '0')}`,
          id: `s${i}`,
        })
      )
      const result = await checkConsecutiveWorkLimit(shifts, 'staff-1', '2025-01-11', 3)
      expect(result).not.toBeNull()
      expect(result!.message).toContain('3日')
    })

    it('連続していない日があればリセットされる', async () => {
      const shifts = [
        createShift({ staff_id: 'staff-1', date: '2025-01-10', id: 's1' }),
        createShift({ staff_id: 'staff-1', date: '2025-01-11', id: 's2' }),
        // 12日は休み
        createShift({ staff_id: 'staff-1', date: '2025-01-13', id: 's3' }),
        createShift({ staff_id: 'staff-1', date: '2025-01-14', id: 's4' }),
      ]
      const result = await checkConsecutiveWorkLimit(shifts, 'staff-1', '2025-01-14', 6)
      expect(result).toBeNull()
    })
  })

  describe('checkStaffCount', () => {
    it('要件が未設定の場合warningを返す', async () => {
      // getLocationRequirement がnullを返す
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null })

      const shifts = [createShift()]
      const result = await checkStaffCount({
        shifts,
        date: '2025-01-15',
        locationId: 'loc-1',
        dutyCodeId: 'dc-1',
      })
      expect(result.some((v) => v.type === 'warning')).toBe(true)
      expect(result.some((v) => v.message.includes('要件が設定されていません'))).toBe(true)
    })

    it('必要人数不足でerrorを返す', async () => {
      // 1回目の呼び出し(specific_date検索)でrequirement返す
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { required_staff_count: 3, required_responsible_count: 0, required_tags: [] },
        error: null,
      })

      const shifts = [createShift({ location_id: 'loc-1', duty_code_id: 'dc-1', date: '2025-01-15' })]
      const result = await checkStaffCount({
        shifts,
        date: '2025-01-15',
        locationId: 'loc-1',
        dutyCodeId: 'dc-1',
      })
      expect(result.some((v) => v.type === 'error')).toBe(true)
      expect(result.some((v) => v.message.includes('不足'))).toBe(true)
    })
  })

  describe('checkNightShiftRule', () => {
    it('前日に夜勤がない場合nullを返す', async () => {
      const shifts: Shift[] = []
      const result = await checkNightShiftRule(shifts, 'staff-1', '2025-01-15')
      expect(result).toBeNull()
    })

    it('前日に夜勤がある場合warningを返す', async () => {
      const shifts = [
        createShift({ staff_id: 'staff-1', date: '2025-01-14', duty_code_id: 'dc-night' }),
      ]
      // 夜勤の勤務記号を返す
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { id: 'dc-night', code: 'N', start_time: '22:00', end_time: '06:00' },
        error: null,
      })

      const result = await checkNightShiftRule(shifts, 'staff-1', '2025-01-15')
      expect(result).not.toBeNull()
      expect(result!.type).toBe('warning')
      expect(result!.message).toContain('夜勤')
    })

    it('前日の勤務が日勤(19:00未満開始)の場合null', async () => {
      const shifts = [
        createShift({ staff_id: 'staff-1', date: '2025-01-14', duty_code_id: 'dc-day' }),
      ]
      mockSupabaseQuery.single.mockResolvedValueOnce({
        data: { id: 'dc-day', code: 'A', start_time: '09:00', end_time: '17:00' },
        error: null,
      })

      const result = await checkNightShiftRule(shifts, 'staff-1', '2025-01-15')
      expect(result).toBeNull()
    })
  })

  describe('validateNewShift', () => {
    it('重複+夜勤明け+連続勤務をまとめてチェックする', async () => {
      // 夜勤明けのモック
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null })

      const shifts = [
        createShift({ staff_id: 'staff-1', date: '2025-01-15' }),
      ]
      const violations = await validateNewShift(shifts, {
        staffId: 'staff-1',
        locationId: 'loc-1',
        dutyCodeId: 'dc-1',
        date: '2025-01-15',
      })
      // 重複チェックで1つはエラーが出る
      expect(violations.some((v) => v.type === 'error')).toBe(true)
    })

    it('問題なければ空配列を返す', async () => {
      mockSupabaseQuery.single.mockResolvedValue({ data: null, error: null })

      const shifts = [
        createShift({ staff_id: 'staff-1', date: '2025-01-14' }),
      ]
      const violations = await validateNewShift(shifts, {
        staffId: 'staff-2',
        locationId: 'loc-1',
        dutyCodeId: 'dc-1',
        date: '2025-01-15',
      })
      expect(violations.length).toBe(0)
    })
  })
})
