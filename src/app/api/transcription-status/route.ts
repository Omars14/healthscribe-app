import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const transcriptionId = searchParams.get('id')
  
  if (!transcriptionId) {
    return new Response('Transcription ID required', { status: 400 })
  }
  
  // Create a readable stream for SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`))
      
      let retryCount = 0
      const maxRetries = 120 // 2 minutes with 1 second intervals
      
      // Set up interval to check for updates
      const interval = setInterval(async () => {
        try {
          const { data, error } = await supabase
            .from('transcriptions')
            .select('*')
            .eq('id', transcriptionId)
            .single()
          
          if (error) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
              type: 'error', 
              error: 'Failed to fetch transcription' 
            })}\n\n`))
            clearInterval(interval)
            controller.close()
            return
          }
          
          if (data) {
            // Send status update
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              data: {
                id: data.id,
                status: data.status,
                transcription_text: data.transcription_text,
                audio_url: data.audio_url,
                error: data.error
              }
            })}\n\n`))
            
            // If completed or failed, close the stream
            if (data.status === 'completed' || data.status === 'failed') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
                type: 'complete',
                status: data.status 
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
              message: 'Status check timeout' 
            })}\n\n`))
            clearInterval(interval)
            controller.close()
          }
        } catch (error) {
          console.error('SSE error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
            type: 'error',
            error: 'Internal error' 
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
