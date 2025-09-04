'use client'

import React, { useState, useEffect, useRef } from 'react'
import { 
  Play, Pause, Download, Save, Edit3, Check, X, 
  FileText, Clock, User, Calendar, AlertCircle,
  Volume2, Copy, CheckCircle, Loader2, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface TranscriptionData {
  id: string
  status: string
  doctor_name: string
  patient_name: string
  document_type: string
  file_name: string
  audio_url: string
  transcription_text?: string
  formatted_text?: string
  final_text?: string
  created_at: string
  completed_at?: string
  duration?: number
  language?: string
  is_formatted?: boolean
  formatting_model?: string
  version?: number
  reviewed_at?: string
  reviewed_by?: string
  metadata?: any
}

interface TranscriptionReviewProps {
  transcriptionId: string
  onSave?: (finalText: string) => void
  onExport?: (format: 'pdf' | 'docx' | 'txt') => void
}

export function MedicalTranscriptionReview({ 
  transcriptionId,
  onSave,
  onExport 
}: TranscriptionReviewProps) {
  const [transcription, setTranscription] = useState<TranscriptionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editedText, setEditedText] = useState('')
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw' | 'edit'>('formatted')
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const { toast } = useToast()

  // Load transcription data
  useEffect(() => {
    loadTranscription()
    
    // Set up real-time subscription
    const channel = supabase
      .channel(`transcription-${transcriptionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transcriptions',
          filter: `id=eq.${transcriptionId}`
        },
        (payload) => {
          console.log('Transcription updated:', payload)
          setTranscription(payload.new as TranscriptionData)
          
          // Show notification if status changed to completed
          if (payload.new.status === 'completed' && payload.old?.status !== 'completed') {
            toast({
              title: 'Transcription Complete!',
              description: 'Your transcription has been processed and formatted.',
              duration: 5000
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [transcriptionId])

  const loadTranscription = async () => {
    try {
      setIsLoading(true)
      
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .single()

      if (error) throw error

      setTranscription(data)
      setEditedText(data.final_text || data.formatted_text || data.transcription_text || '')
      
    } catch (error) {
      console.error('Failed to load transcription:', error)
      toast({
        title: 'Error',
        description: 'Failed to load transcription',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!transcription) return

    setIsSaving(true)
    try {
      // Save the edited text as final version
      const { error } = await supabase
        .from('transcriptions')
        .update({
          final_text: editedText,
          reviewed_at: new Date().toISOString(),
          version: (transcription.version || 1) + 1
        })
        .eq('id', transcriptionId)

      if (error) throw error

      // Save to version history
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('transcription_edits')
          .insert({
            transcription_id: transcriptionId,
            edited_text: editedText,
            edit_type: 'review',
            edited_by: user.id,
            version: (transcription.version || 1) + 1
          })
      }

      toast({
        title: 'Saved Successfully',
        description: 'Your changes have been saved.',
      })

      setIsEditing(false)
      await loadTranscription()
      
      if (onSave) {
        onSave(editedText)
      }
    } catch (error) {
      console.error('Failed to save:', error)
      toast({
        title: 'Save Failed',
        description: 'Failed to save your changes.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to Clipboard',
      description: 'The text has been copied to your clipboard.',
      duration: 2000
    })
  }

  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    if (onExport) {
      onExport(format)
    } else {
      // Simple text export as fallback
      if (format === 'txt') {
        const text = editedText || transcription?.formatted_text || transcription?.transcription_text || ''
        const blob = new Blob([text], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${transcription?.patient_name?.replace(/\s+/g, '_')}_${transcription?.document_type}_${new Date().toISOString().split('T')[0]}.txt`
        a.click()
        URL.revokeObjectURL(url)
      } else {
        toast({
          title: 'Export',
          description: `Export to ${format.toUpperCase()} requires additional setup.`,
        })
      }
    }
  }

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'processing': return 'bg-blue-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getDocumentTypeDisplay = (type: string) => {
    const types: Record<string, string> = {
      'consultation': 'Consultation Note',
      'surgery_report': 'Surgery Report',
      'discharge_summary': 'Discharge Summary',
      'progress_note': 'Progress Note',
      'radiology_report': 'Radiology Report',
      'pathology_report': 'Pathology Report',
      'emergency_note': 'Emergency Note',
      'procedure_note': 'Procedure Note'
    }
    return types[type] || type
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading transcription...</span>
        </CardContent>
      </Card>
    )
  }

  if (!transcription) {
    return (
      <Card className="w-full">
        <CardContent className="py-12">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Transcription Not Found</AlertTitle>
            <AlertDescription>
              The requested transcription could not be found.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const displayText = transcription.final_text || transcription.formatted_text || transcription.transcription_text || ''
  const hasFormatted = !!transcription.formatted_text
  const hasRaw = !!transcription.transcription_text

  return (
    <div className="w-full space-y-4">
      {/* Header with metadata */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">Medical Transcription Review</CardTitle>
              <CardDescription className="mt-2">
                Review and edit the transcribed medical document
              </CardDescription>
            </div>
            <Badge className={`${getStatusColor(transcription.status)} text-white`}>
              {transcription.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Doctor</p>
              <p className="font-medium">{transcription.doctor_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Patient</p>
              <p className="font-medium">{transcription.patient_name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Document Type</p>
              <p className="font-medium">{getDocumentTypeDisplay(transcription.document_type)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="font-medium">
                {format(new Date(transcription.created_at), 'MMM dd, yyyy')}
              </p>
            </div>
          </div>

          {transcription.is_formatted && (
            <div className="mt-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                AI Formatted with {transcription.formatting_model || 'Gemini'}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audio Player */}
      {transcription.audio_url && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Volume2 className="h-5 w-5" />
              Audio Playback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <audio
                ref={audioRef}
                src={transcription.audio_url}
                onTimeUpdate={(e) => {
                  setAudioProgress(e.currentTarget.currentTime)
                }}
                onLoadedMetadata={(e) => {
                  setAudioDuration(e.currentTarget.duration)
                }}
                onEnded={() => setIsPlaying(false)}
              />
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={togglePlayPause}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <div className="flex-1">
                  <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
                      style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
                    />
                  </div>
                </div>
                
                <span className="text-sm text-muted-foreground min-w-[80px]">
                  {formatTime(audioProgress)} / {formatTime(audioDuration)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transcription Content */}
      <Card className="flex-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Transcription Content</CardTitle>
            <div className="flex gap-2">
              {!isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(true)
                      setActiveTab('edit')
                    }}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(displayText)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditedText(transcription.final_text || transcription.formatted_text || transcription.transcription_text || '')
                      setIsEditing(false)
                      setActiveTab('formatted')
                    }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="formatted" disabled={!hasFormatted}>
                Formatted
              </TabsTrigger>
              <TabsTrigger value="raw" disabled={!hasRaw}>
                Raw
              </TabsTrigger>
              <TabsTrigger value="edit" disabled={!isEditing}>
                Edit
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="formatted" className="mt-4">
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {transcription.formatted_text || 'No formatted text available'}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="raw" className="mt-4">
              <ScrollArea className="h-[500px] w-full rounded-md border p-4">
                <div className="whitespace-pre-wrap font-mono text-sm">
                  {transcription.transcription_text || 'No raw transcription available'}
                </div>
              </ScrollArea>
            </TabsContent>
            
            <TabsContent value="edit" className="mt-4">
              <Textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
                placeholder="Edit the transcription here..."
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Tip: Text marked with [?] indicates uncertainty and should be reviewed carefully.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleExport('txt')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export as TXT
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('docx')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Export as DOCX
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
            >
              <Download className="h-4 w-4 mr-2" />
              Export as PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Version History (if available) */}
      {transcription.version && transcription.version > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Version History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">v{transcription.version}</Badge>
                <span className="text-sm text-muted-foreground">
                  Current version
                </span>
                {transcription.reviewed_at && (
                  <span className="text-sm text-muted-foreground">
                    • Reviewed {format(new Date(transcription.reviewed_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
