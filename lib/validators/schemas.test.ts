import { describe, it, expect } from 'vitest'
import { ValidationError } from '@/lib/errors'
import {
  validateData,
  staffCreateSchema,
  staffUpdateSchema,
  locationCreateSchema,
  locationUpdateSchema,
  dutyCodeSchema,
  dutyCodeUpdateSchema,
  shiftCreateSchema,
  shiftUpdateSchema,
  tagSchema,
  roleSchema,
  notificationCreateSchema,
} from './schemas'

// ========================================
// validateData ヘルパー
// ========================================

describe('validateData', () => {
  it('正常値のパース成功時にデータを返す', () => {
    const schema = tagSchema
    const result = validateData(schema, { name: 'テスト', description: null })
    expect(result.name).toBe('テスト')
  })

  it('パース失敗時にValidationErrorをthrowする', () => {
    expect(() => validateData(tagSchema, { name: '' })).toThrow(ValidationError)
  })

  it('エラーメッセージにissuesのmessageが含まれる', () => {
    try {
      validateData(tagSchema, { name: '' })
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError)
      expect((e as ValidationError).message).toContain('タグ名は必須です')
    }
  })
})

// ========================================
// Staff スキーマ
// ========================================

describe('staffCreateSchema', () => {
  const validStaff = {
    employee_number: 'EMP001',
    name: '田中太郎',
    email: 'tanaka@example.com',
    phone: '090-1234-5678',
    role_id: '550e8400-e29b-41d4-a716-446655440000',
    tags: ['550e8400-e29b-41d4-a716-446655440001'],
    is_active: true,
  }

  it('正常値のパース成功', () => {
    const result = validateData(staffCreateSchema, validStaff)
    expect(result.name).toBe('田中太郎')
    expect(result.employee_number).toBe('EMP001')
  })

  it('employee_numberが空でエラー', () => {
    expect(() =>
      validateData(staffCreateSchema, { ...validStaff, employee_number: '' })
    ).toThrow('社員番号は必須です')
  })

  it('nameが空でエラー', () => {
    expect(() =>
      validateData(staffCreateSchema, { ...validStaff, name: '' })
    ).toThrow('名前は必須です')
  })

  it('nameが50文字超でエラー', () => {
    expect(() =>
      validateData(staffCreateSchema, { ...validStaff, name: 'a'.repeat(51) })
    ).toThrow('名前は50文字以内')
  })

  it('emailが不正形式でエラー', () => {
    expect(() =>
      validateData(staffCreateSchema, { ...validStaff, email: 'not-email' })
    ).toThrow('メールアドレスの形式')
  })

  it('emailがnullで許容', () => {
    const result = validateData(staffCreateSchema, { ...validStaff, email: null })
    expect(result.email).toBeNull()
  })

  it('emailが空文字でnullに変換', () => {
    const result = validateData(staffCreateSchema, { ...validStaff, email: '' })
    expect(result.email).toBeNull()
  })

  it('role_idが不正UUIDでエラー', () => {
    expect(() =>
      validateData(staffCreateSchema, { ...validStaff, role_id: 'invalid' })
    ).toThrow('無効なロールID')
  })

  it('tagsに不正UUIDでエラー', () => {
    expect(() =>
      validateData(staffCreateSchema, { ...validStaff, tags: ['not-uuid'] })
    ).toThrow('無効なタグID')
  })

  it('tags省略時にデフォルト空配列', () => {
    const { tags: _, ...noTags } = validStaff
    const result = validateData(staffCreateSchema, noTags)
    expect(result.tags).toEqual([])
  })

  it('is_active省略時にデフォルトtrue', () => {
    const { is_active: _, ...noActive } = validStaff
    const result = validateData(staffCreateSchema, noActive)
    expect(result.is_active).toBe(true)
  })
})

describe('staffUpdateSchema', () => {
  it('employee_numberなしでパース成功', () => {
    const result = validateData(staffUpdateSchema, {
      name: '更新太郎',
      email: null,
      phone: null,
      role_id: null,
      tags: [],
      is_active: true,
    })
    expect(result.name).toBe('更新太郎')
  })
})

// ========================================
// Location スキーマ
// ========================================

describe('locationCreateSchema', () => {
  const validLocation = {
    business_type: '空港',
    location_name: '第1ターミナル',
    code: 'T1',
    is_active: true,
  }

  it('正常値のパース成功', () => {
    const result = validateData(locationCreateSchema, validLocation)
    expect(result.location_name).toBe('第1ターミナル')
  })

  it('business_typeが空でエラー', () => {
    expect(() =>
      validateData(locationCreateSchema, { ...validLocation, business_type: '' })
    ).toThrow('業態は必須です')
  })

  it('location_nameが100文字超でエラー', () => {
    expect(() =>
      validateData(locationCreateSchema, { ...validLocation, location_name: 'a'.repeat(101) })
    ).toThrow('場所名は100文字以内')
  })

  it('codeが空でエラー', () => {
    expect(() =>
      validateData(locationCreateSchema, { ...validLocation, code: '' })
    ).toThrow('コードは必須です')
  })
})

