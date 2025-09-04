import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

// Create a Supabase client for server-side use
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  if (!supabaseUrl || !supabaseServiceKey) {
    // Return a dummy client during build time
    if (process.env.NODE_ENV !== 'production') {
      return null as any
    }
    throw new Error('Missing Supabase environment variables')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Get authenticated user from request
export async function getAuthenticatedUser(request: NextRequest) {
  const supabase = createServerClient()
  
  // Get the authorization header
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Try to get token from cookies if no auth header
    const cookieHeader = request.headers.get('cookie')
    if (!cookieHeader) {
      return null
    }
    
    // Parse cookies manually
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...rest] = c.split('=')
        return [key, rest.join('=')]
      })
    )
    
    const token = cookies['sb-access-token']
    
    if (!token) {
      return null
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token)
    return error ? null : user
  }
  
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  
  return error ? null : user
}

// Create a Supabase client with user context for API routes
export async function createAuthenticatedClient(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a dummy client during build time
    if (process.env.NODE_ENV !== 'production') {
      return null as any
    }
    throw new Error('Missing Supabase environment variables')
  }
  
  // Get the authorization header
  const authHeader = request.headers.get('authorization')
  let token: string | undefined
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '')
  } else {
    // Try to get token from cookies if no auth header
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      // Parse cookies manually
      const cookies = Object.fromEntries(
        cookieHeader.split('; ').map(c => {
          const [key, ...rest] = c.split('=')
          return [key, rest.join('=')]
        })
      )
      token = cookies['sb-access-token']
    }
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {}
    }
  })
  
  return supabase
}
