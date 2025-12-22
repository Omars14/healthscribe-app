'use client'

import { useEffect, useRef, useCallback } from 'react'
import { subscribeToTranscriptionStatus, type TranscriptionStatus } from '@/lib/transcription-service'

interface TranscriptionUpdateOptions {
  /** IDs of transcriptions currently being processed */
  processingIds: Set<string>
  /** Callback when a transcription status updates */
  onStatusUpdate: (id: string, status: TranscriptionStatus) => void
  /** Callback when a transcription completes */
  onComplete?: (id: string, status: TranscriptionStatus) => void
  /** Callback when a transcription fails */
  onError?: (id: string, error: Error) => void
}

/**
 * Hook to manage SSE subscriptions for processing transcriptions.
 * Automatically subscribes to status updates for all processing transcriptions
 * and cleans up subscriptions when they complete or the component unmounts.
 */
export function useTranscriptionUpdates({
  processingIds,
  onStatusUpdate,
  onComplete,
  onError
}: TranscriptionUpdateOptions) {
  // Use refs to store callbacks to avoid stale closure issues
  const onStatusUpdateRef = useRef(onStatusUpdate)
  const onCompleteRef = useRef(onComplete)
  const onErrorRef = useRef(onError)
  
  // Track active subscriptions
  const subscriptionsRef = useRef<Map<string, () => void>>(new Map())

  // Update refs when callbacks change
  useEffect(() => {
    onStatusUpdateRef.current = onStatusUpdate
    onCompleteRef.current = onComplete
    onErrorRef.current = onError
  }, [onStatusUpdate, onComplete, onError])

  // Subscribe to new processing IDs and cleanup completed ones
  useEffect(() => {
    const currentSubscriptions = subscriptionsRef.current

    // Subscribe to new processing IDs
    processingIds.forEach(id => {
      if (!currentSubscriptions.has(id)) {
        console.log(`📡 SSE: Subscribing to transcription ${id}`)
        
        // Track if this transcription has already completed to avoid duplicate callbacks
        let hasCompleted = false
        
        const unsubscribe = subscribeToTranscriptionStatus(
          id,
          (status) => {
            console.log(`📡 SSE: Status update for ${id}:`, status.status, 'hasCompleted:', hasCompleted)
            
            // Always update status first
            onStatusUpdateRef.current(id, status)
            
            // If completed or failed, call appropriate callback and cleanup (only once)
            if (status.status === 'completed' && !hasCompleted) {
              hasCompleted = true
              console.log(`✅ SSE: Transcription ${id} completed - calling onComplete`)
              if (onCompleteRef.current) {
                onCompleteRef.current(id, status)
              }
              // Cleanup subscription
              const unsub = currentSubscriptions.get(id)
              if (unsub) {
                unsub()
                currentSubscriptions.delete(id)
              }
            } else if (status.status === 'failed' && !hasCompleted) {
              hasCompleted = true
              console.log(`❌ SSE: Transcription ${id} failed`)
              if (onErrorRef.current) {
                onErrorRef.current(id, new Error(status.error || 'Transcription failed'))
              }
              // Cleanup subscription
              const unsub = currentSubscriptions.get(id)
              if (unsub) {
                unsub()
                currentSubscriptions.delete(id)
              }
            }
          },
          (error) => {
            console.error(`❌ SSE: Error for transcription ${id}:`, error)
            if (onErrorRef.current && !hasCompleted) {
              hasCompleted = true
              onErrorRef.current(id, error instanceof Error ? error : new Error(String(error)))
            }
            // Cleanup on error
            const unsub = currentSubscriptions.get(id)
            if (unsub) {
              unsub()
              currentSubscriptions.delete(id)
            }
          }
        )
        
        currentSubscriptions.set(id, unsubscribe)
      }
    })

    // Cleanup subscriptions for IDs no longer processing
    currentSubscriptions.forEach((unsubscribe, id) => {
      if (!processingIds.has(id)) {
        console.log(`🔌 SSE: Unsubscribing from transcription ${id} (no longer processing)`)
        unsubscribe()
        currentSubscriptions.delete(id)
      }
    })

    // Cleanup all subscriptions on unmount
    return () => {
      console.log('🔌 SSE: Cleaning up all subscriptions')
      currentSubscriptions.forEach((unsubscribe) => {
        unsubscribe()
      })
      currentSubscriptions.clear()
    }
  }, [processingIds])

  // Return a function to manually unsubscribe from a specific ID
  const unsubscribe = useCallback((id: string) => {
    const unsub = subscriptionsRef.current.get(id)
    if (unsub) {
      console.log(`🔌 SSE: Manually unsubscribing from ${id}`)
      unsub()
      subscriptionsRef.current.delete(id)
    }
  }, [])

  return { unsubscribe }
}