describe('locationUpdateSchema', () => {
  it('codeなしでパース成功', () => {
    const result = validateData(locationUpdateSchema, {
      business_type: '空港',
      location_name: '第2ターミナル',
      is_active: true,
    })
    expect(result.location_name).toBe('第2ターミナル')
  })
})

// ========================================
// DutyCode スキーマ
// ========================================

describe('dutyCodeSchema', () => {
  const validDutyCode = {
    code: 'A',
    category: '通常',
    start_time: '09:00',
    end_time: '17:00',
    duration_hours: 8,
    duration_minutes: 480,
    break_minutes: 60,
    is_overnight: false,
    name: '早番',
  }

  it('正常値のパース成功', () => {
    const result = validateData(dutyCodeSchema, validDutyCode)
    expect(result.code).toBe('A')
  })

  it('codeが空でエラー', () => {
    expect(() =>
      validateData(dutyCodeSchema, { ...validDutyCode, code: '' })
    ).toThrow('コードは必須です')
  })

  it('codeが10文字超でエラー', () => {
    expect(() =>
      validateData(dutyCodeSchema, { ...validDutyCode, code: 'a'.repeat(11) })
    ).toThrow('コードは10文字以内')
  })

  it('start_timeが不正形式でエラー', () => {
    expect(() =>
      validateData(dutyCodeSchema, { ...validDutyCode, start_time: '25:00' })
    ).toThrow('時刻はHH:mm形式')
  })

  it('end_timeが不正形式でエラー', () => {
    expect(() =>
      validateData(dutyCodeSchema, { ...validDutyCode, end_time: '9:00' })
    ).toThrow('時刻はHH:mm形式')
  })

  it('start_time/end_timeがnullで許容', () => {
    const result = validateData(dutyCodeSchema, { ...validDutyCode, start_time: null, end_time: null })
    expect(result.start_time).toBeNull()
    expect(result.end_time).toBeNull()
  })

  it('duration_hoursが負数でエラー', () => {
    expect(() =>
      validateData(dutyCodeSchema, { ...validDutyCode, duration_hours: -1 })
    ).toThrow('時間数は0以上')
  })
})

describe('dutyCodeUpdateSchema', () => {
  it('部分更新が可能', () => {
    const result = validateData(dutyCodeUpdateSchema, { name: '遅番' })
    expect(result.name).toBe('遅番')
    expect(result.code).toBeUndefined()
  })
})

// ========================================
// Shift スキーマ
// ========================================

describe('shiftCreateSchema', () => {
  const validShift = {
    staff_id: '550e8400-e29b-41d4-a716-446655440000',
    location_id: '550e8400-e29b-41d4-a716-446655440001',
    duty_code_id: '550e8400-e29b-41d4-a716-446655440002',
    date: '2025-01-15',
    note: 'テストメモ',
  }

  it('正常値のパース成功', () => {
    const result = validateData(shiftCreateSchema, validShift)
    expect(result.staff_id).toBe(validShift.staff_id)
  })

  it('staff_idが不正UUIDでエラー', () => {
    expect(() =>
      validateData(shiftCreateSchema, { ...validShift, staff_id: 'invalid' })
    ).toThrow('無効なスタッフID')
  })

  it('location_idが不正UUIDでエラー', () => {
    expect(() =>
      validateData(shiftCreateSchema, { ...validShift, location_id: 'bad' })
    ).toThrow('無効な場所ID')
  })

  it('dateが不正形式でエラー', () => {
    expect(() =>
      validateData(shiftCreateSchema, { ...validShift, date: '2025/01/15' })
    ).toThrow('日付はYYYY-MM-DD形式')
  })

  it('noteが500文字超でエラー', () => {
    expect(() =>
      validateData(shiftCreateSchema, { ...validShift, note: 'a'.repeat(501) })
    ).toThrow('メモは500文字以内')
  })

  it('noteがnullで許容', () => {
    const result = validateData(shiftCreateSchema, { ...validShift, note: null })
    expect(result.note).toBeNull()
  })

  it('note省略時にnullに変換', () => {
    const { note: _, ...noNote } = validShift
    const result = validateData(shiftCreateSchema, noNote)
    expect(result.note).toBeNull()
  })
})

describe('shiftUpdateSchema', () => {
  it('部分更新が可能', () => {
    const result = validateData(shiftUpdateSchema, {
      status: '確定',
    })
    expect(result.status).toBe('確定')
    expect(result.staff_id).toBeUndefined()
  })

  it('dateが不正形式でエラー', () => {
    expect(() =>
      validateData(shiftUpdateSchema, { date: 'invalid-date' })
    ).toThrow('日付はYYYY-MM-DD形式')
  })
})

// ========================================
// Tag スキーマ
// ========================================

