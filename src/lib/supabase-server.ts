import { createClient } from '@supabase/supabase-js'
import { getSupabaseServerUrl, getRequired, getOptional } from './env'

// Server-side Supabase client configuration
const SUPABASE_URL = getSupabaseServerUrl()
const SUPABASE_ANON_KEY = getRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY')
const SUPABASE_SERVICE_ROLE_KEY = getOptional('SUPABASE_SERVICE_ROLE_KEY')

// Create server client with service role key (bypasses RLS)
export const supabaseServer = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Create admin client with service role key (for privileged operations)
export const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : supabaseServer

// Helper to create a client with user context (respects RLS)
export const createServerClient = (accessToken?: string) => {
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        headers: accessToken ? {
          Authorization: `Bearer ${accessToken}`
        } : {}
      }
    }
  )
}
