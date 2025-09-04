import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client using service role key
// This bypasses RLS policies and should only be used in server-side code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// During build time, environment variables might not be available
// We'll create a dummy client that will be replaced at runtime
const isDevelopmentOrBuild = process.env.NODE_ENV === 'development' || !supabaseUrl

if (!supabaseUrl && process.env.NODE_ENV === 'production') {
  console.error('⚠️ Missing SUPABASE_URL environment variable in production')
}

if (!supabaseServiceRoleKey && process.env.NODE_ENV === 'production') {
  console.warn('⚠️ Missing SUPABASE_SERVICE_ROLE_KEY - falling back to anon key')
  console.warn('This may cause RLS policy errors when inserting records')
}

// Create server client with service role key (bypasses RLS)
export const supabaseServer = supabaseUrl ? createClient(
  supabaseUrl,
  supabaseServiceRoleKey || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null as any

// Helper to create a client with user context (respects RLS)
export const createServerClient = (accessToken?: string) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null as any
  }
  return createClient(
    supabaseUrl,
    supabaseAnonKey,
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
