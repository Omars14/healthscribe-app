import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-api'
import { v4 as uuidv4 } from 'uuid'

// Configure the API route
export const runtime = 'nodejs'
export const maxDuration = 60 // seconds

// Max file size: 100MB
const MAX_FILE_SIZE = 100 * 1024 * 1024

export async function POST(request: NextRequest) {
  console.log('[Medical Transcription API] Request received')
  
  try {
    // Parse form data
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const doctorName = formData.get('doctorName') as string
    const patientName = formData.get('patientName') as string
    const documentType = formData.get('documentType') as string
    const additionalNotes = formData.get('additionalNotes') as string

    // Validate required fields
    if (!audioFile || !doctorName || !patientName || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate file size
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      )
    }
    
    // Warn about large files
    const isLargeFile = audioFile.size > 10 * 1024 * 1024 // 10MB
    if (isLargeFile) {
      console.log('[Medical Transcription API] Large file detected:', {
        sizeMB: (audioFile.size / (1024 * 1024)).toFixed(2),
        fileName: audioFile.name
      })
    }

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']
    if (!validTypes.includes(audioFile.type) && !audioFile.name.match(/\.(mp3|wav|m4a|ogg|webm|mp4)$/i)) {
      return NextResponse.json(
        { error: 'Invalid audio file format' },
        { status: 400 }
      )
    }

    console.log('[Medical Transcription API] Validation passed', {
      fileName: audioFile.name,
      fileSize: audioFile.size,
      doctorName,
      patientName,
      documentType
    })

    // Get authenticated user
    const supabase = createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate unique ID for this transcription
    const transcriptionId = uuidv4()
    const fileName = `${transcriptionId}_${audioFile.name}`
    const filePath = `medical/${user.id}/${fileName}`

    console.log('[Medical Transcription API] Uploading audio to storage', { filePath })

    // Upload audio to Supabase Storage
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(filePath, buffer, {
        contentType: audioFile.type,
        upsert: false
      })

    if (uploadError) {
      console.error('[Medical Transcription API] Storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload audio file' },
        { status: 500 }
      )
    }

    // Get public URL for the audio
    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(filePath)

    console.log('[Medical Transcription API] Creating database record')

    // Create transcription record in database
    const { data: transcriptionRecord, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        id: transcriptionId,
        user_id: user.id,
        file_name: audioFile.name,
        file_path: filePath,
        file_size: audioFile.size,
        audio_url: publicUrl,
        doctor_name: doctorName,
        patient_name: patientName,
        document_type: documentType,
        status: 'pending',
        metadata: {
          additionalNotes,
          uploadedAt: new Date().toISOString(),
          mimeType: audioFile.type,
          workflow: 'medical-enhanced'
        }
      })
      .select()
      .single()

    if (dbError) {
      console.error('[Medical Transcription API] Database error:', dbError)
      // Try to clean up uploaded file
      await supabase.storage.from('audio-files').remove([filePath])
      return NextResponse.json(
        { error: 'Failed to create transcription record' },
        { status: 500 }
      )
    }

    console.log('[Medical Transcription API] Triggering n8n workflow')

    // Determine the callback URL based on environment
    // Always use the actual deployment URL for callbacks
    let callbackBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dashboard-next.vercel.app'
    if (process.env.VERCEL_URL) {
      // Vercel provides this automatically
      callbackBaseUrl = `https://${process.env.VERCEL_URL}`
    } else if (process.env.NEXT_PUBLIC_URL && !process.env.NEXT_PUBLIC_URL.includes('localhost')) {
      callbackBaseUrl = process.env.NEXT_PUBLIC_URL
    }
    
    // For production, use the hardcoded Vercel URL to ensure reliability
    // This ensures n8n Cloud can always reach our callback endpoint
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      callbackBaseUrl = 'https://dashboard-next-io08fqqjh-omar-salems-projects-e9d8c3df.vercel.app'
    }

    // For n8n Cloud workflow, send data directly (not wrapped in body)
    const n8nPayload = {
      // Match the expected fields from the workflow
      uploadId: transcriptionId, // n8n workflow expects 'uploadId'
      audioUrl: publicUrl, // n8n will download from this URL
      fileName: audioFile.name,
      doctorName,
      patientName,
      documentType,
      additionalNotes,
      // Send explicit callback URL for n8n to use
      callbackUrl: `${callbackBaseUrl}/api/transcription-result-v2`,
      // Additional metadata
      format: audioFile.name.split('.').pop()?.toLowerCase() || 'webm',
      fileSize: audioFile.size,
      fileSizeMB: parseFloat((audioFile.size / (1024 * 1024)).toFixed(2)),
      isLargeFile: audioFile.size > 10 * 1024 * 1024,
      userId: user.id,
      language: 'en',
      audioSource: 'url',
      processingHints: {
        requiresDownload: true,
        estimatedDownloadTime: Math.ceil(audioFile.size / (1024 * 1024)),
        suggestedTimeout: Math.max(60, Math.ceil(audioFile.size / (1024 * 1024)) * 2)
      }
    }

    // Use n8n Cloud webhook URL
    // The webhook URL is now hosted on n8n Cloud, not locally
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://project6.app.n8n.cloud/webhook/medical-transcribe-v2'
    
    console.log('[Medical Transcription API] Using n8n webhook URL:', n8nWebhookUrl)
    console.log('[Medical Transcription API] Environment check:', {
      N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'not set'
    })
    console.log('[Medical Transcription API] Payload being sent to n8n:', JSON.stringify(n8nPayload, null, 2))
    
    try {
      const n8nResponse = await fetch(n8nWebhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(n8nPayload),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      if (!n8nResponse.ok) {
        console.error('[Medical Transcription API] n8n webhook failed:', await n8nResponse.text())
        // Update status to failed
        await supabase
          .from('transcriptions')
          .update({ 
            status: 'failed',
            error: 'Failed to trigger transcription workflow'
          })
          .eq('id', transcriptionId)
      } else {
        const n8nResult = await n8nResponse.json()
        console.log('[Medical Transcription API] n8n workflow triggered successfully:', n8nResult)
        
        // Update status to processing
        await supabase
          .from('transcriptions')
          .update({ status: 'processing' })
          .eq('id', transcriptionId)
      }
    } catch (n8nError) {
      console.error('[Medical Transcription API] n8n connection error:', n8nError)
      // Update status but don't fail the request
      await supabase
        .from('transcriptions')
        .update({ 
          status: 'failed',
          error: 'Failed to connect to transcription service'
        })
        .eq('id', transcriptionId)
    }

    console.log('[Medical Transcription API] Request completed successfully')

    return NextResponse.json({
      success: true,
      transcriptionId,
      message: 'Audio uploaded and transcription initiated',
      status: 'processing',
      audioUrl: publicUrl
    })

  } catch (error) {
    console.error('[Medical Transcription API] Unexpected error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'medical-transcription',
    version: '1.0.0',
    features: {
      transcription: true,
      formatting: true,
      documentTypes: [
        'consultation',
        'surgery_report',
        'discharge_summary',
        'progress_note',
        'radiology_report',
        'pathology_report',
        'emergency_note',
        'procedure_note'
      ]
    }
  })
}
