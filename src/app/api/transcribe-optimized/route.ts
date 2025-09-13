import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer, createServerClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

// Configure runtime for large file uploads
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes timeout for large uploads

export async function POST(request: NextRequest) {
  try {
    // Check Content-Type to handle both JSON and FormData
    const contentType = request.headers.get('content-type')
    const isJson = contentType?.includes('application/json')
    
    // Get authorization header if present
    const authHeader = request.headers.get('authorization')
    let userId = null
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      
      // Verify the token and get user using server client
      const { data: { user }, error } = await supabaseServer.auth.getUser(token)
      
      if (user && !error) {
        userId = user.id
        console.log('Authenticated user for upload:', user.email, 'ID:', userId)
      } else {
        console.log('Auth error:', error?.message)
      }
    } else {
      console.log('No auth header provided, creating transcription without user_id')
    }
    
    let audioUrl: string
    let fileName: string
    let fileSize: number
    let fileType: string
    let doctorName: string
    let patientName: string
    let documentType: string
    
    if (isJson) {
      // Handle JSON payload (file already uploaded to storage)
      const data = await request.json()
      audioUrl = data.audioUrl
      fileName = data.fileName
      fileSize = data.fileSize
      fileType = data.fileType || 'audio/mpeg'
      doctorName = data.doctorName
      patientName = data.patientName
      documentType = data.documentType
      
      if (!audioUrl) {
        return NextResponse.json({ error: 'No audio URL provided' }, { status: 400 })
      }
      
      console.log('Received pre-uploaded file:', { fileName, fileSize, audioUrl })
    } else {
      // Handle FormData (legacy support for small files)
      const formData = await request.formData()
      const audioFile = formData.get('audio') as File
      doctorName = formData.get('doctorName') as string
      patientName = formData.get('patientName') as string
      documentType = formData.get('documentType') as string
      
      if (!audioFile) {
        return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })
      }
      
      fileName = audioFile.name
      fileSize = audioFile.size
      fileType = audioFile.type
      
      // Upload to storage (for backward compatibility)
      audioUrl = await uploadAudioToStorage(audioFile, userId)
    }
    
    // Step 2: Create database record with audio URL
    const transcription = await createTranscriptionRecord({
      fileName,
      doctorName,
      patientName,
      documentType,
      fileSize,
      userId,
      audioUrl
    })
    
    if (!transcription) {
      return NextResponse.json({ error: 'Failed to create transcription record' }, { status: 500 })
    }
    
    // Step 3: Send to n8n - IMPORTANT: We need to await briefly to ensure it starts
    console.log('🎯 About to call sendToN8NAsync for transcription:', transcription.id)
    console.log('📊 Audio URL being sent to n8n:', audioUrl)
    console.log('📊 Metadata:', { doctorName, patientName, documentType })
    
    // Start the n8n webhook call but use Promise.race to return quickly
    // This ensures the function starts but we don't wait for it to complete
    const n8nPromise = sendToN8NAsync(transcription.id, {
      fileName,
      fileSize,
      fileType
    }, {
      doctorName,
      patientName,
      documentType
    }, audioUrl).then(() => {
      console.log('✅ N8N webhook call completed successfully')
    }).catch(error => {
      console.error('❌ Background n8n processing error:', error)
      console.error('Error stack:', error.stack)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause
      })
      // Update status to indicate n8n processing failed
      return supabaseServer
        .from('transcriptions')
        .update({ status: 'failed', error: error.message })
        .eq('id', transcription.id)
        .then(() => {
          console.log('Updated transcription status to failed')
        })
    })
    
    // Wait for either the n8n call to start (500ms) or complete, whichever comes first
    // This ensures Vercel doesn't kill the function before the HTTP request is sent
    // Increased timeout to ensure the request is actually sent on Vercel
    await Promise.race([
      n8nPromise,
      new Promise(resolve => setTimeout(resolve, 500))
    ])
    
    // Return immediately with transcription ID
    return NextResponse.json({
      success: true,
      transcriptionId: transcription.id,
      status: 'processing',
      message: 'File uploaded successfully. Transcription in progress.'
    })
    
  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function uploadAudioToStorage(file: File, userId: string | null): Promise<string> {
  try {
    // Generate unique file name
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop() || 'mp3'
    const fileName = `${timestamp}-${uuidv4()}.${fileExt}`
    const filePath = userId ? `${userId}/${fileName}` : `anonymous/${fileName}`
    
    console.log('📤 Uploading audio to Supabase Storage:', filePath)
    
    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Upload to Supabase Storage
    const { data, error } = await supabaseServer.storage
      .from('audio-files')
      .upload(filePath, buffer, {
        contentType: file.type || 'audio/mpeg',
        upsert: false
      })
    
    if (error) {
      console.error('❌ Storage upload error:', error)
      // Try to create bucket if it doesn't exist
      if (error.message?.includes('bucket') || error.message?.includes('not found')) {
        console.log('🪣 Creating audio-files bucket...')
        const { error: bucketError } = await supabaseServer.storage
          .createBucket('audio-files', {
            public: false,
            allowedMimeTypes: ['audio/*'],
            fileSizeLimit: 52428800 // 50MB
          })
        
        if (!bucketError || bucketError.message?.includes('already exists')) {
          // Retry upload
          const retryResult = await supabaseServer.storage
            .from('audio-files')
            .upload(filePath, buffer, {
              contentType: file.type || 'audio/mpeg',
              upsert: false
            })
          
          if (retryResult.error) {
            throw retryResult.error
          }
        } else {
          throw bucketError
        }
      } else {
        throw error
      }
    }
    
    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabaseServer.storage
      .from('audio-files')
      .getPublicUrl(filePath)
    
    console.log('✅ Audio uploaded successfully:', publicUrl)
    return publicUrl
    
  } catch (error) {
    console.error('❌ Failed to upload audio to storage:', error)
    // Return empty string if upload fails - transcription can still proceed
    return ''
  }
}

