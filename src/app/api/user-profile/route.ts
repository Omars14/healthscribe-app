import { createClient } from '@supabase/supabase-js'
import { NextResponse, NextRequest } from 'next/server'

/**
 * API endpoint to fetch user profile
 * 
 * This endpoint retrieves user profile data using server-side credentials
 * to avoid CORS issues and permission problems with the ANON key.
 * 
 * Query Parameters:
 * - id: User ID (required)
 * 
 * Usage: GET /api/user-profile?id=<user_id>
 * 
 * Returns: { id, email, full_name, avatar_url, created_at, ... }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID required in query parameter' },
        { status: 400 }
      )
    }

    // Validate Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl) {
      console.error('[user-profile] NEXT_PUBLIC_SUPABASE_URL not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (!serviceKey) {
      console.error('[user-profile] SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Fetch user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[user-profile] Error fetching profile:', {
        userId,
        code: error.code,
        message: error.message
      })

      if (error.code === 'PGRST116') {
        // No rows returned
        return NextResponse.json(
          { error: 'User profile not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      )
    }

    // Success
    console.log('[user-profile] Profile fetched successfully for user:', userId)
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'private, max-age=300', // Cache for 5 minutes
      }
    })

  } catch (err: any) {
    console.error('[user-profile] Unexpected error:', {
      message: err.message,
      stack: err.stack?.split('\n')[0]
    })

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
