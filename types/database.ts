// Database Types for Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      staff: {
        Row: {
          id: string
          employee_number: string
          name: string
          email: string | null
          phone: string | null
          role_id: string | null
          tags: string[] | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_number: string
          name: string
          email?: string | null
          phone?: string | null
          role_id?: string | null
          tags?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_number?: string
          name?: string
          email?: string | null
          phone?: string | null
          role_id?: string | null
          tags?: string[] | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      roles: {
        Row: {
          id: string
          name: string
          is_responsible: boolean
          priority: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          is_responsible?: boolean
          priority?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          is_responsible?: boolean
          priority?: number
          created_at?: string
        }
      }
      tags: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
        }
      }
      duty_codes: {
        Row: {
          id: string
          code: string
          start_time: string
          end_time: string
          duration_hours: number
          duration_minutes: number
          break_minutes: number
          is_overnight: boolean
          category: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          start_time: string
          end_time: string
          duration_hours: number
          duration_minutes: number
          break_minutes: number
          is_overnight?: boolean
          category: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          start_time?: string
          end_time?: string
          duration_hours?: number
          duration_minutes?: number
          break_minutes?: number
          is_overnight?: boolean
          category?: string
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          business_type: string
          location_name: string
          code: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_type: string
          location_name: string
          code: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_type?: string
          location_name?: string
          code?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      location_requirements: {
        Row: {
          id: string
          location_id: string
          duty_code_id: string
          required_staff_count: number
          required_responsible_count: number
          required_tags: string[] | null
          day_of_week: number | null
          specific_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          location_id: string
          duty_code_id: string
          required_staff_count: number
          required_responsible_count?: number
          required_tags?: string[] | null
          day_of_week?: number | null
          specific_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          location_id?: string
          duty_code_id?: string
          required_staff_count?: number
          required_responsible_count?: number
          required_tags?: string[] | null
          day_of_week?: number | null
          specific_date?: string | null
          created_at?: string
        }
      }
      shift_requests: {
        Row: {
          id: string
          staff_id: string
          date: string
          request_type: string
          note: string | null
          year_month: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          date: string
          request_type: string
          note?: string | null
          year_month: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          date?: string
          request_type?: string
          note?: string | null
          year_month?: string
          created_at?: string
          updated_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          staff_id: string
          location_id: string
          duty_code_id: string
          date: string
          status: string
          note: string | null
          created_at: string
          updated_at: string
          created_by: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          staff_id: string
          location_id: string
          duty_code_id: string
          date: string
          status?: string
          note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          staff_id?: string
          location_id?: string
          duty_code_id?: string
          date?: string
          status?: string
          note?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
