import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
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
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const searchBy = searchParams.get('searchBy') || 'all' // 'all', 'user', 'doctor', 'file'
    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    console.log('🔍 Admin Transcriptions API:', { search, searchBy, status, page, limit, sortBy, sortOrder })

    // Build the query
    let query = supabase
      .from('transcriptions')
      .select(`
        *,
        user_profiles!inner(
          email,
          full_name
        )
      `)

    // Apply status filter
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter based on searchBy parameter
    if (search.trim()) {
      switch (searchBy) {
        case 'user':
          query = query.ilike('user_profiles.email', `%${search}%`)
          break
        case 'doctor':
          query = query.ilike('doctor_name', `%${search}%`)
          break
        case 'file':
          query = query.ilike('file_name', `%${search}%`)
          break
        case 'all':
        default:
          query = query.or(`file_name.ilike.%${search}%,doctor_name.ilike.%${search}%,user_profiles.email.ilike.%${search}%`)
          break
      }
    }

    // Apply sorting
    const validSortFields = ['created_at', 'file_name', 'doctor_name', 'status', 'user_profiles.email']
    if (validSortFields.includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Get total count for pagination
    const { count, error: countError } = await query.count()

    if (countError) {
      console.error('Error getting count:', countError)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: transcriptions, error } = await query

    if (error) {
      console.error('Error fetching transcriptions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch transcriptions' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedTranscriptions = transcriptions?.map(t => ({
      id: t.id,
      file_name: t.file_name,
      doctor_name: t.doctor_name || 'Unknown Doctor',
      patient_name: t.patient_name || 'Unknown Patient',
      document_type: t.document_type,
      transcription_text: t.transcription_text,
      audio_url: t.audio_url,
      status: t.status,
      created_at: t.created_at,
      processed_at: t.processed_at,
      duration: t.duration,
      user: {
        email: t.user_profiles?.email,
        full_name: t.user_profiles?.full_name
      }
    })) || []

    const totalPages = Math.ceil((count || 0) / limit)

    return NextResponse.json({
      transcriptions: formattedTranscriptions,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        search,
        searchBy,
        status,
        sortBy,
        sortOrder
      }
    })

  } catch (error) {
    console.error('Admin transcriptions API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

