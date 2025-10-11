import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  console.log('🚀 API Route: Fetching user transcriptions...')
  
  try {
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ API Route: Missing environment variables')
      return NextResponse.json({ 
        success: false, 
        error: 'Server configuration error'
      }, { status: 500 })
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Get authenticated user from auth header or cookies
    const authHeader = request.headers.get('authorization')
    let token = authHeader?.replace('Bearer ', '')
    
    // If no auth header, try to get from cookies
    if (!token) {
      const cookieStore = await cookies()
      // Try different cookie names that Supabase might use
      const authToken = cookieStore.get('sb-access-token') || 
                        cookieStore.get('supabase-auth-token') ||
                        cookieStore.get('sb-localhost-auth-token')
      
      token = authToken?.value
    }
    
    if (!token) {
      console.error('❌ No auth token found in headers or cookies')
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message)
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid authentication'
      }, { status: 401 })
    }
    
    const userId = user.id
    console.log('✅ Authenticated user:', user.email, 'ID:', userId)
    console.log('🚀 API Route: Executing Supabase query...')
    
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    console.log('🚀 API Route: Query result:', { 
      dataLength: data?.length, 
      error: error?.message,
      sampleIds: data?.slice(0, 3).map(t => t.id)
    })
    
    if (error) {
      console.error('❌ API Route: Supabase error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message
      }, { status: 500 })
    }
    
    console.log('✅ API Route: Successfully fetched', data?.length || 0, 'transcriptions')
    
    return NextResponse.json({ 
      success: true, 
      count: data?.length || 0,
      transcriptions: data || []
    })
    
  } catch (err: any) {
    console.error('❌ API Route: Unexpected error:', err.message)
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
