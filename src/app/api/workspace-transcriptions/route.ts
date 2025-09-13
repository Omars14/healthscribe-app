import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  console.log('🚀 Workspace API: Fetching user transcriptions for workspace...')
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Workspace API: Missing environment variables')
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
    
    // Get userId from query parameters (will be passed from client)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    
    if (!userId) {
      console.error('❌ Workspace API: Missing userId parameter')
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required'
      }, { status: 400 })
    }
    
    console.log('🚀 Workspace API: Executing Supabase query for user:', userId)
    
    // Get transcriptions for specific user only (FIXED: was fetching all users)
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', userId)  // CRITICAL FIX: Filter by user_id
      .order('created_at', { ascending: false })
      .limit(100) // Limit to prevent large result sets
    
    console.log('🚀 Workspace API: Query result:', { 
      dataLength: data?.length, 
      error: error?.message,
      sampleIds: data?.slice(0, 3).map(t => t.id)
    })
    
    if (error) {
      console.error('❌ Workspace API: Supabase error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message
      }, { status: 500 })
    }
    
    console.log('✅ Workspace API: Successfully fetched', data?.length || 0, 'transcriptions')
    
    return NextResponse.json({
      success: true,
      count: data?.length || 0,
      transcriptions: data || []
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30', // Cache for 30 seconds
        'X-Response-Time': Date.now().toString()
      }
    })
    
  } catch (err: any) {
    console.error('❌ Workspace API: Unexpected error:', err.message)
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
