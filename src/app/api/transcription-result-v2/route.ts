import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-api'

export async function POST(request: NextRequest) {
  try {
    // Get the transcription result from n8n
    const data = await request.json()
    
    console.log('Received transcription result from n8n:', {
      uploadId: data.uploadId,
      success: data.success,
      hasTranscription: !!data.transcription,
      fileName: data.fileName,
    })

    // Extract fields from n8n response
    const {
      uploadId,
      transcription,
      success,
      cleaned,
      fileName,
      doctorName,
      patientName,
      documentType,
      audioUrl,
      fileSize,
      userId,
      storageProvider
    } = data

    // Validate required fields
    if (!uploadId) {
      console.error('Missing uploadId in transcription result')
      return NextResponse.json(
        { error: 'Upload ID is required' },
        { status: 400 }
      )
    }

    // Use service role client to update the database
    const supabase = createServerClient()

    // Prepare update data
    const updateData: any = {
      status: success ? 'completed' : 'failed',
      updated_at: new Date().toISOString()
    }

    if (transcription) {
      updateData.transcription_text = transcription
    }

    if (audioUrl) {
      updateData.audio_url = audioUrl
    }

    if (!success) {
      updateData.error = 'Transcription failed in n8n workflow'
    }

    // Add metadata about the transcription process
    updateData.metadata = {
      processed_at: new Date().toISOString(),
      cleaned: cleaned || false,
      storage_provider: storageProvider || 'supabase',
      file_size: fileSize,
      workflow: 'Medical Audio Transcription - Dual Path'
    }

    console.log('Updating transcription record:', uploadId, updateData.status)

    // Update the transcription record
    const { error: dbError } = await supabase
      .from('transcriptions')
      .update(updateData)
      .eq('id', uploadId)

    if (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json(
        { 
          error: 'Failed to update transcription',
          details: dbError.message 
        },
        { status: 500 }
      )
    }

    console.log('Successfully updated transcription:', uploadId)

    return NextResponse.json({
      success: true,
      message: 'Transcription updated successfully',
      uploadId,
      status: updateData.status
    })

  } catch (error) {
    console.error('Transcription result API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Also support GET for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'transcription-result-v2',
    message: 'This endpoint receives transcription results from n8n'
  })
}
