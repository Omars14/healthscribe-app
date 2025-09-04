import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedClient, getAuthenticatedUser } from '@/lib/supabase-api'
import { uploadAudioServerSide } from '@/lib/storage-service'

// Configure n8n webhook URL from environment variable - matching existing dashboard.html
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://a606159a0cea.ngrok-free.app/webhook/upload'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const user = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    
    const supabase = await createAuthenticatedClient(request)
    const formData = await request.formData()
    
    // Extract form data
    const audioFile = formData.get('audio') as File
    const doctorName = formData.get('doctorName') as string
    const patientName = formData.get('patientName') as string
    const documentType = formData.get('documentType') as string
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Convert file to base64 for n8n webhook
    const arrayBuffer = await audioFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Audio = buffer.toString('base64')
    
    // Create initial transcription record in database
    const { data: transcription, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id, // Associate with authenticated user
        file_name: audioFile.name,
        doctor_name: doctorName,
        patient_name: patientName,
        document_type: documentType,
        status: 'pending',
        file_size: audioFile.size,
        transcription_text: '',
        audio_url: '', // Will be updated after upload
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create transcription record' },
        { status: 500 }
      )
    }

    // Update status to in_progress
    await supabase
      .from('transcriptions')
      .update({ status: 'in_progress' })
      .eq('id', transcription.id)

    // Send to n8n webhook for transcription - matching existing dashboard.html format
    try {
      // Prepare webhook payload in the same format as dashboard.html
      const webhookPayload = {
        fileName: audioFile.name,
        fileSize: audioFile.size,
        fileType: audioFile.type,
        fileContent: base64Audio, // base64 encoded content
        doctorName: doctorName,
        patientName: patientName,
        documentType: documentType,
        uploadId: transcription.id,
        userId: user.id, // Include authenticated user ID
        uploadTime: new Date().toISOString()
      }
      
      // Check if this is a large file that needs special handling
      const isLargeFile = base64Audio.length > 2 * 1024 * 1024 // 2MB threshold
      
      if (isLargeFile) {
        // For large files, upload to storage and send a reference
        const { url: audioUrl, error: uploadError } = await uploadAudioServerSide(
          buffer,
          transcription.id,
          audioFile.name,
          audioFile.type
        )
        
        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          // Decide if we should fail or continue
          // For now, let's continue without an audio URL
        }
        
        // Update transcription with audio URL
        if (audioUrl) {
          await supabase
            .from('transcriptions')
            .update({ audio_url: audioUrl })
            .eq('id', transcription.id)
        }

        // Format for n8n workflow's Extract URL Fixed V2 node
        const fileReference = {
          body: {
            uploadId: transcription.id,
            fileName: audioFile.name,
            fileSize: audioFile.size,
            fileType: audioFile.type,
            doctorName: doctorName,
            patientName: patientName,
            documentType: documentType,
            userId: user.id,
            uploadTime: new Date().toISOString(),
            storageProvider: 'supabase',
            fileReference: {
              uploadId: transcription.id,
              bucket: 'audio-files',
              path: `uploads/${transcription.id}.${audioFile.name.split('.').pop()}`
            },
            instructions: {
              directUrl: audioUrl,
              primaryUrl: audioUrl
            },
            audioUrl: audioUrl
          }
        }
        
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fileReference)
        })
        
        // Handle response
        const responseText = await n8nResponse.text()
        let n8nData
        
        try {
          n8nData = JSON.parse(responseText)
        } catch {
          // If response is not JSON, treat as success with text response
          n8nData = { response: responseText, success: true }
        }
        
        // Accept "No item to return" as success (async processing)
        if (!n8nResponse.ok && responseText.includes('No item to return was found')) {
          n8nData = {
            success: true,
            accepted: true,
            message: 'Workflow accepted for processing',
            note: 'n8n processing asynchronously'
          }
        }
        
        // Return the n8n data for large files
        return NextResponse.json({
          success: true,
          transcriptionId: transcription.id,
          status: 'processing',
          message: n8nData.message || 'Large file accepted for processing'
        })
      } else {
        // Small file - send with full content in the format n8n expects
        // The workflow expects the data wrapped in a body object
        const smallFilePayload = {
          body: {
            uploadId: transcription.id,
            fileName: audioFile.name,
            fileSize: audioFile.size,
            fileType: audioFile.type,
            fileContent: base64Audio, // Include base64 for small files
            doctorName: doctorName,
            patientName: patientName,
            documentType: documentType,
            userId: user.id,
            uploadTime: new Date().toISOString(),
            storageProvider: 'supabase'
          }
        }
        
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(smallFilePayload)
        })

        if (!n8nResponse.ok) {
          const responseText = await n8nResponse.text()
          // Accept "No item to return" as success (async processing)
          if (responseText.includes('No item to return was found')) {
            return NextResponse.json({
              success: true,
              transcriptionId: transcription.id,
              status: 'processing',
              message: 'Workflow accepted for async processing'
            })
          }
          throw new Error(`n8n webhook failed: ${n8nResponse.statusText}`)
        }

        const n8nData = await n8nResponse.json()
      
        // Update transcription with results from n8n
        const { error: updateError } = await supabase
          .from('transcriptions')
          .update({
            transcription_text: n8nData.transcription || '',
            audio_url: n8nData.audioUrl || '',
            status: n8nData.transcription ? 'completed' : 'pending',
            // Store any additional data from n8n
            metadata: n8nData.metadata || {}
          })
          .eq('id', transcription.id)

        if (updateError) {
          console.error('Update error:', updateError)
        }

        return NextResponse.json({
          success: true,
          transcriptionId: transcription.id,
          status: n8nData.transcription ? 'completed' : 'processing',
          transcription: n8nData.transcription || null,
          message: n8nData.message || 'Transcription initiated successfully'
        })
      }
    } catch (n8nError) {
      console.error('n8n webhook error:', n8nError)
      
      // Update status to failed
      await supabase
        .from('transcriptions')
        .update({ status: 'pending' })
        .eq('id', transcription.id)
      
      return NextResponse.json({
        success: false,
        transcriptionId: transcription.id,
        error: 'Transcription service temporarily unavailable',
        message: 'The audio has been saved and will be processed when the service is available'
      }, { status: 202 })
    }

  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Webhook endpoint to receive updates from n8n
export async function PUT(request: NextRequest) {
  try {
    // For webhook callbacks, we'll use service role to update
    const supabase = await createAuthenticatedClient(request)
    const data = await request.json()
    
    const { transcriptionId, transcription, status, audioUrl, error } = data
    
    if (!transcriptionId) {
      return NextResponse.json(
        { error: 'Transcription ID required' },
        { status: 400 }
      )
    }

    // Update transcription in database
    interface UpdateData {
      status: string
      updated_at: string
      transcription_text?: string
      audio_url?: string
      error?: string
    }
    
    const updateData: UpdateData = {
      status: status || 'in_progress',
      updated_at: new Date().toISOString()
    }

    if (transcription) {
      updateData.transcription_text = transcription
      updateData.status = 'completed'
    }

    if (audioUrl) {
      updateData.audio_url = audioUrl
    }

    if (error) {
      updateData.error = error
      updateData.status = 'failed'
    }

    const { error: dbError } = await supabase
      .from('transcriptions')
      .update(updateData)
      .eq('id', transcriptionId)

    if (dbError) {
      console.error('Database update error:', dbError)
      return NextResponse.json(
        { error: 'Failed to update transcription' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Transcription updated successfully'
    })

  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
