"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Upload, 
  FileAudio, 
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Save,
  Search,
  Loader2,
  Headphones,
  Zap,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  FolderUp,
  ChevronUp,
  ChevronDown,
  Keyboard,
  Clock,
  XCircle
} from 'lucide-react'
import { 
  submitTranscription,
  validateAudioFile,
  formatFileSize,
  formatDuration,
  type TranscriptionStatus
} from '@/lib/transcription-service'
import { uploadAudioToStorage, getSignedAudioUrl } from '@/lib/storage-service'
import { BulkUploadModal } from '@/components/bulk-upload-modal'
import { useTranscriptionUpdates } from '@/hooks/useTranscriptionUpdates'
import { supabase } from '@/lib/supabase'

interface Transcription {
  id: string
  file_name: string
  doctor_name: string
  patient_name: string
  document_type: string
  transcription_text: string
  audio_url: string
  created_at: string
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' // Make status optional
  file_size?: number
}

export default function TranscriptionistWorkspace() {
  const { user, session } = useAuth()
  
  // State management
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null)
  const [editingText, setEditingText] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showBulkUpload, setShowBulkUpload] = useState(false)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [lastSavedText, setLastSavedText] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const lastFetchTime = useRef<number>(0)

  // Audio player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackRate, setPlaybackRate] = useState(1)
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploadFormData, setUploadFormData] = useState({
    doctorName: '',
    patientName: '',
    documentType: 'consultation'
  })
  
  // Refs
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Handle real-time updates via SSE for processing transcriptions
  const handleStatusUpdate = useCallback((id: string, status: TranscriptionStatus) => {
    console.log('📡 Real-time status update:', { id, status: status.status })
    
    // Update the transcription in the list
    setTranscriptions(prev => {
      const updated = prev.map(t => {
        if (t.id === id) {
          const newStatus = status.transcription_text && status.transcription_text.trim() !== '' 
            ? 'completed' 
            : status.status
          return {
            ...t,
            status: newStatus,
            transcription_text: status.transcription_text || t.transcription_text,
            audio_url: status.audio_url || t.audio_url,
          }
        }
        return t
      })
      return updated
    })
    
    // Also update selected transcription if it matches
    setSelectedTranscription(prev => {
      if (prev && prev.id === id) {
        const newStatus = status.transcription_text && status.transcription_text.trim() !== '' 
          ? 'completed' 
          : status.status
        const updated = {
          ...prev,
          status: newStatus,
          transcription_text: status.transcription_text || prev.transcription_text,
          audio_url: status.audio_url || prev.audio_url,
        }
        // Update editing text if user hasn't made changes
        if (!hasUnsavedChanges && status.transcription_text) {
          setEditingText(status.transcription_text)
          setLastSavedText(status.transcription_text)
        }
        return updated
      }
      return prev
    })
  }, [hasUnsavedChanges])

  const handleTranscriptionComplete = useCallback((id: string, status: TranscriptionStatus) => {
    console.log('✅ Transcription completed:', id, 'with text:', status.transcription_text ? 'yes' : 'no')
    
    // Remove from processing IDs
    setProcessingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    
    // Update the transcription in the list with final data
    setTranscriptions(prev => prev.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status: 'completed' as const,
          transcription_text: status.transcription_text || t.transcription_text,
          audio_url: status.audio_url || t.audio_url,
        }
      }
      return t
    }))
    
    // Update selected transcription and editor if this is the selected one
    setSelectedTranscription(prev => {
      if (prev && prev.id === id) {
        const finalText = status.transcription_text || prev.transcription_text
        // Force update editor text with the completed transcription
        setEditingText(finalText)
        setLastSavedText(finalText)
        setHasUnsavedChanges(false)
        
        return {
          ...prev,
          status: 'completed' as const,
          transcription_text: finalText,
          audio_url: status.audio_url || prev.audio_url,
        }
      }
      return prev
    })
    
    // Show browser notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Transcription Complete! ✅', {
        body: 'Your transcription is ready to review',
        icon: '/favicon.ico',
        tag: id
      })
    }
    
    // Highlight the completed item in the list
    setTimeout(() => {
      const element = document.querySelector(`[data-transcription-id="${id}"]`)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        element.classList.add('ring-2', 'ring-green-500', 'transition-all')
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-green-500')
        }, 3000)
      }
    }, 100)
  }, [])

  const handleTranscriptionError = useCallback((id: string, error: Error) => {
    console.error('❌ Transcription error:', id, error)
    
    // Remove from processing IDs
    setProcessingIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    
    // Update status to failed
    setTranscriptions(prev => prev.map(t => 
      t.id === id ? { ...t, status: 'failed' } : t
    ))
  }, [])

  // Use the SSE hook for real-time updates
  useTranscriptionUpdates({
    processingIds,
    onStatusUpdate: handleStatusUpdate,
    onComplete: handleTranscriptionComplete,
    onError: handleTranscriptionError
  })

  // Initial fetch when user loads
  useEffect(() => {
    if (user?.id) {
      console.log('🔄 Initial fetchTranscriptions triggered for user:', user.id)
      fetchTranscriptions()
    }
  }, [user?.id])

  // SUPABASE REALTIME: Subscribe to database changes for instant updates
  useEffect(() => {
    if (!user?.id || !supabase) return

    console.log('📡 Setting up Supabase Realtime subscription for user:', user.id)

    // Subscribe to all changes on transcriptions for this user
    const channel = supabase
      .channel('transcription-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transcriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload: { new: Record<string, any> }) => {
          console.log('📡 Realtime UPDATE received:', payload.new.id, payload.new.status)
          
          const data = payload.new as any
          const hasText = data.transcription_text && data.transcription_text.trim().length > 0
          const effectiveStatus = hasText ? 'completed' : data.status
          
          // Update the transcription in the list
          setTranscriptions(prev => prev.map(t => {
            if (t.id === data.id) {
              return {
                ...t,
                status: effectiveStatus,
                transcription_text: data.transcription_text || t.transcription_text,
                audio_url: data.audio_url || t.audio_url,
              }
            }
            return t
          }))
          
          // Update selected transcription if it matches
          setSelectedTranscription(prev => {
            if (prev && prev.id === data.id) {
              const finalText = data.transcription_text || prev.transcription_text
              
              // Update editor if user hasn't made changes and we have new text
              if (data.transcription_text && data.transcription_text !== prev.transcription_text) {
                setEditingText(finalText)
                setLastSavedText(finalText)
                setHasUnsavedChanges(false)
              }
              
              return {
                ...prev,
                status: effectiveStatus,
                transcription_text: finalText,
                audio_url: data.audio_url || prev.audio_url,
              }
            }
            return prev
          })
          
          // Remove from processing IDs if completed
          if (effectiveStatus === 'completed' || data.status === 'failed') {
            setProcessingIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(data.id)
              return newSet
            })
            
            // Show notification
            if (effectiveStatus === 'completed' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('Transcription Complete! ✅', {
                body: 'Your transcription is ready to review',
                icon: '/favicon.ico',
                tag: data.id
              })
            }
          }
        }
      )
      .subscribe((status: string) => {
        console.log('📡 Realtime subscription status:', status)
      })

    return () => {
      console.log('📡 Cleaning up Realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // FALLBACK: Polling mechanism for processing transcriptions
  // This ensures updates are received even if SSE fails
  useEffect(() => {
    // Only poll when there are processing items
    if (processingIds.size === 0 || !user?.id) {
      return
    }

    console.log('🔄 Starting fallback polling for', processingIds.size, 'processing items')
    
    const pollInterval = setInterval(async () => {
      // Check each processing ID for updates
      const idsToCheck = Array.from(processingIds)
      
      for (const id of idsToCheck) {
        try {
          const response = await fetch(`/api/transcribe-optimized?id=${id}`)
          if (!response.ok) continue
          
          const result = await response.json()
          if (!result.success || !result.transcription) continue
          
          const data = result.transcription
          const hasText = data.transcription_text && data.transcription_text.trim().length > 0
          const isComplete = data.status === 'completed' || hasText
          
          if (isComplete || data.status === 'failed') {
            console.log('🔄 Fallback poll found completed transcription:', id)
            
            // Update the transcription
            const status: TranscriptionStatus = {
              id: data.id,
              status: hasText ? 'completed' : data.status,
              transcription_text: data.transcription_text,
              audio_url: data.audio_url,
              error: data.error
            }
            
            // Trigger the same handlers as SSE would
            handleStatusUpdate(id, status)
            
            if (status.status === 'completed') {
              handleTranscriptionComplete(id, status)
            } else if (status.status === 'failed') {
              handleTranscriptionError(id, new Error(data.error || 'Transcription failed'))
            }
          }
        } catch (error) {
          console.error('Fallback poll error for', id, error)
        }
      }
    }, 5000) // Poll every 5 seconds

    return () => {
      console.log('🔄 Stopping fallback polling')
      clearInterval(pollInterval)
    }
  }, [processingIds, user?.id, handleStatusUpdate, handleTranscriptionComplete, handleTranscriptionError])

  useEffect(() => {
    if (selectedTranscription) {
      console.log('📄 Transcription selected:', {
        id: selectedTranscription.id,
        fileName: selectedTranscription.file_name,
        hasAudioUrl: !!selectedTranscription.audio_url,
        audioUrl: selectedTranscription.audio_url ? selectedTranscription.audio_url.substring(0, 100) + '...' : 'MISSING',
        status: selectedTranscription.status,
        audioUrlValid: selectedTranscription.audio_url ? (
          selectedTranscription.audio_url.startsWith('http') ? 'valid URL' : 'invalid - missing http'
        ) : 'no URL'
      })
      const initialText = selectedTranscription.transcription_text || ''
      setEditingText(initialText)
      setLastSavedText(initialText)
      setHasUnsavedChanges(false)
    }
  }, [selectedTranscription])

  // Track unsaved changes
  useEffect(() => {
    if (selectedTranscription) {
      const hasChanges = editingText !== lastSavedText
      setHasUnsavedChanges(hasChanges)
    }
  }, [editingText, lastSavedText, selectedTranscription])

  // Keyboard shortcuts for audio control
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        return
      }

      if (!selectedTranscription || !audioRef.current) {
        return
      }

      // Space bar - play/pause
      if (e.code === 'Space') {
        e.preventDefault()
        if (isPlaying) {
          audioRef.current.pause()
        } else {
          audioRef.current.play()
        }
        setIsPlaying(!isPlaying)
      }
      
      // Arrow keys - skip forward/backward
      if (e.code === 'ArrowLeft') {
        e.preventDefault()
        audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
      }
      
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        audioRef.current.currentTime = Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + 10)
      }

      // Number keys 1-6 for speed control
      const speedMap: { [key: string]: number } = {
        'Digit1': 0.5,
        'Digit2': 0.75,
        'Digit3': 1,
        'Digit4': 1.25,
        'Digit5': 1.5,
        'Digit6': 2
      }
      
      if (speedMap[e.code]) {
        e.preventDefault()
        const newRate = speedMap[e.code]
        setPlaybackRate(newRate)
        audioRef.current.playbackRate = newRate
      }

      // Ctrl+S to save
      if (e.ctrlKey && e.code === 'KeyS') {
        e.preventDefault()
        if (selectedTranscription && !saving) {
          handleSaveTranscription()
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedTranscription, isPlaying, saving])

  // Warn about unsaved changes before page unload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const fetchTranscriptions = async (showLoadingState = true, forceRefresh = false) => {
    try {
      // Prevent duplicate concurrent API calls
      if (isFetching) {
        console.log('🚫 WORKSPACE: Skipping fetch - already fetching')
        return
      }

      // Simple debounce - wait at least 1 second between fetches
      const now = Date.now()
      const timeSinceLastFetch = now - lastFetchTime.current
      if (!forceRefresh && timeSinceLastFetch < 1000) {
        console.log('🚫 WORKSPACE: Skipping fetch - too soon since last fetch')
        return
      }

      console.log('🚀 WORKSPACE: fetchTranscriptions called')
      setIsFetching(true)
      lastFetchTime.current = now

      if (showLoadingState) {
        setLoading(true)
      }

      if (!user?.id) {
        console.log('❌ WORKSPACE: No authenticated user found')
        setTranscriptions([])
        setLoading(false)
        setIsFetching(false)
        return
      }
      
      // Use API route with userId parameter to filter user's transcriptions only
      const response = await fetch(`/api/workspace-transcriptions?userId=${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Workspace API request failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('🚀 WORKSPACE: API Response:', { 
        success: result.success,
        count: result.count
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Workspace API request failed')
      }
      
      const data = result.transcriptions
      
      // Track which transcriptions are processing
      const newProcessingIds = new Set<string>()
      
      // Compute status with transcription_text taking precedence
      const transcriptionsWithStatus = (data || []).map((t: any) => {
        let computedStatus: 'pending' | 'in_progress' | 'completed' | 'failed'
        
        if (t.transcription_text && String(t.transcription_text).trim() !== '') {
          computedStatus = 'completed'
        } else if (t.status) {
          computedStatus = t.status
        } else {
          computedStatus = 'pending'
        }
        
        // Track processing items for SSE subscriptions
        if (computedStatus === 'in_progress' || computedStatus === 'pending') {
          newProcessingIds.add(t.id)
        }
        
        return {
          ...t,
          status: computedStatus
        }
      })
      
      setTranscriptions(transcriptionsWithStatus)

      // Auto-update selected transcription if it exists in the new data
      if (selectedTranscription) {
        const updatedSelected = transcriptionsWithStatus.find((t: Transcription) => t.id === selectedTranscription.id)
        if (updatedSelected) {
          const hasNewText = updatedSelected.transcription_text && 
            updatedSelected.transcription_text !== selectedTranscription.transcription_text
          const wasProcessing = selectedTranscription.status === 'pending' || selectedTranscription.status === 'in_progress'
          const isNowComplete = updatedSelected.status === 'completed'
          
          if (hasNewText || (wasProcessing && isNowComplete)) {
            console.log('✨ Auto-updating selected transcription with new data')
            setSelectedTranscription(updatedSelected)
            if (!hasUnsavedChanges && updatedSelected.transcription_text) {
              setEditingText(updatedSelected.transcription_text)
              setLastSavedText(updatedSelected.transcription_text)
            }
          }
        }
      }

      // Update processingIds for SSE hook
      setProcessingIds(prev => {
        // Merge existing processing IDs with new ones to avoid losing subscriptions
        const merged = new Set([...prev].filter(id => newProcessingIds.has(id)))
        newProcessingIds.forEach(id => merged.add(id))
        return merged
      })

      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching transcriptions:', error)
    } finally {
      setLoading(false)
      setIsFetching(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('📁 File selected:', file.name, file.type, file.size)
      setSelectedFile(file)
    }
  }

  const triggerFileInput = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    console.log('🖱️ Triggering file input click, ref exists:', !!fileInputRef.current)
    if (fileInputRef.current) {
      fileInputRef.current.value = '' // Reset to allow selecting same file
      fileInputRef.current.click()
    } else {
      console.error('❌ File input ref is null')
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return
    
    // Validate file
    const validation = validateAudioFile(selectedFile)
    if (!validation.valid) {
      alert(validation.error)
      return
    }
    
    // Check required fields
    if (!uploadFormData.doctorName || !uploadFormData.patientName) {
      alert('Please fill in doctor and patient names')
      return
    }
    
    setUploading(true)
    setUploadProgress(10)
    
    console.log('📤 Starting upload:', selectedFile.name)
    
    try {
      // Submit transcription - SSE hook will handle real-time updates
      const response = await submitTranscription({
        audioFile: selectedFile,
        doctorName: uploadFormData.doctorName,
        patientName: uploadFormData.patientName,
        documentType: uploadFormData.documentType
      })
      
      if (response.success && response.transcriptionId) {
        console.log(`✅ Upload successful, ID: ${response.transcriptionId}`)
        setUploadProgress(50)
        
        // Add to processing IDs - SSE hook will automatically subscribe
        setProcessingIds(prev => {
          const newSet = new Set(prev)
          newSet.add(response.transcriptionId!)
          return newSet
        })
        
        // Fetch to show the new transcription in the list
        console.log('🔄 Fetching transcriptions to show new upload...')
        await fetchTranscriptions(false, true)
        
        setUploadProgress(100)
        
        // Find and select the newly uploaded item
        setTimeout(() => {
          setTranscriptions(prev => {
            const newItem = prev.find(t => t.id === response.transcriptionId)
            if (newItem) {
              console.log('✅ Found new upload in list:', newItem.file_name)
              setSelectedTranscription(newItem)
              
              // Scroll to it and highlight
              setTimeout(() => {
                const element = document.querySelector(`[data-transcription-id="${response.transcriptionId}"]`)
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                  element.classList.add('ring-2', 'ring-blue-500', 'transition-all')
                  setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-blue-500')
                  }, 4000)
                }
              }, 100)
            } else {
              console.warn('⚠️ New upload not found in list, will appear on next refresh')
            }
            return prev
          })
        }, 300)
        
        // Clear form
        setSelectedFile(null)
        setUploadFormData({ doctorName: '', patientName: '', documentType: 'consultation' })
        setUploading(false)
        setUploadProgress(0)
        
        console.log('✅ Upload submitted - SSE will provide real-time updates')
      } else {
        console.error('❌ Upload response not successful:', response)
        throw new Error(response.error || 'Failed to submit transcription')
      }
    } catch (error) {
      console.error('❌ Upload error:', error)
      
      let errorMessage = 'Failed to upload file. Please try again.'
      if (error instanceof Error) {
        if (error.message.includes('JSON')) {
          errorMessage = 'Server error: Invalid response. Please check your connection and try again.'
        } else if (error.message.includes('Network')) {
          errorMessage = 'Network error: Please check your internet connection.'
        } else {
          errorMessage = error.message
        }
      }
      
      alert(errorMessage)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      setDeletingId(id)

      // Get auth token from AuthContext
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch(`/api/transcriptions/${id}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete transcription')
      }

      // Remove from local state
      setTranscriptions(prev => prev.filter(t => t.id !== id))
      if (selectedTranscription?.id === id) {
        setSelectedTranscription(null)
      }
      
      // Reset confirmation
      setShowDeleteConfirm(null)
      
      console.log('Transcription deleted successfully')
    } catch (error) {
      console.error('Failed to delete transcription:', error)
      alert('Failed to delete transcription. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleSaveTranscription = async () => {
    if (!selectedTranscription) return

    setSaving(true)
    try {
      const newStatus: 'completed' | 'pending' = (editingText && editingText.trim() !== '') ? 'completed' : 'pending'

      console.log('💾 Saving transcription:', selectedTranscription.id)

      const response = await fetch(`/api/transcriptions/${selectedTranscription.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription_text: editingText,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to save transcription')
      }

      console.log('✅ Transcription saved successfully')

      // Update local state with the response data
      const updatedTranscription = result.transcription
      setTranscriptions(prev =>
        prev.map(t => t.id === selectedTranscription.id
          ? { ...t, ...updatedTranscription, status: updatedTranscription.status as 'completed' | 'pending' }
          : t
        )
      )
      setSelectedTranscription(prev =>
        prev ? { ...prev, ...updatedTranscription, status: updatedTranscription.status as 'completed' | 'pending' } : null
      )

      // Update tracking state
      setLastSavedText(editingText)
      setHasUnsavedChanges(false)

      // Show success feedback (using a more modern approach)
      console.log('✅ Transcription saved successfully!')
    } catch (error) {
      console.error('Error saving transcription:', error)
      alert(`Failed to save transcription: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setSaving(false)
    }
  }

  const togglePlayPause = () => {
    if (!audioRef.current) {
      console.error('❌ Audio ref not available')
      return
    }
    
    const audio = audioRef.current
    
    // Debug: Check audio state before playing
    console.log('🎵 Audio element state:', {
      src: audio.src,
      duration: audio.duration,
      currentTime: audio.currentTime,
      readyState: audio.readyState,
      canPlay: audio.readyState >= 2,
      error: audio.error?.message || 'none'
    })
    
    if (isPlaying) {
      console.log('⏸️ Pausing audio')
      audio.pause()
    } else {
      console.log('▶️ Playing audio from', audio.currentTime, 'seconds')
      audio.play().catch(err => {
        console.error('❌ Play error:', err)
        alert(`Failed to play audio: ${err.message}`)
      })
    }
    setIsPlaying(!isPlaying)
  }

  const skipBackward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    }
  }

  const skipForward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(duration, audioRef.current.currentTime + 10)
    }
  }

  const changePlaybackRate = () => {
    const rates = [0.5, 0.75, 1, 1.25, 1.5, 2]
    const currentIndex = rates.indexOf(playbackRate)
    const nextIndex = (currentIndex + 1) % rates.length
    const newRate = rates[nextIndex]
    
    setPlaybackRate(newRate)
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50'
      case 'in_progress': return 'text-yellow-600 bg-yellow-50'
      case 'pending': return 'text-blue-600 bg-blue-50'
      case 'failed': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-3 w-3" />
      case 'in_progress': return <Loader2 className="h-3 w-3 animate-spin" />
      case 'pending': return <Clock className="h-3 w-3" />
      case 'failed': return <XCircle className="h-3 w-3" />
      default: return null
    }
  }

  const filteredTranscriptions = transcriptions.filter(t => {
    const matchesSearch = t.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Transcriptionist Workspace</h1>
            <p className="text-muted-foreground">Upload, transcribe, and edit medical dictations</p>
          </div>
          <div className="flex gap-2 items-center">
            {processingIds.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{processingIds.size} processing...</span>
              </div>
            )}
            <Button variant="outline" onClick={() => fetchTranscriptions(false, true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => setShowBulkUpload(true)}>
              <FolderUp className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Audio
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left Column - File List & Upload */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upload Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Upload</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Input 
                    placeholder="Doctor Name"
                    value={uploadFormData.doctorName}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, doctorName: e.target.value }))}
                  />
                  <Input 
                    placeholder="Patient Name"
                    value={uploadFormData.patientName}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, patientName: e.target.value }))}
                  />
                  <select 
                    className="w-full h-9 px-3 rounded-md border border-input bg-background"
                    value={uploadFormData.documentType}
                    onChange={(e) => setUploadFormData(prev => ({ ...prev, documentType: e.target.value }))}
                  >
                    <option value="consultation">Consultation</option>
                    <option value="surgery">Surgery Report</option>
                    <option value="discharge">Discharge Summary</option>
                    <option value="progress">Progress Note</option>
                  </select>
                </div>
                
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors relative ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  } ${selectedFile ? 'bg-primary/5' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg,.opus,.webm,.mp4,.flac,.amr,.3gp"
                    onChange={handleFileSelect}
                  />
                  {selectedFile ? (
                    <div className="space-y-2">
                      <FileAudio className="h-8 w-8 mx-auto text-primary" />
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Drop audio file or click to browse
                      </p>
                    </>
                  )}
                </div>
                
                {selectedFile && (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {uploadProgress > 0 ? `Processing... ${uploadProgress}%` : 'Uploading...'}
                        </>
                      ) : (
                        <>
                          <Zap className="h-4 w-4 mr-2" />
                          Process with AI
                        </>
                      )}
                    </Button>

                    {uploading && uploadProgress > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Transcription List */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Transcriptions</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTranscriptions(true, true)}
                    disabled={isFetching}
                    className="h-8 px-3 text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
                <div className="flex gap-2 mt-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search..." 
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    className="px-3 rounded-md border border-input bg-background text-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'in_progress' | 'completed')}
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  {filteredTranscriptions.map((transcription) => (
                    <div
                      key={transcription.id}
                      data-transcription-id={transcription.id}
                      className={`relative group border-b cursor-pointer hover:bg-accent/50 transition-colors ${
                        selectedTranscription?.id === transcription.id ? 'bg-accent' : ''
                      }`}
                    >
                      <div 
                        onClick={() => setSelectedTranscription(transcription)}
                        className="p-3 pr-10"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {transcription.file_name || 'Untitled'}
                            </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Dr. {transcription.doctor_name} • {transcription.patient_name}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-xs text-muted-foreground">
                                  {new Date(transcription.created_at).toLocaleDateString()}
                                </p>
                                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${getStatusColor(transcription.status || 'pending')}`}>
                                  {getStatusIcon(transcription.status || 'pending')}
                                  {transcription.status === 'in_progress' ? 'Processing' : transcription.status}
                                </span>
                              </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Delete button - positioned absolutely */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowDeleteConfirm(transcription.id)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 rounded-md hover:bg-destructive/10"
                        title="Delete transcription"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive transition-colors" />
                      </button>
                      
                      {/* Delete confirmation dialog - overlay style */}
                      {showDeleteConfirm === transcription.id && (
                        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm rounded z-10 flex items-center justify-center p-3">
                          <div className="w-full max-w-xs">
                            <div className="flex items-center gap-2 mb-2 text-destructive">
                              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                              <span className="font-semibold text-sm">Delete Transcription?</span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              This action cannot be undone.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(transcription.id)
                                }}
                                disabled={deletingId === transcription.id}
                                className="flex-1 h-8 text-xs"
                              >
                                {deletingId === transcription.id ? (
                                  <>
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    Deleting
                                  </>
                                ) : (
                                  'Delete'
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setShowDeleteConfirm(null)
                                }}
                                className="flex-1 h-8 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Editor & Player */}
          <div className="lg:col-span-2 space-y-4">
            {selectedTranscription ? (
              <>
                {/* Audio Player */}
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      {/* Player Info */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold">{selectedTranscription.file_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Dr. {selectedTranscription.doctor_name} • {selectedTranscription.patient_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Speed control buttons */}
                          <div className="flex items-center gap-1 bg-muted/50 rounded-md p-1">
                            <button
                              onClick={() => {
                                const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
                                const currentIndex = speeds.indexOf(playbackRate)
                                if (currentIndex > 0) {
                                  const newRate = speeds[currentIndex - 1]
                                  setPlaybackRate(newRate)
                                  if (audioRef.current) audioRef.current.playbackRate = newRate
                                }
                              }}
                              className="p-1 hover:bg-background rounded transition-colors disabled:opacity-50"
                              disabled={playbackRate <= 0.5}
                              title="Decrease speed"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            <span className="px-2 text-sm font-medium min-w-[3rem] text-center">
                              {playbackRate}x
                            </span>
                            <button
                              onClick={() => {
                                const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2]
                                const currentIndex = speeds.indexOf(playbackRate)
                                if (currentIndex < speeds.length - 1) {
                                  const newRate = speeds[currentIndex + 1]
                                  setPlaybackRate(newRate)
                                  if (audioRef.current) audioRef.current.playbackRate = newRate
                                }
                              }}
                              className="p-1 hover:bg-background rounded transition-colors disabled:opacity-50"
                              disabled={playbackRate >= 2}
                              title="Increase speed"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Audio Element */}
                      {selectedTranscription.audio_url ? (
                        <audio
                          ref={audioRef}
                          src={selectedTranscription.audio_url}
                          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                          onLoadedMetadata={(e) => {
                            const target = e.currentTarget as HTMLAudioElement
                            console.log('✅ Audio loaded, duration:', target.duration, 'seconds')
                            console.log('🔊 Audio MIME type:', (target as any).type || 'unknown')
                            setDuration(target.duration)
                          }}
                          onEnded={() => {
                            console.log('🎵 Audio playback ended')
                            setIsPlaying(false)
                          }}
                          onError={(e) => {
                            console.error('❌ Audio error:', {
                              errorCode: e.currentTarget.error?.code,
                              errorMessage: e.currentTarget.error?.message,
                              audioSrc: e.currentTarget.src,
                              networkState: e.currentTarget.networkState,
                              readyState: e.currentTarget.readyState
                            })
                            alert(`Audio loading error: ${e.currentTarget.error?.message || 'Unknown error'}`)
                          }}
                          onCanPlay={() => {
                            console.log('✅ Audio can play')
                          }}
                          onLoadStart={() => {
                            console.log('📄 Audio loading started')
                            console.log('  URL:', selectedTranscription.audio_url)
                            console.log('  Valid URL:', selectedTranscription.audio_url.startsWith('http'))
                          }}
                          onDurationChange={(e) => {
                            console.log('⏱️ Duration changed:', e.currentTarget.duration)
                          }}
                          crossOrigin="anonymous"
                          preload="metadata"
                        />
                      ) : (
                        <div className="bg-amber-50 p-4 rounded text-amber-700 text-sm">
                          ⚠️ No audio URL available for this transcription
                        </div>
                      )}

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-primary transition-all"
                            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </div>
                      </div>

                      {/* Player Controls */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={skipBackward}
                            title="Skip back 10s (←)"
                          >
                            <SkipBack className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            onClick={togglePlayPause}
                            title="Play/Pause (Space)"
                          >
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={skipForward}
                            title="Skip forward 10s (→)"
                          >
                            <SkipForward className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Keyboard shortcuts hint */}
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Keyboard className="h-3 w-3" />
                          <span>Space: Play/Pause • ←→: Skip 10s • 1-6: Speed</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Transcription Editor */}
                <Card className="flex-1">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">Transcription Editor</CardTitle>
                        {hasUnsavedChanges && (
                          <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Unsaved changes
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Export
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveTranscription}
                          disabled={saving || !hasUnsavedChanges}
                          className={hasUnsavedChanges ? "bg-primary hover:bg-primary/90" : ""}
                        >
                          {saving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Save {hasUnsavedChanges ? "(Ctrl+S)" : ""}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      ref={textAreaRef}
                      className="w-full h-[400px] p-3 rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      placeholder="Transcription text will appear here..."
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Words: {editingText.split(/\s+/).filter(w => w).length}</span>
                      <span>Characters: {editingText.length}</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="h-full flex items-center justify-center">
                <CardContent className="text-center py-12">
                  <Headphones className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Transcription Selected</h3>
                  <p className="text-muted-foreground">
                    Select a transcription from the list or upload a new audio file to get started
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onComplete={() => {
          setShowBulkUpload(false)
          fetchTranscriptions(false, true) // Force refresh after bulk upload
        }}
      />
    </div>
  )
}
