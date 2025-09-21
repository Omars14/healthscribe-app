import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

// Check if we're on localhost
const isLocalhost = (typeof window !== 'undefined' && window.location.hostname === 'localhost') ||
                   (typeof process !== 'undefined' && process.env.NODE_ENV === 'development')

// Debug logging for Supabase initialization
console.log('🔧 Supabase client initialization:')
console.log(' - URL present:', !!supabaseUrl)
console.log(' - Anon key present:', !!supabaseAnonKey)
console.log(' - Service key present:', !!supabaseServiceKey)
console.log(' - Is localhost:', isLocalhost)

// Always use anon key for client-side auth, service role only for server-side
const clientKey = supabaseAnonKey
const clientConfig = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
}

console.log(' - Using key:', 'ANON_KEY (for client-side auth)')

// Create Supabase client
export const supabase = supabaseUrl && clientKey 
  ? createClient(supabaseUrl, clientKey, clientConfig)
  : null as any

console.log('✅ Supabase client created:', !!supabase)

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
