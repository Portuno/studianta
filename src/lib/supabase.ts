import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para la base de datos
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          user_id: string
          name: string
          institution: string | null
          color: string | null
          icon: string | null
          syllabus_file_path: string | null
          syllabus_file_name: string | null
          syllabus_file_size: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          institution?: string | null
          color?: string | null
          icon?: string | null
          syllabus_file_path?: string | null
          syllabus_file_name?: string | null
          syllabus_file_size?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          institution?: string | null
          color?: string | null
          icon?: string | null
          syllabus_file_path?: string | null
          syllabus_file_name?: string | null
          syllabus_file_size?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          user_id: string
          program_id: string
          name: string
          syllabus_file_path: string | null
          syllabus_file_name: string | null
          syllabus_file_size: number | null
          instructor_name: string | null
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          program_id: string
          name: string
          syllabus_file_path?: string | null
          syllabus_file_name?: string | null
          syllabus_file_size?: number | null
          instructor_name?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          program_id?: string
          name?: string
          syllabus_file_path?: string | null
          syllabus_file_name?: string | null
          syllabus_file_size?: number | null
          instructor_name?: string | null
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subject_events: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          name: string
          event_type: string
          event_date: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          name: string
          event_type: string
          event_date: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          name?: string
          event_type?: string
          event_date?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subject_schedules: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          day_of_week: number
          start_time: string
          end_time: string
          location: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          day_of_week: number
          start_time: string
          end_time: string
          location?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          location?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      study_materials: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          title: string
          type: 'notes' | 'document' | 'audio' | 'video' | 'pdf' | 'image'
          content?: string | null
          file_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          ai_status: 'pending' | 'processing' | 'completed' | 'failed'
          created_at: string
          updated_at: string
          subjects?: {
            id: string
            name: string
            color: string
            icon: string
          } | null
          topics?: {
            id: string
            name: string
          } | null
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          title: string
          type: 'notes' | 'document' | 'audio' | 'video' | 'pdf' | 'image'
          content?: string | null
          file_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          ai_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          title?: string
          type?: 'notes' | 'document' | 'audio' | 'video' | 'pdf' | 'image'
          content?: string | null
          file_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          ai_status?: 'pending' | 'processing' | 'completed' | 'failed'
          created_at?: string
          updated_at?: string
        }
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          duration: number
          notes?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          duration: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          duration?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weekly_goals: {
        Row: {
          id: string
          user_id: string
          subject_id: string
          target_hours: number
          current_hours: number
          week_start: string
          week_end: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_id: string
          target_hours: number
          current_hours: number
          week_start: string
          week_end: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_id?: string
          target_hours?: number
          current_hours?: number
          week_start?: string
          week_end?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 