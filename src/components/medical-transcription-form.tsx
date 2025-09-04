'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Upload, Mic, MicOff, FileAudio, AlertCircle, Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface DocumentTemplate {
  document_type: string
  display_name: string
  formatting_instructions: string
}

interface TranscriptionFormData {
  doctorName: string
  patientName: string
  documentType: string
  audioFile: File | null
  additionalNotes?: string
}

export function MedicalTranscriptionForm({ 
  onSubmitSuccess 
}: { 
  onSubmitSuccess?: (transcriptionId: string) => void 
}) {
  const [formData, setFormData] = useState<TranscriptionFormData>({
    doctorName: '',
    patientName: '',
    documentType: '',
    audioFile: null,
    additionalNotes: ''
  })

  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  
  const { toast } = useToast()

  // Load document templates on mount
  useEffect(() => {
    loadDocumentTemplates()
  }, [])

  const loadDocumentTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_name')

      if (error) throw error
      setDocumentTemplates(data || [])
    } catch (error) {
      console.error('Failed to load document templates:', error)
      // Set default templates if database fetch fails
      setDocumentTemplates([
        { document_type: 'consultation', display_name: 'Consultation Note', formatting_instructions: 'Standard consultation format' },
        { document_type: 'surgery_report', display_name: 'Surgery Report', formatting_instructions: 'Operative report format' },
        { document_type: 'discharge_summary', display_name: 'Discharge Summary', formatting_instructions: 'Discharge documentation' },
        { document_type: 'progress_note', display_name: 'Progress Note', formatting_instructions: 'SOAP note format' },
        { document_type: 'radiology_report', display_name: 'Radiology Report', formatting_instructions: 'Radiology findings format' },
        { document_type: 'pathology_report', display_name: 'Pathology Report', formatting_instructions: 'Pathology results format' }
      ])
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.doctorName.trim()) {
      newErrors.doctorName = 'Doctor name is required'
    }
    if (!formData.patientName.trim()) {
      newErrors.patientName = 'Patient name is required'
    }
    if (!formData.documentType) {
      newErrors.documentType = 'Document type is required'
    }
    if (!formData.audioFile) {
      newErrors.audioFile = 'Audio file is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a']
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|mp4)$/i)) {
        setErrors({ audioFile: 'Please upload a valid audio file (MP3, WAV, M4A, OGG, WebM)' })
        return
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024
      if (file.size > maxSize) {
        setErrors({ audioFile: 'File size must be less than 100MB' })
        return
      }

      setFormData({ ...formData, audioFile: file })
      setErrors({ ...errors, audioFile: '' })
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, {
          type: 'audio/webm'
        })
        setFormData({ ...formData, audioFile: audioFile })
        setErrors({ ...errors, audioFile: '' })
      }

      mediaRecorder.start()
      setIsRecording(true)
      
      toast({
        title: 'Recording started',
        description: 'Speak clearly into your microphone'
      })
    } catch (error) {
      console.error('Failed to start recording:', error)
      toast({
        title: 'Recording failed',
        description: 'Please check your microphone permissions',
        variant: 'destructive'
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      
      toast({
        title: 'Recording saved',
        description: 'Your audio has been captured'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      setUploadProgress(20)

      // Create FormData for API
      const formDataToSend = new FormData()
      formDataToSend.append('audio', formData.audioFile!)
      formDataToSend.append('doctorName', formData.doctorName)
      formDataToSend.append('patientName', formData.patientName)
      formDataToSend.append('documentType', formData.documentType)
      if (formData.additionalNotes) {
        formDataToSend.append('additionalNotes', formData.additionalNotes)
      }

      setUploadProgress(40)

      // Submit to API
      const response = await fetch('/api/transcribe-medical', {
        method: 'POST',
        body: formDataToSend
      })

      setUploadProgress(80)

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit transcription')
      }

      setUploadProgress(100)

      toast({
        title: 'Success!',
        description: 'Your audio has been submitted for transcription',
        duration: 5000
      })

      // Reset form
      setFormData({
        doctorName: '',
        patientName: '',
        documentType: '',
        audioFile: null,
        additionalNotes: ''
      })
      setSelectedTemplate(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Callback with transcription ID
      if (onSubmitSuccess && result.transcriptionId) {
        onSubmitSuccess(result.transcriptionId)
      }

    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to upload audio',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Medical Transcription Upload</CardTitle>
        <CardDescription>
          Upload audio for professional medical transcription with AI-powered formatting
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor Name */}
          <div className="space-y-2">
            <Label htmlFor="doctorName">Doctor Name *</Label>
            <Input
              id="doctorName"
              placeholder="Dr. John Smith"
              value={formData.doctorName}
              onChange={(e) => setFormData({ ...formData, doctorName: e.target.value })}
              className={errors.doctorName ? 'border-red-500' : ''}
              disabled={isUploading}
            />
            {errors.doctorName && (
              <p className="text-sm text-red-500">{errors.doctorName}</p>
            )}
          </div>

          {/* Patient Name */}
          <div className="space-y-2">
            <Label htmlFor="patientName">Patient Name *</Label>
            <Input
              id="patientName"
              placeholder="Jane Doe"
              value={formData.patientName}
              onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
              className={errors.patientName ? 'border-red-500' : ''}
              disabled={isUploading}
            />
            {errors.patientName && (
              <p className="text-sm text-red-500">{errors.patientName}</p>
            )}
          </div>

          {/* Document Type */}
          <div className="space-y-2">
            <Label htmlFor="documentType">Document Type *</Label>
            <Select
              value={formData.documentType}
              onValueChange={(value) => {
                setFormData({ ...formData, documentType: value })
                const template = documentTemplates.find(t => t.document_type === value)
                setSelectedTemplate(template || null)
              }}
              disabled={isUploading}
            >
              <SelectTrigger className={errors.documentType ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                {documentTemplates.map((template) => (
                  <SelectItem key={template.document_type} value={template.document_type}>
                    {template.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.documentType && (
              <p className="text-sm text-red-500">{errors.documentType}</p>
            )}
            {selectedTemplate && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {selectedTemplate.formatting_instructions}
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Audio Upload/Record */}
          <div className="space-y-2">
            <Label>Audio File *</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isRecording}
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>
              <Button
                type="button"
                variant={isRecording ? 'destructive' : 'outline'}
                className="flex-1"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={isUploading}
              >
                {isRecording ? (
                  <>
                    <MicOff className="mr-2 h-4 w-4" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Record Audio
                  </>
                )}
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            {formData.audioFile && (
              <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <FileAudio className="h-4 w-4 text-green-600" />
                <span className="text-sm">{formData.audioFile.name}</span>
                <Check className="h-4 w-4 text-green-600 ml-auto" />
              </div>
            )}
            {errors.audioFile && (
              <p className="text-sm text-red-500">{errors.audioFile}</p>
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
            <Textarea
              id="additionalNotes"
              placeholder="Any special instructions or context..."
              value={formData.additionalNotes}
              onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
              rows={3}
              disabled={isUploading}
            />
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Processing your transcription...
              </p>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isUploading || isRecording}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Submit for Transcription
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
