/**
 * Zodバリデーションスキーマ
 * 全エンティティのcreate/update入力をサーバーサイドでバリデーション
 */

import { z } from 'zod'
import { ValidationError } from '@/lib/errors'

// ========================================
// ヘルパー関数
// ========================================

/**
 * Zodスキーマでデータをバリデーション
 * パース失敗時はValidationErrorをthrow（日本語メッセージ）
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const messages = result.error.issues.map((i) => i.message).join(', ')
    throw new ValidationError(messages, { issues: result.error.issues })
  }
  return result.data
}

// ========================================
// 共通パターン
// ========================================

const uuidField = (label: string) =>
  z.string().uuid(`無効な${label}です`)

const timeField = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, '時刻はHH:mm形式で入力してください')

const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日付はYYYY-MM-DD形式で入力してください')

// ========================================
// Staff スキーマ
// ========================================

export const staffCreateSchema = z.object({
  employee_number: z
    .string()
    .min(1, '社員番号は必須です')
    .max(20, '社員番号は20文字以内で入力してください'),
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください'),
  email: z
    .union([z.string().email('メールアドレスの形式が正しくありません').max(255), z.literal('')])
    .nullable()
    .optional()
    .transform((v) => v || null),
  phone: z
    .string()
    .max(20, '電話番号は20文字以内で入力してください')
    .nullable()
    .optional()
    .transform((v) => v || null),
  role_id: uuidField('ロールID')
    .nullable()
    .optional()
    .transform((v) => v || null),
  tags: z.array(z.string().uuid('無効なタグIDです')).optional().default([]),
  is_active: z.boolean().optional().default(true),
})

export const staffUpdateSchema = staffCreateSchema.omit({ employee_number: true })

// ========================================
// Location スキーマ
// ========================================

export const locationCreateSchema = z.object({
  business_type: z
    .string()
    .min(1, '業態は必須です')
    .max(50, '業態は50文字以内で入力してください'),
  location_name: z
    .string()
    .min(1, '場所名は必須です')
    .max(100, '場所名は100文字以内で入力してください'),
  code: z
    .string()
    .min(1, 'コードは必須です')
    .max(20, 'コードは20文字以内で入力してください'),
  is_active: z.boolean().optional().default(true),
})

export const locationUpdateSchema = locationCreateSchema.omit({ code: true })

// ========================================
// DutyCode スキーマ
// ========================================

export const dutyCodeSchema = z.object({
  code: z
    .string()
    .min(1, 'コードは必須です')
    .max(10, 'コードは10文字以内で入力してください'),
  category: z.string().max(50, 'カテゴリは50文字以内で入力してください').nullable().optional(),
  start_time: timeField.nullable().optional(),
  end_time: timeField.nullable().optional(),
  duration_hours: z.number().min(0, '時間数は0以上で入力してください').nullable().optional(),
  duration_minutes: z.number().min(0, '分数は0以上で入力してください').nullable().optional(),
  break_minutes: z.number().min(0, '休憩時間は0以上で入力してください').nullable().optional(),
  is_overnight: z.boolean().optional().default(false),
  name: z.string().max(100, '名称は100文字以内で入力してください').nullable().optional(),
})

export const dutyCodeUpdateSchema = dutyCodeSchema.partial()

// ========================================
// Shift スキーマ
// ========================================

export const shiftCreateSchema = z.object({
  staff_id: uuidField('スタッフID'),
  location_id: uuidField('場所ID'),
  duty_code_id: uuidField('勤務コードID'),
  date: dateField,
  note: z
    .string()
    .max(500, 'メモは500文字以内で入力してください')
    .nullable()
    .optional()
    .transform((v) => v || null),
})

export const shiftUpdateSchema = z.object({
  staff_id: uuidField('スタッフID').optional(),
  location_id: uuidField('場所ID').optional(),
  duty_code_id: uuidField('勤務コードID').optional(),
  date: dateField.optional(),
  status: z.string().max(20).optional(),
  note: z
    .string()
    .max(500, 'メモは500文字以内で入力してください')
    .nullable()
    .optional(),
})

// ========================================
// Tag スキーマ
// ========================================

export const tagSchema = z.object({
  name: z
    .string()
    .min(1, 'タグ名は必須です')
    .max(50, 'タグ名は50文字以内で入力してください'),
  description: z
    .string()
    .max(200, '説明は200文字以内で入力してください')
    .nullable()
    .optional()
    .transform((v) => v || null),
})

// ========================================
// Role スキーマ
// ========================================

export const roleSchema = z.object({
  name: z
    .string()
    .min(1, '役職名は必須です')
    .max(50, '役職名は50文字以内で入力してください'),
  is_responsible: z.boolean().optional().default(false),
  priority: z
    .number()
    .int('優先度は整数で入力してください')
    .min(0, '優先度は0以上で入力してください')
    .max(999, '優先度は999以下で入力してください')
    .optional()
    .default(0),
})

// ========================================
// Notification スキーマ
// ========================================

export const notificationCreateSchema = z.object({
  staff_id: uuidField('スタッフID'),
  type: z.enum(
    ['shift_created', 'shift_updated', 'shift_deleted', 'shift_confirmed', 'shift_request'],
    { message: '無効な通知タイプです' }
  ),
  title: z
    .string()
    .min(1, 'タイトルは必須です')
    .max(200, 'タイトルは200文字以内で入力してください'),
  message: z
    .string()
    .min(1, 'メッセージは必須です')
    .max(1000, 'メッセージは1000文字以内で入力してください'),
  related_shift_id: uuidField('シフトID')
    .nullable()
    .optional()
    .transform((v) => v || null),
})

// ========================================
// 型エクスポート
// ========================================

export type StaffCreateInput = z.infer<typeof staffCreateSchema>
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>
export type LocationCreateInput = z.infer<typeof locationCreateSchema>
export type LocationUpdateInput = z.infer<typeof locationUpdateSchema>
export type DutyCodeInput = z.infer<typeof dutyCodeSchema>
export type DutyCodeUpdateInput = z.infer<typeof dutyCodeUpdateSchema>
export type ShiftCreateInput = z.infer<typeof shiftCreateSchema>
export type ShiftUpdateInput = z.infer<typeof shiftUpdateSchema>
export type TagInput = z.infer<typeof tagSchema>
export type RoleInput = z.infer<typeof roleSchema>
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>