describe('tagSchema', () => {
  it('正常値のパース成功', () => {
    const result = validateData(tagSchema, { name: 'テストタグ', description: '説明文' })
    expect(result.name).toBe('テストタグ')
  })

  it('nameが空でエラー', () => {
    expect(() =>
      validateData(tagSchema, { name: '' })
    ).toThrow('タグ名は必須です')
  })

  it('nameが50文字超でエラー', () => {
    expect(() =>
      validateData(tagSchema, { name: 'a'.repeat(51) })
    ).toThrow('タグ名は50文字以内')
  })

  it('descriptionが200文字超でエラー', () => {
    expect(() =>
      validateData(tagSchema, { name: 'タグ', description: 'a'.repeat(201) })
    ).toThrow('説明は200文字以内')
  })

  it('descriptionがnullで許容', () => {
    const result = validateData(tagSchema, { name: 'タグ', description: null })
    expect(result.description).toBeNull()
  })

  it('description空文字でnullに変換', () => {
    const result = validateData(tagSchema, { name: 'タグ', description: '' })
    expect(result.description).toBeNull()
  })
})

// ========================================
// Role スキーマ
// ========================================

describe('roleSchema', () => {
  it('正常値のパース成功', () => {
    const result = validateData(roleSchema, { name: 'マネージャー', is_responsible: true, priority: 10 })
    expect(result.name).toBe('マネージャー')
    expect(result.priority).toBe(10)
  })

  it('nameが空でエラー', () => {
    expect(() =>
      validateData(roleSchema, { name: '' })
    ).toThrow('役職名は必須です')
  })

  it('nameが50文字超でエラー', () => {
    expect(() =>
      validateData(roleSchema, { name: 'a'.repeat(51) })
    ).toThrow('役職名は50文字以内')
  })

  it('priorityが負数でエラー', () => {
    expect(() =>
      validateData(roleSchema, { name: 'テスト', priority: -1 })
    ).toThrow('優先度は0以上')
  })

  it('priorityが999超でエラー', () => {
    expect(() =>
      validateData(roleSchema, { name: 'テスト', priority: 1000 })
    ).toThrow('優先度は999以下')
  })

  it('priorityが小数でエラー', () => {
    expect(() =>
      validateData(roleSchema, { name: 'テスト', priority: 1.5 })
    ).toThrow('優先度は整数')
  })

  it('is_responsible省略時にデフォルトfalse', () => {
    const result = validateData(roleSchema, { name: 'テスト' })
    expect(result.is_responsible).toBe(false)
  })

  it('priority省略時にデフォルト0', () => {
    const result = validateData(roleSchema, { name: 'テスト' })
    expect(result.priority).toBe(0)
  })
})

// ========================================
// Notification スキーマ
// ========================================

describe('notificationCreateSchema', () => {
  const validNotification = {
    staff_id: '550e8400-e29b-41d4-a716-446655440000',
    type: 'shift_created' as const,
    title: 'シフト作成通知',
    message: '新しいシフトが作成されました。',
    related_shift_id: '550e8400-e29b-41d4-a716-446655440001',
  }

  it('正常値のパース成功', () => {
    const result = validateData(notificationCreateSchema, validNotification)
    expect(result.title).toBe('シフト作成通知')
  })

  it('staff_idが不正UUIDでエラー', () => {
    expect(() =>
      validateData(notificationCreateSchema, { ...validNotification, staff_id: 'invalid' })
    ).toThrow('無効なスタッフID')
  })

  it('typeが不正値でエラー', () => {
    expect(() =>
      validateData(notificationCreateSchema, { ...validNotification, type: 'invalid_type' })
    ).toThrow()
  })

  it('全ての有効なtypeが許容される', () => {
    const types = ['shift_created', 'shift_updated', 'shift_deleted', 'shift_confirmed', 'shift_request'] as const
    for (const type of types) {
      const result = validateData(notificationCreateSchema, { ...validNotification, type })
      expect(result.type).toBe(type)
    }
  })

  it('titleが空でエラー', () => {
    expect(() =>
      validateData(notificationCreateSchema, { ...validNotification, title: '' })
    ).toThrow('タイトルは必須です')
  })

  it('titleが200文字超でエラー', () => {
    expect(() =>
      validateData(notificationCreateSchema, { ...validNotification, title: 'a'.repeat(201) })
    ).toThrow('タイトルは200文字以内')
  })

  it('messageが空でエラー', () => {
    expect(() =>
      validateData(notificationCreateSchema, { ...validNotification, message: '' })
    ).toThrow('メッセージは必須です')
  })

  it('messageが1000文字超でエラー', () => {
    expect(() =>
      validateData(notificationCreateSchema, { ...validNotification, message: 'a'.repeat(1001) })
    ).toThrow('メッセージは1000文字以内')
  })

  it('related_shift_idがnullで許容', () => {
    const result = validateData(notificationCreateSchema, { ...validNotification, related_shift_id: null })
    expect(result.related_shift_id).toBeNull()
  })

  it('related_shift_id省略時にnullに変換', () => {
    const { related_shift_id: _, ...noShiftId } = validNotification
    const result = validateData(notificationCreateSchema, noShiftId)
    expect(result.related_shift_id).toBeNull()
  })

  it('related_shift_idが不正UUIDでエラー', () => {
    expect(() =>
      validateData(notificationCreateSchema, { ...validNotification, related_shift_id: 'not-uuid' })
    ).toThrow('無効なシフトID')
  })
})
