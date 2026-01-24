import { describe, it, expect } from 'vitest'
import {
  calculateNightHours,
  calculateShiftPay,
  calculateMonthlyPayroll,
  calculateAnnualPayroll,
  getWarningLevel,
  calculateMonthlyLimit,
  formatPay,
  formatHours,
  getLimitAmount,
  getWarningLevelColor,
  getWarningLevelLabel,
  HOURLY_RATE,
  NIGHT_RATE,
  PAYROLL_LIMITS,
  ANNUAL_LIMIT,
} from './calculator'
import type { Shift } from '@/lib/actions/shifts'

// テスト用DutyCodeヘルパー
function createDutyCode(overrides: Partial<any> = {}) {
  return {
    id: 'dc-1',
    code: 'A',
    name: '早番',
    start_time: '09:00',
    end_time: '17:00',
    duration_hours: 8,
    duration_minutes: 480,
    break_minutes: 60,
    is_overnight: false,
    category: '通常',
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

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

describe('payroll/calculator', () => {
  describe('calculateNightHours', () => {
    it('日勤(09:00-17:00)は夜勤時間0', () => {
      const result = calculateNightHours({ start: '09:00', end: '17:00' })
      expect(result.totalHours).toBe(8)
      expect(result.nightHours).toBe(0)
      expect(result.regularHours).toBe(8)
    })

    it('夜勤(22:00-06:00)は夜勤7h+通常1h', () => {
      const result = calculateNightHours({ start: '22:00', end: '06:00' })
      expect(result.totalHours).toBe(8)
      // 夜勤時間帯は22:00-05:00（7時間）、05:00-06:00は通常時間
      expect(result.nightHours).toBe(7)
      expect(result.regularHours).toBe(1)
    })

    it('夕方から深夜(18:00-23:00)は22:00以降が夜勤', () => {
      const result = calculateNightHours({ start: '18:00', end: '23:00' })
      expect(result.totalHours).toBe(5)
      expect(result.nightHours).toBe(1)
      expect(result.regularHours).toBe(4)
    })

    it('深夜帯のみ(00:00-05:00)は全て夜勤', () => {
      const result = calculateNightHours({ start: '00:00', end: '05:00' })
      expect(result.totalHours).toBe(5)
      expect(result.nightHours).toBe(5)
      expect(result.regularHours).toBe(0)
    })

    it('深夜帯をまたぐ(03:00-08:00)は05:00まで夜勤', () => {
      const result = calculateNightHours({ start: '03:00', end: '08:00' })
      expect(result.totalHours).toBe(5)
      expect(result.nightHours).toBe(2) // 03:00-05:00
      expect(result.regularHours).toBe(3)
    })

    it('22:00開始で翌05:00終了は7時間夜勤', () => {
      const result = calculateNightHours({ start: '22:00', end: '05:00' })
      expect(result.totalHours).toBe(7)
      expect(result.nightHours).toBe(7)
      expect(result.regularHours).toBe(0)
    })
  })

  describe('calculateShiftPay', () => {
    it('日勤8時間の給与計算', () => {
      const dutyCode = createDutyCode({ start_time: '09:00', end_time: '17:00' })
      const result = calculateShiftPay(dutyCode)
      expect(result.totalHours).toBe(8)
      expect(result.regularPay).toBe(Math.floor(8 * HOURLY_RATE))
      expect(result.nightPay).toBe(0)
      expect(result.totalPay).toBe(Math.floor(8 * HOURLY_RATE))
    })

    it('夜勤の給与は割増計算', () => {
      const dutyCode = createDutyCode({ start_time: '22:00', end_time: '06:00' })
      const result = calculateShiftPay(dutyCode)
      expect(result.nightPay).toBeGreaterThan(0)
      expect(result.totalPay).toBe(result.regularPay + result.nightPay)
    })

    it('start_timeがnullの場合ゼロを返す', () => {
      const dutyCode = createDutyCode({ start_time: null, end_time: '17:00' })
      const result = calculateShiftPay(dutyCode)
      expect(result.totalPay).toBe(0)
      expect(result.totalHours).toBe(0)
    })

    it('end_timeがnullの場合ゼロを返す', () => {
      const dutyCode = createDutyCode({ start_time: '09:00', end_time: null })
      const result = calculateShiftPay(dutyCode)
      expect(result.totalPay).toBe(0)
    })
  })

  describe('calculateMonthlyPayroll', () => {
    it('月次給与を正しく集計する', () => {
      const dutyCodes = [
        createDutyCode({ id: 'dc-1', start_time: '09:00', end_time: '17:00' }),
      ]
      const shifts: Shift[] = [
        createShift({ staff_id: 'staff-1', duty_code_id: 'dc-1', date: '2025-01-10' }),
        createShift({ staff_id: 'staff-1', duty_code_id: 'dc-1', date: '2025-01-11', id: 'shift-2' }),
        createShift({ staff_id: 'staff-1', duty_code_id: 'dc-1', date: '2025-01-12', id: 'shift-3' }),
      ]
      const result = calculateMonthlyPayroll(shifts, dutyCodes, 'staff-1', '2025-01')
      expect(result.shiftCount).toBe(3)
      expect(result.totalHours).toBe(24) // 8h x 3
      expect(result.totalPay).toBe(Math.floor(8 * HOURLY_RATE) * 3)
    })

    it('別のスタッフのシフトはカウントしない', () => {
      const dutyCodes = [createDutyCode()]
      const shifts: Shift[] = [
        createShift({ staff_id: 'staff-1', date: '2025-01-10' }),
        createShift({ staff_id: 'staff-2', date: '2025-01-10', id: 'shift-2' }),
      ]
      const result = calculateMonthlyPayroll(shifts, dutyCodes, 'staff-1', '2025-01')
      expect(result.shiftCount).toBe(1)
    })

    it('別月のシフトはカウントしない', () => {
      const dutyCodes = [createDutyCode()]
      const shifts: Shift[] = [
        createShift({ staff_id: 'staff-1', date: '2025-01-10' }),
        createShift({ staff_id: 'staff-1', date: '2025-02-10', id: 'shift-2' }),
      ]
      const result = calculateMonthlyPayroll(shifts, dutyCodes, 'staff-1', '2025-01')
      expect(result.shiftCount).toBe(1)
    })
  })

  describe('getWarningLevel', () => {
    it('安全圏はsafe', () => {
      expect(getWarningLevel(500000)).toBe('safe')
    })

    it('75%以上はcaution', () => {
      const cautionAmount = ANNUAL_LIMIT * 0.75
      expect(getWarningLevel(cautionAmount)).toBe('caution')
    })

    it('85%以上はwarning', () => {
      const warningAmount = ANNUAL_LIMIT * 0.85
      expect(getWarningLevel(warningAmount)).toBe('warning')
    })

    it('上限以上はexceeded', () => {
      expect(getWarningLevel(ANNUAL_LIMIT)).toBe('exceeded')
      expect(getWarningLevel(ANNUAL_LIMIT + 1)).toBe('exceeded')
    })

    it('カスタム上限額で判定できる', () => {
      expect(getWarningLevel(900000, 1000000)).toBe('warning') // 90%
      expect(getWarningLevel(600000, 1000000)).toBe('safe') // 60%
    })
  })

  describe('getLimitAmount', () => {
    it('各制限タイプで正しい金額を返す', () => {
      expect(getLimitAmount('tax_dependent_103')).toBe(PAYROLL_LIMITS.TAX_DEPENDENT_103)
      expect(getLimitAmount('insurance_106')).toBe(PAYROLL_LIMITS.INSURANCE_106)
      expect(getLimitAmount('insurance_130')).toBe(PAYROLL_LIMITS.INSURANCE_130)
      expect(getLimitAmount('spouse_150')).toBe(PAYROLL_LIMITS.SPOUSE_150)
    })

    it('customの場合はcustomAmountを返す', () => {
      expect(getLimitAmount('custom', 2000000)).toBe(2000000)
    })

    it('customでcustomAmountが未指定ならデフォルト', () => {
      expect(getLimitAmount('custom')).toBe(PAYROLL_LIMITS.TAX_DEPENDENT_103)
    })
  })

  describe('calculateMonthlyLimit', () => {
    it('残り月数で月次上限を逆算する', () => {
      // 年初・支払い0で12ヶ月あると103万/12
      const limit = calculateMonthlyLimit(0, 1)
      expect(limit).toBe(Math.floor(ANNUAL_LIMIT / 12))
    })

    it('既に支払った分を差し引く', () => {
      const paid = 500000
      const limit = calculateMonthlyLimit(paid, 7) // 7月
      const remaining = ANNUAL_LIMIT - paid
      const remainingMonths = 12 - 7 + 1
      expect(limit).toBe(Math.floor(remaining / remainingMonths))
    })

    it('残り月数が0以下なら0を返す', () => {
      expect(calculateMonthlyLimit(0, 13)).toBe(0)
    })
  })

  describe('formatPay', () => {
    it('万円単位にフォーマット', () => {
      expect(formatPay(1030000)).toBe('103.0万円')
      expect(formatPay(500000)).toBe('50.0万円')
    })
  })

  describe('formatHours', () => {
    it('時間をフォーマット', () => {
      expect(formatHours(8)).toBe('8.0時間')
      expect(formatHours(7.5)).toBe('7.5時間')
    })
  })

  describe('getWarningLevelColor', () => {
    it('各レベルに色クラスを返す', () => {
      expect(getWarningLevelColor('safe')).toContain('green')
      expect(getWarningLevelColor('caution')).toContain('yellow')
      expect(getWarningLevelColor('warning')).toContain('orange')
      expect(getWarningLevelColor('exceeded')).toContain('red')
    })
  })

  describe('getWarningLevelLabel', () => {
    it('各レベルにラベルを返す', () => {
      expect(getWarningLevelLabel('safe')).toContain('安全')
      expect(getWarningLevelLabel('caution')).toContain('注意')
      expect(getWarningLevelLabel('warning')).toContain('警告')
      expect(getWarningLevelLabel('exceeded')).toContain('超過')
    })
  })

  describe('calculateAnnualPayroll', () => {
    it('年間給与を正しく集計する', () => {
      const monthlyRecords = [
        { staffId: 'staff-1', yearMonth: '2025-01', totalHours: 160, regularHours: 160, nightHours: 0, regularPay: 288000, nightPay: 0, totalPay: 288000, shiftCount: 20 },
        { staffId: 'staff-1', yearMonth: '2025-02', totalHours: 144, regularHours: 144, nightHours: 0, regularPay: 259200, nightPay: 0, totalPay: 259200, shiftCount: 18 },
      ]
      const result = calculateAnnualPayroll(monthlyRecords, 2025, 'staff-1')
      expect(result.totalPay).toBe(288000 + 259200)
      expect(result.totalHours).toBe(160 + 144)
      expect(result.monthlyBreakdown.length).toBe(2)
      expect(result.warningLevel).toBe('safe')
    })

    it('上限超過時はexceededを返す', () => {
      const monthlyRecords = Array.from({ length: 12 }, (_, i) => ({
        staffId: 'staff-1',
        yearMonth: `2025-${String(i + 1).padStart(2, '0')}`,
        totalHours: 160,
        regularHours: 160,
        nightHours: 0,
        regularPay: 100000,
        nightPay: 0,
        totalPay: 100000,
        shiftCount: 20,
      }))
      const result = calculateAnnualPayroll(monthlyRecords, 2025, 'staff-1')
      expect(result.totalPay).toBe(1200000)
      expect(result.warningLevel).toBe('exceeded')
    })
  })
})
