// Application Types

export interface Staff {
  id: string;
  employee_number: string;
  name: string;
  email: string | null;
  phone: string | null;
  role_id: string | null;
  tags: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  is_responsible: boolean;
  priority: number;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DutyCode {
  id: string;
  code: string;
  start_time: string;
  end_time: string;
  duration_hours: number;
  duration_minutes: number;
  break_minutes: number;
  is_overnight: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Location {
  id: string;
  business_type: string;
  location_name: string;
  code: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocationRequirement {
  id: string;
  location_id: string;
  duty_code_id: string;
  required_staff_count: number;
  required_responsible_count: number;
  required_tags: string[] | null;
  day_of_week: number | null;
  specific_date: string | null;
  created_at: string;
}

export interface ShiftRequest {
  id: string;
  staff_id: string;
  date: string;
  request_type: '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤';
  note: string | null;
  year_month: string;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  staff_id: string;
  location_id: string;
  duty_code_id: string;
  date: string;
  status: '予定' | '確定' | '変更' | 'キャンセル';
  note: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

// Violation Types for Constraint Checking
export interface ConstraintViolation {
  type: 'insufficient_staff' | 'missing_responsible' | 'missing_required_tag' | 'night_shift_rule' | 'consecutive_work_limit';
  severity: 'error' | 'warning';
  message: string;
  location_id?: string;
  staff_id?: string;
  date?: string;
}

// Utility Types
export type RequestType = '◯' | '休' | '早朝' | '早番' | '遅番' | '夜勤';
export type ShiftStatus = '予定' | '確定' | '変更' | 'キャンセル';
