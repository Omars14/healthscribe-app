import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Lazy-load supabase to avoid build-time initialization errors
function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase configuration missing')
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const { audioUrl } = await request.json()

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Audio URL is required' },
        { status: 400 }
      )
    }

    // Extract file path from URL
    const urlObj = new URL(audioUrl)
    const pathRegex = /\/storage\/v1\/object\/[^\/]+\/[^\/]+\/(.+)/
    const pathMatch = urlObj.pathname.match(pathRegex)

    if (!pathMatch) {
      return NextResponse.json(
        { error: 'Invalid audio URL format' },
        { status: 400 }
      )
    }

    const filePath = pathMatch[1]

    // Generate signed URL that expires in 1 hour
    const supabase = getSupabase()
    const { data, error } = await supabase.storage
      .from('audio-files')
      .createSignedUrl(filePath, 3600)

    if (error) {
      console.error('Error generating signed URL:', error)
      return NextResponse.json(
        { error: 'Failed to generate signed URL', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ signedUrl: data.signedUrl })
  } catch (error: any) {
    console.error('Error in audio-url API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
