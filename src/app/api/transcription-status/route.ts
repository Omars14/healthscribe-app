import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Create a service role client for server-side queries (bypasses RLS)
// Uses internal URL for faster Docker network communication
function createServiceClient() {
  // Prefer internal URL for server-to-server communication (faster in Docker)
  const supabaseUrl = process.env.SUPABASE_INTERNAL_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('SSE: Missing Supabase credentials')
    return null
  }
  
  // Log which URL we're using (helpful for debugging)
  const isInternal = supabaseUrl.includes('supabase-kong') || supabaseUrl.includes('localhost:8000')
  console.log(`SSE: Using ${isInternal ? 'internal' : 'public'} Supabase URL`)
  
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const transcriptionId = searchParams.get('id')
  
  if (!transcriptionId) {
    return new Response('Transcription ID required', { status: 400 })
  }
  
  // Create service role client for reliable server-side access
  const supabase = createServiceClient()
  if (!supabase) {
    return new Response('Server configuration error', { status: 500 })
  }
  
  // Create a readable stream for SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))
      
      let retryCount = 0
      const maxRetries = 180 // 3 minutes with 1 second intervals
      let lastStatus = ''
      let lastTextLength = 0
      
      // Set up interval to check for updates
      const interval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('transcriptions')
            .select('id, status, transcription_text, audio_url, error, updated_at')
            .eq('id', transcriptionId)
            .single()
          
          if (error) {
            console.error('Transcription status fetch error:', error)
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error.message || 'Failed to fetch transcription',
              details: error.details || 'Database query failed'
            })}\n\n`))
            clearInterval(interval)
            controller.close()
            return
          }
          
          if (data) {
            // Determine actual completion - check both status AND transcription_text presence
            const hasTranscriptionText = data.transcription_text && data.transcription_text.trim().length > 0
            const currentTextLength = data.transcription_text?.length || 0
            const statusChanged = data.status !== lastStatus
            const textChanged = currentTextLength !== lastTextLength
            
            // Consider completed if status says so OR if we have transcription text
            const isActuallyCompleted = data.status === 'completed' || hasTranscriptionText
            const effectiveStatus = isActuallyCompleted ? 'completed' : data.status
            
            // Only send updates if something changed
            if (statusChanged || textChanged || retryCount === 0) {
              lastStatus = data.status
              lastTextLength = currentTextLength
              
              // Send status update
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'status',
                data: {
                  id: data.id,
                  status: effectiveStatus,
                  transcription_text: data.transcription_text,
                  audio_url: data.audio_url,
                  error: data.error
                }
              })}\n\n`))
            }
            
            // If completed or failed, close the stream
            if (isActuallyCompleted || data.status === 'failed') {
              console.log(`SSE: Transcription ${transcriptionId} ${effectiveStatus}, closing stream`)
              // Include the full transcription data in the completion event
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'complete',
                status: effectiveStatus,
                data: {
                  id: data.id,
                  status: effectiveStatus,
                  transcription_text: data.transcription_text,
                  audio_url: data.audio_url,
                  error: data.error
                }
              })}\n\n`))
              clearInterval(interval)
              controller.close()
              return
            }
          }
          
          retryCount++
          if (retryCount >= maxRetries) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'timeout',
              error: 'Transcription status check timed out',
              message: 'The transcription service took too long to respond. Please refresh the page to check the status.'
            })}\n\n`))
            clearInterval(interval)
            controller.close()
          }
        } catch (error) {
          console.error('SSE error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: error instanceof Error ? error.message : 'Internal server error',
            details: 'An unexpected error occurred while checking transcription status'
          })}\n\n`))
          clearInterval(interval)
          controller.close()
        }
      }, 1000) // Check every second
      
      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })
  
  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable Nginx buffering
    }
  })
}
