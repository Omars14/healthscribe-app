import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 API Route: Updating transcription...')

  try {
    const { id } = await params;
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

    const transcriptionId = id
    const body = await request.json()

    console.log('🚀 API Route: Updating transcription ID:', transcriptionId)
    console.log('🚀 API Route: Update data:', body)

    // Validate required fields
    if (!body.transcription_text && body.transcription_text !== '') {
      return NextResponse.json({
        success: false,
        error: 'Transcription text is required'
      }, { status: 400 })
    }

    // Determine status based on transcription text
    const newStatus = (body.transcription_text && body.transcription_text.trim() !== '')
      ? 'completed'
      : 'pending'

    console.log('🚀 API Route: Computed status:', newStatus)

    // Update the transcription
    const { data, error } = await supabase
      .from('transcriptions')
      .update({
        transcription_text: body.transcription_text,
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', transcriptionId)
      .select()
      .single()

    if (error) {
      console.error('❌ API Route: Supabase update error:', error)
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 })
    }

    console.log('✅ API Route: Transcription updated successfully')

    return NextResponse.json({
      success: true,
      transcription: data
    })

  } catch (err: any) {
    console.error('❌ API Route: Unexpected error:', err.message)
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal server error'
    }, { status: 500 })
  }
}