async function createTranscriptionRecord(data: {
  fileName: string
  doctorName: string
  patientName: string
  documentType: string
  fileSize: number
  userId?: string | null
  audioUrl?: string
}) {
  try {
    console.log('Creating transcription record with data:', {
      ...data,
      userId: data.userId ? `${data.userId.substring(0, 8)}...` : 'null'
    })
    
    // First, let's check if the table exists and what columns it has
    const { data: tableCheck, error: tableError } = await supabaseServer
      .from('transcriptions')
      .select('*')
      .limit(1)
    
    if (tableError && tableError.code === '42P01') {
      console.error('❌ CRITICAL: transcriptions table does not exist!')
      console.error('Please run the SQL schema from src/lib/create-new-database.sql')
      return null
    }
    
    // Try to insert with status column, fallback to without if it fails
    let transcription = null
    let error = null
    
    try {
      const insertData = {
        file_name: data.fileName,
        doctor_name: data.doctorName,
        patient_name: data.patientName,
        document_type: data.documentType,
        status: 'pending',
        file_size: data.fileSize,
        transcription_text: '',
        audio_url: data.audioUrl || '',
        user_id: data.userId || null,
        created_at: new Date().toISOString()
      }
      
      console.log('Attempting insert with data:', insertData)
      
      const result = await supabaseServer
        .from('transcriptions')
        .insert(insertData)
        .select()
        .single()
      
      transcription = result.data
      error = result.error
      
      if (error) {
        console.log('First insert attempt failed, trying fallback...')
      }
    } catch (e) {
      console.log('Exception in first insert:', e)
      // If status column doesn't exist, try without it
      const fallbackData = {
        file_name: data.fileName,
        doctor_name: data.doctorName,
        patient_name: data.patientName,
        document_type: data.documentType,
        transcription_text: '',
        audio_url: data.audioUrl || '',
        user_id: data.userId || null,
        created_at: new Date().toISOString()
      }
      
      console.log('Attempting fallback insert without status column:', fallbackData)
      
      const fallbackResult = await supabaseServer
        .from('transcriptions')
        .insert(fallbackData)
        .select()
        .single()
      
      transcription = fallbackResult.data
      error = fallbackResult.error
    }
    
    if (error) {
      console.error('❌ Database error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        data: data
      })
      
      // Check if it's an RLS policy issue
      if (error.code === '42501') {
        console.error('❌ RLS Policy Error: The user does not have permission to insert.')
        console.error('Possible solutions:')
        console.error('1. Check if user is authenticated')
        console.error('2. Check RLS policies on transcriptions table')
        console.error('3. Temporarily disable RLS for testing')
      }
      
      return null
    }
    
    console.log('✅ Transcription record created successfully:', transcription?.id)
    return transcription
  } catch (error) {
    console.error('❌ Failed to create transcription record:', error)
    return null
  }
}

