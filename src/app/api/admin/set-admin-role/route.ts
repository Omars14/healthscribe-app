import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST() {
  console.log('🔧 Admin Setup: Setting admin role for main user...')
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Admin Setup: Missing environment variables')
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
    
    // Set admin role for the main test user
    const testUserId = '625d7540-ab35-4fee-8817-6d0b32644869'
    
    console.log('🔧 Admin Setup: Updating user role to admin for:', testUserId)
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        role: 'admin',
        updated_at: new Date().toISOString()
      })
      .eq('id', testUserId)
      .select('id, email, role, updated_at')
      .single()
    
    if (error) {
      console.error('❌ Admin Setup: Update error:', error)
      return NextResponse.json({ 
        success: false, 
        error: error.message
      }, { status: 500 })
    }
    
    console.log('✅ Admin Setup: Successfully updated user role:', {
      id: data.id,
      email: data.email,
      role: data.role,
      updated_at: data.updated_at
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Admin role successfully assigned',
      user: data
    })
    
  } catch (err: any) {
    console.error('❌ Admin Setup: Unexpected error:', err.message)
    return NextResponse.json({ 
      success: false, 
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}
