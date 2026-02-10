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
          request_token: string | null
          is_active: boolean
          employment_type: string
          expo_push_token: string | null
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
          request_token?: string | null
          is_active?: boolean
          employment_type?: string
          expo_push_token?: string | null
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
          request_token?: string | null
          is_active?: boolean
          employment_type?: string
          expo_push_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: []
      }
      duty_codes: {
        Row: {
          id: string
          code: string
          name: string | null
          start_time: string
          end_time: string
          duration_hours: number
          duration_minutes: number
          break_minutes: number
          is_overnight: boolean
          category: string
          total_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name?: string | null
          start_time: string
          end_time: string
          duration_hours: number
          duration_minutes: number
          break_minutes: number
          is_overnight?: boolean
          category: string
          total_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string | null
          start_time?: string
          end_time?: string
          duration_hours?: number
          duration_minutes?: number
          break_minutes?: number
          is_overnight?: boolean
          category?: string
          total_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      task_types: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          description?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      shift_tasks: {
        Row: {
          id: string
          shift_id: string
          task_type_id: string
          hours: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          shift_id: string
          task_type_id: string
          hours: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          shift_id?: string
          task_type_id?: string
          hours?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_tasks_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_tasks_task_type_id_fkey"
            columns: ["task_type_id"]
            isOneToOne: false
            referencedRelation: "task_types"
            referencedColumns: ["id"]
          }
        ]
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "location_requirements_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_requirements_duty_code_id_fkey"
            columns: ["duty_code_id"]
            isOneToOne: false
            referencedRelation: "duty_codes"
            referencedColumns: ["id"]
          }
        ]
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
          year_month?: string
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
        Relationships: [
          {
            foreignKeyName: "shift_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
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
          version: number
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
          version?: number
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
          version?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shifts_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_duty_code_id_fkey"
            columns: ["duty_code_id"]
            isOneToOne: false
            referencedRelation: "duty_codes"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          staff_id: string
          type: string
          title: string
          message: string
          related_shift_id: string | null
          is_read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          type: string
          title: string
          message: string
          related_shift_id?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          type?: string
          title?: string
          message?: string
          related_shift_id?: string | null
          is_read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          }
        ]
      }
      staff_tags: {
        Row: {
          staff_id: string
          tag_id: string
          created_at: string
        }
        Insert: {
          staff_id: string
          tag_id: string
          created_at?: string
        }
        Update: {
          staff_id?: string
          tag_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_tags_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          }
        ]
      }
      system_settings: {
        Row: {
          key: string
          value: string
          description: string | null
          category: string
          updated_at: string
        }
        Insert: {
          key: string
          value: string
          description?: string | null
          category?: string
          updated_at?: string
        }
        Update: {
          key?: string
          value?: string
          description?: string | null
          category?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_shift_requests_by_month: {
        Args: Record<string, never>
        Returns: {
          year_month: string
          count: number
        }[]
      }
      confirm_shifts: {
        Args: {
          p_shift_ids: string[]
          p_updated_by: string | null
        }
        Returns: {
          confirmed_count: number
          confirmed_ids: string[]
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
