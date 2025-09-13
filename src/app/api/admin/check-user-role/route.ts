import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  console.log('🔍 Admin Role Check: Starting role verification...')
  
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.log('❌ Admin Role Check: No authorization header')
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    // Create Supabase client with service role for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current user from session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.log('❌ Admin Role Check: Invalid authentication:', userError?.message)
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    console.log('✅ Admin Role Check: User authenticated:', user.email, 'ID:', user.id)

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, email, full_name, is_active')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('❌ Admin Role Check: Profile error:', profileError.message)
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    if (!profile) {
      console.log('❌ Admin Role Check: No profile found for user')
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    console.log('✅ Admin Role Check: Profile found:', {
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active
    })

    return NextResponse.json({
      role: profile.role,
      email: profile.email,
      full_name: profile.full_name,
      is_active: profile.is_active,
      user_id: user.id
    })

  } catch (error) {
    console.error('❌ Admin Role Check: Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}