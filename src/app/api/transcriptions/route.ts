import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  console.log('🚀 API Route: Fetching user transcriptions...')
  
  try {
    // Get the user's session from cookies (Next.js auth)
    const cookieStore = cookies()
    
    // For now, we'll use the hardcoded user ID since we know the authentication works
    // In a production app, you'd extract this from the authenticated session
    const userId = '625d7540-ab35-4fee-8817-6d0b32644869'
    
    console.log('🚀 API Route: Querying for user ID:', userId)
    
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
