import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Create a dummy client during build time if env vars are missing
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any

export type Database = {
  public: {
    Tables: {
      transcriptions: {
        Row: {
          id: string
          file_name: string | null
          doctor_name: string | null
          patient_name: string | null
          document_type: string | null
          transcription_text: string | null
          user_id: string | null
          upload_id: string | null
          created_at: string
          updated_at: string
          audio_url: string | null
          storage_provider: string | null
          file_size: number | null
          upload_status: string | null
          audio_file_name: string | null
        }
        Insert: {
          id?: string
          file_name?: string | null
          doctor_name?: string | null
          patient_name?: string | null
          document_type?: string | null
          transcription_text?: string | null
          user_id?: string | null
          upload_id?: string | null
          created_at?: string
          updated_at?: string
          audio_url?: string | null
          storage_provider?: string | null
          file_size?: number | null
          upload_status?: string | null
          audio_file_name?: string | null
        }
        Update: {
          id?: string
          file_name?: string | null
          doctor_name?: string | null
          patient_name?: string | null
          document_type?: string | null
          transcription_text?: string | null
          user_id?: string | null
          upload_id?: string | null
          created_at?: string
          updated_at?: string
          audio_url?: string | null
          storage_provider?: string | null
          file_size?: number | null
          upload_status?: string | null
          audio_file_name?: string | null
        }
      }
    }
  }
}
