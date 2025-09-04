import { supabase } from './supabase'
import { uploadDirectToStorage } from './direct-upload-service'

// Use optimized endpoint by default
const USE_OPTIMIZED_API = true

export interface TranscriptionRequest {
  audioFile: File
  doctorName: string
  patientName: string
  documentType: string
}

export interface TranscriptionResponse {
  success: boolean
  transcriptionId?: string
  status?: string
  transcription?: string
  message?: string
  error?: string
}

export interface TranscriptionStatus {
  id: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  transcription_text?: string
  audio_url?: string
  error?: string
}

/**
 * Submit audio file for transcription via n8n webhook
 * Now uploads directly to Supabase Storage to bypass Vercel's 4.5MB limit
 */
export async function submitTranscription(
  request: TranscriptionRequest
): Promise<TranscriptionResponse> {
  try {
    // Get the current session for user ID
    const { data: { session } } = await supabase.auth.getSession()
    const userId = session?.user?.id
    
    // Step 1: Upload file directly to Supabase Storage from client
    // This bypasses Vercel's 4.5MB limit entirely
    console.log('Uploading file directly to Supabase Storage...')
    const uploadResult = await uploadDirectToStorage({
      file: request.audioFile,
      userId
    })
    
    if (uploadResult.error) {
      throw new Error(uploadResult.error)
    }
    
    // Step 2: Send only metadata and storage URL to our API
    // This payload is tiny (just a few KB)
    const payload = {
      audioUrl: uploadResult.publicUrl,
      audioPath: uploadResult.path,
      fileName: request.audioFile.name,
      fileSize: request.audioFile.size,
      fileType: request.audioFile.type,
      doctorName: request.doctorName,
      patientName: request.patientName,
      documentType: request.documentType
    }
    
    const endpoint = USE_OPTIMIZED_API ? '/api/transcribe-optimized' : '/api/transcribe'
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit transcription')
    }

    return data
  } catch (error) {
    console.error('Transcription submission error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit transcription',
      message: 'Please try again or contact support if the issue persists'
    }
  }
}

/**
 * Check the status of a transcription
 */
export async function checkTranscriptionStatus(
  transcriptionId: string
): Promise<TranscriptionStatus | null> {
  try {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('id, status, transcription_text, audio_url, error')
      .eq('id', transcriptionId)
      .single()

    if (error) {
      console.error('Status check error:', error)
      return null
    }

    return data as TranscriptionStatus
  } catch (error) {
    console.error('Failed to check transcription status:', error)
    return null
  }
}

/**
 * Poll for transcription completion
 */
export async function pollTranscriptionStatus(
  transcriptionId: string,
  onUpdate?: (status: TranscriptionStatus) => void,
  maxAttempts: number = 60,
  intervalMs: number = 5000
): Promise<TranscriptionStatus | null> {
  let attempts = 0

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      attempts++

      const status = await checkTranscriptionStatus(transcriptionId)

      if (status) {
        if (onUpdate) {
          onUpdate(status)
        }

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval)
          resolve(status)
          return
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval)
        resolve(null)
      }
    }, intervalMs)
  })
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (!bytes || bytes === 0) return '-'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Validate audio file
 */
export function validateAudioFile(file: File): { valid: boolean; error?: string } {
  const MAX_SIZE = 100 * 1024 * 1024 // 100MB
  const ALLOWED_TYPES = [
    'audio/mpeg',
    'audio/wav',
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp3',
    'audio/x-wav',
    'audio/wave'
  ]

  if (file.size > MAX_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${formatFileSize(MAX_SIZE)}`
    }
  }

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|mp4)$/i)) {
    return {
      valid: false,
      error: 'Invalid audio format. Please upload MP3, WAV, M4A, OGG, or WebM files'
    }
  }

  return { valid: true }
}

/**
 * Extract audio duration (requires browser audio API)
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    const objectUrl = URL.createObjectURL(file)

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(objectUrl)
      resolve(audio.duration)
    })

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load audio file'))
    })

    audio.src = objectUrl
  })
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Subscribe to real-time transcription status updates via SSE
 */
export function subscribeToTranscriptionStatus(
  transcriptionId: string,
  onUpdate: (event: TranscriptionStatus) => void,
  onError?: (error: Error | Event) => void,
  onComplete?: () => void
): () => void {
  const eventSource = new EventSource(`/api/transcription-status?id=${transcriptionId}`)
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      
      if (data.type === 'status') {
        onUpdate(data.data)
      } else if (data.type === 'complete') {
        if (onComplete) onComplete()
        eventSource.close()
      } else if (data.type === 'error' || data.type === 'timeout') {
        if (onError) onError(data)
        eventSource.close()
      }
    } catch (error) {
      console.error('SSE parse error:', error)
      if (onError) onError(error instanceof Error ? error : new Error(String(error)))
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error)
    if (onError) onError(error)
    eventSource.close()
  }
  
  // Return cleanup function
  return () => {
    eventSource.close()
  }
}

/**
 * Submit transcription with real-time status updates
 */
export async function submitTranscriptionWithUpdates(
  request: TranscriptionRequest,
  onStatusUpdate?: (status: TranscriptionStatus) => void
): Promise<TranscriptionResponse> {
  try {
    // Submit the transcription
    const response = await submitTranscription(request)
    
    if (response.success && response.transcriptionId) {
      // Subscribe to status updates
      const unsubscribe = subscribeToTranscriptionStatus(
        response.transcriptionId,
        (status) => {
          if (onStatusUpdate) {
            onStatusUpdate(status)
          }
        },
        (error) => {
          console.error('Status update error:', error)
        },
        () => {
          console.log('Transcription complete')
        }
      )
      
      // Store unsubscribe function for later cleanup if needed
      const responseWithUnsubscribe = response as TranscriptionResponse & { unsubscribe?: () => void }
      responseWithUnsubscribe.unsubscribe = unsubscribe
    }
    
    return response
  } catch (error) {
    console.error('Submit with updates error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit transcription',
      message: 'Please try again'
    }
  }
}
