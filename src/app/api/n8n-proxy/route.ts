import { NextRequest, NextResponse } from 'next/server'

// Cache for keeping track of in-flight requests to prevent duplicates
const inFlightRequests = new Map<string, Promise<NextResponse>>()

// Configure n8n webhook URL
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://a606159a0cea.ngrok-free.app/webhook/upload'

// Define payload interface
interface WebhookPayload {
  fileName?: string
  fileSize?: number | string
  uploadId?: string
  fileContent?: string | null
  audioFile?: string | null
  fileType?: string
  doctorName?: string
  patientName?: string
  documentType?: string
  uploadTime?: string
  [key: string]: unknown
}

// Helper to create a request key for deduplication
function getRequestKey(payload: WebhookPayload): string {
  return `${payload.fileName}_${payload.fileSize}_${payload.uploadId || Date.now()}`
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    
    // Check if this exact request is already in flight
    const requestKey = getRequestKey(payload)
    const existingRequest = inFlightRequests.get(requestKey)
    
    if (existingRequest) {
      console.log('🔄 Reusing existing request for:', requestKey)
      return existingRequest
    }
    
    // Create the request promise
    const requestPromise = processN8NRequest(payload, requestKey)
    
    // Store in flight request
    inFlightRequests.set(requestKey, requestPromise)
    
    // Clean up after completion
    requestPromise.finally(() => {
      inFlightRequests.delete(requestKey)
    })
    
    return requestPromise
  } catch (error) {
    console.error('N8N proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function processN8NRequest(payload: WebhookPayload, requestKey: string): Promise<NextResponse> {
  try {
    console.log(`🚀 Processing N8N request: ${requestKey}`)
    
    // Get the base64 audio content
    const base64Audio = payload.audioFile || payload.fileContent
    if (!base64Audio) {
      throw new Error('No audio content provided')
    }
    
    // Convert base64 to Buffer
    const audioBuffer = Buffer.from(base64Audio, 'base64')
    
    // Create FormData for multipart upload (n8n expects file upload, not JSON)
    const formData = new FormData()
    
    // Create a Blob from the buffer and append as file
    const audioBlob = new Blob([audioBuffer], { type: payload.fileType || 'audio/mpeg' })
    formData.append('file', audioBlob, payload.fileName || 'audio.mp3')
    
    // Add metadata fields
    formData.append('fileName', payload.fileName || 'audio.mp3')
    formData.append('fileSize', String(payload.fileSize || audioBuffer.length))
    formData.append('doctorName', payload.doctorName || '')
    formData.append('patientName', payload.patientName || '')
    formData.append('documentType', payload.documentType || '')
    formData.append('uploadId', payload.uploadId || '')
    formData.append('uploadTime', payload.uploadTime || new Date().toISOString())
    
    console.log('📦 Sending multipart form data to n8n webhook')
    console.log('📝 Form fields:', {
      fileName: payload.fileName,
      fileSize: payload.fileSize,
      doctorName: payload.doctorName,
      patientName: payload.patientName,
      documentType: payload.documentType,
      uploadId: payload.uploadId
    })
    
    // Use AbortController for timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'X-Request-ID': requestKey,
          // Don't set Content-Type - let fetch set it with boundary for multipart
        },
        body: formData,
        signal: controller.signal
      })
      
      clearTimeout(timeout)
      
      const responseText = await response.text()
      
      // Handle "No item to return" as success (async processing)
      if (!response.ok && responseText.includes('No item to return was found')) {
        return NextResponse.json({
          success: true,
          accepted: true,
          message: 'Workflow accepted for processing',
          requestId: requestKey,
          note: 'Processing asynchronously'
        }, { status: 202 })
      }
      
      // Handle other non-OK responses
      if (!response.ok) {
        console.error(`N8N webhook failed: ${response.status}`)
        return NextResponse.json({
          error: `N8N webhook failed: ${response.statusText}`,
          status: response.status,
          details: responseText.substring(0, 200)
        }, { status: response.status })
      }
      
      // Try to parse as JSON
      try {
        const data = JSON.parse(responseText)
        return NextResponse.json({
          success: true,
          data,
          requestId: requestKey
        })
      } catch {
        // If not JSON, return as text
        return NextResponse.json({
          success: true,
          response: responseText,
          requestId: requestKey
        })
      }
      
    } catch (error) {
      clearTimeout(timeout)
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('N8N request timeout')
        return NextResponse.json({
          error: 'Request timeout',
          message: 'The request took too long to complete',
          requestId: requestKey
        }, { status: 408 })
      }
      
      throw error
    }
    
  } catch (error) {
    console.error('N8N processing error:', error)
    return NextResponse.json({
      error: 'Failed to process N8N request',
      details: error instanceof Error ? error.message : 'Unknown error',
      requestId: requestKey
    }, { status: 500 })
  }
}