// Removed processAudioFile function - no longer needed since we upload to storage

async function sendToN8NAsync(
  transcriptionId: string,
  fileInfo: {
    fileName: string
    fileSize: number
    fileType: string
  },
  metadata: { doctorName: string; patientName: string; documentType: string },
  audioUrl: string
) {
  try {
    console.log('🔔 Starting n8n webhook call for transcription:', transcriptionId)
    console.log('🔔 Function parameters:', {
      transcriptionId,
      fileInfo,
      metadata,
      audioUrl: audioUrl ? 'URL provided' : 'NO URL!'
    })
    
    // Try to update status if column exists
    try {
      await supabaseServer
        .from('transcriptions')
        .update({ status: 'in_progress' })
        .eq('id', transcriptionId)
    } catch (e) {
      console.log('Status column not available, skipping status update')
    }
    
    // Get n8n Cloud webhook URL
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://project6.app.n8n.cloud/webhook/medical-transcribe-v2'
    console.log('🔗 N8N webhook URL:', N8N_WEBHOOK_URL)
    console.log('🔗 Environment check:', {
      'N8N_WEBHOOK_URL': process.env.N8N_WEBHOOK_URL ? 'SET' : 'NOT SET',
      'NEXT_PUBLIC_N8N_WEBHOOK_URL': process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ? 'SET' : 'NOT SET',
      'NODE_ENV': process.env.NODE_ENV,
      'VERCEL': process.env.VERCEL ? 'YES' : 'NO'
    })
    
    // Determine callback URL for production
    let callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://dashboard-next.vercel.app'}/api/transcription-result-v2`
    const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '4ipofkderor13UDpoR8QzvmpE2WZZC8h'
    
    if (process.env.VERCEL_URL) {
      // Add bypass token to allow n8n to access the protected endpoint
      callbackUrl = `https://${process.env.VERCEL_URL}/api/transcription-result-v2?x-vercel-protection-bypass=${bypassSecret}`
    } else if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      // Use the main production URL with bypass token
      callbackUrl = `https://dashboard-next.vercel.app/api/transcription-result-v2?x-vercel-protection-bypass=${bypassSecret}`
    }
    
    // Prepare JSON payload for n8n Cloud webhook (send directly, not wrapped)
    const webhookPayload = {
      // Match the expected fields from the n8n workflow
      uploadId: transcriptionId,
      audioUrl: audioUrl,
      fileName: fileInfo.fileName || 'audio.mp3',
      doctorName: metadata.doctorName || '',
      patientName: metadata.patientName || '',
      documentType: metadata.documentType || '',
      callbackUrl: callbackUrl,
      
      // Additional metadata
      fileSize: fileInfo.fileSize,
      fileType: fileInfo.fileType || 'audio/mpeg',
      isLargeFile: fileInfo.fileSize > 5 * 1024 * 1024,
      audioSource: 'url',
      uploadTime: new Date().toISOString(),
      source: 'dashboard-next'
    }
    
    console.log('📦 Webhook payload prepared:', {
      fileName: webhookPayload.fileName,
      fileSize: webhookPayload.fileSize,
      uploadId: webhookPayload.uploadId,
      doctorName: webhookPayload.doctorName,
      patientName: webhookPayload.patientName,
      documentType: webhookPayload.documentType,
      audioUrl: webhookPayload.audioUrl ? '[url]' : ''
    })
    
    // Use AbortController for timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 45000) // 45 second timeout (longer for large files)
    
    try {
      console.log('🚀 Sending POST request to n8n webhook...')
      console.log('🚀 Full URL:', N8N_WEBHOOK_URL)
      console.log('🚀 Payload size:', JSON.stringify(webhookPayload).length, 'bytes')
      console.log('🚀 Request headers:', {
        'Content-Type': 'application/json',
        'X-Request-ID': transcriptionId,
        'X-Source': 'dashboard-next'
      })
      
      // Send JSON payload to n8n webhook
      const startTime = Date.now()
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Request-ID': transcriptionId,
          'X-Source': 'dashboard-next'
        },
        body: JSON.stringify(webhookPayload),
        signal: controller.signal
      })
      const endTime = Date.now()
      console.log(`🚀 Request took ${endTime - startTime}ms`)
      
      clearTimeout(timeout)
      
      console.log('📨 N8N webhook response status:', response.status)
      
      // Get response text first
      let responseText = ''
      try {
        responseText = await response.text()
      } catch (e) {
        console.log('Could not read response text:', e)
      }
      
      // Handle various response scenarios
      if (response.status === 200 || response.status === 201 || response.status === 202) {
        console.log('✅ N8N webhook accepted the request')
        
        // Try to parse response as JSON
        let responseData = null
        try {
          if (responseText) {
            responseData = JSON.parse(responseText)
          }
        } catch (e) {
          // Not JSON, that's okay
          console.log('Response is not JSON:', responseText.substring(0, 100))
        }
        
        // Update status to processing
        try {
          const updateData: any = { status: 'processing' }
          if (responseData) {
            updateData.metadata = { n8nResponse: responseData }
          }
          
          await supabaseServer
            .from('transcriptions')
            .update(updateData)
            .eq('id', transcriptionId)
        } catch (e) {
          console.log('Could not update status/metadata:', e)
        }
        
        return // Success
      }
      
      // Handle "No item to return" as success (n8n async processing)
      if (!response.ok && responseText && responseText.includes('No item to return')) {
        console.log('✅ N8N webhook accepted for async processing')
        
        try {
          await supabaseServer
            .from('transcriptions')
            .update({ 
              status: 'processing',
              metadata: { note: 'N8N async processing' }
            })
            .eq('id', transcriptionId)
        } catch (e) {
          console.log('Could not update status:', e)
        }
        
        return // Success - async processing
      }
      
      // Handle error responses
      if (!response.ok) {
        const errorMessage = `N8N webhook failed with status ${response.status}`
        console.error(`❌ ${errorMessage}:`, responseText ? responseText.substring(0, 200) : 'No response body')
        throw new Error(errorMessage)
      }
      
    } catch (error) {
      clearTimeout(timeout)
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('❌ N8N request timeout after 45 seconds')
        throw new Error('N8N request timeout - the file may be too large or the service is unavailable')
      }
      
      // Log detailed error information
      console.error('❌ Fetch error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        cause: error instanceof Error ? (error as any).cause : undefined,
        code: (error as any).code,
        errno: (error as any).errno,
        syscall: (error as any).syscall
      })
      
      throw error
    }
    
  } catch (error) {
    console.error('❌ N8N webhook error:', error)
    
    // Try to update status to failed
    try {
      await supabaseServer
        .from('transcriptions')
        .update({ 
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', transcriptionId)
    } catch (e) {
      console.log('Could not update error status:', e)
    }
    
    throw error
  }
}

// GET endpoint for checking transcription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transcriptionId = searchParams.get('id')
    
    if (!transcriptionId) {
      return NextResponse.json({ error: 'Transcription ID required' }, { status: 400 })
    }
    
    const { data, error } = await supabaseServer
      .from('transcriptions')
      .select('*')
      .eq('id', transcriptionId)
      .single()
    
    if (error || !data) {
      return NextResponse.json({ error: 'Transcription not found' }, { status: 404 })
    }
    
    return NextResponse.json({
      success: true,
      transcription: data
    })
    
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
}
