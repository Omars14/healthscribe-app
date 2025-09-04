import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // First, get the transcription to find the associated audio file
    const { data: transcription, error: fetchError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', params.id)
      .single()

    if (fetchError || !transcription) {
      return NextResponse.json(
        { error: 'Transcription not found' },
        { status: 404 }
      )
    }

    // Delete the audio file from storage if it exists
    if (transcription.audio_url) {
      try {
        // Extract the file path from the URL
        const urlParts = transcription.audio_url.split('/storage/v1/object/public/')
        if (urlParts[1]) {
          const [bucket, ...pathParts] = urlParts[1].split('/')
          const filePath = pathParts.join('/')
          
          const { error: storageError } = await supabase.storage
            .from(bucket)
            .remove([filePath])
          
          if (storageError) {
            console.error('Failed to delete audio file:', storageError)
            // Continue with transcription deletion even if storage deletion fails
          }
        }
      } catch (error) {
        console.error('Error parsing audio URL:', error)
        // Continue with transcription deletion
      }
    }

    // Delete the transcription record
    const { error: deleteError } = await supabase
      .from('transcriptions')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete transcription' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Transcription deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Delete transcription error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
