import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 Admin Check: Checking user role for admin access...')
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Admin Check: Missing environment variables')
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
    
    // Check the role of the main test user
    const testUserId = '625d7540-ab35-4fee-8817-6d0b32644869'
    
    console.log('🔍 Admin Check: Querying user profile for:', testUserId)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, created_at, updated_at')
      .eq('id', testUserId)
      .single()
    
    if (error) {
      console.error('❌ Admin Check: Query error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message
      }, { status: 500 })
    }
    
    console.log('✅ Admin Check: User profile found:', {
      id: data.id,
      email: data.email,
      role: data.role,
      isAdmin: data.role === 'admin'
    })
    
    return NextResponse.json({ 
      success: true, 
      user: data,
      isAdmin: data.role === 'admin',
      needsRoleUpdate: data.role !== 'admin'
    })
    
  } catch (err: any) {
    console.error('❌ Admin Check: Unexpected error:', err.message)
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
