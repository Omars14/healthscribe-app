'use client'

import React, { useState, useRef } from 'react'
import { 
  Upload, 
  X, 
  FileAudio, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  PlayCircle,
  PauseCircle,
  RotateCcw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase'

interface FileUploadItem {
  id: string
  file: File
  doctorName: string
  patientName: string
  documentType: string
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  transcriptionId?: string
}

interface BulkUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete?: () => void
}

export function BulkUploadModal({ isOpen, onClose, onComplete }: BulkUploadModalProps) {
  const [files, setFiles] = useState<FileUploadItem[]>([])
  const [defaultDoctorName, setDefaultDoctorName] = useState('')
  const [defaultDocumentType, setDefaultDocumentType] = useState('consultation')
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const { toast } = useToast()

  const documentTypes = [
    { value: 'consultation', label: 'Consultation Note' },
    { value: 'surgery', label: 'Surgery Report' },
    { value: 'discharge', label: 'Discharge Summary' },
    { value: 'progress', label: 'Progress Note' },
    { value: 'radiology', label: 'Radiology Report' },
    { value: 'pathology', label: 'Pathology Report' }
  ]

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) return

    const newFiles: FileUploadItem[] = []
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      
      // Validate file type
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/m4a', 'audio/x-m4a']
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a|ogg|webm|mp4)$/i)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name} is not a valid audio file`,
          variant: 'destructive'
        })
        continue
      }

      // Validate file size (max 100MB)
      const maxSize = 100 * 1024 * 1024
      if (file.size > maxSize) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds 100MB limit`,
          variant: 'destructive'
        })
        continue
      }

      // Extract patient name from filename (if formatted like "PatientName_DoctorName_Date.mp3")
      let patientName = ''
      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
      const parts = fileNameWithoutExt.split('_')
      if (parts.length > 0) {
        patientName = parts[0].replace(/([A-Z])/g, ' $1').trim()
      }

      newFiles.push({
        id: `${Date.now()}-${i}`,
        file,
        doctorName: defaultDoctorName,
        patientName: patientName || fileNameWithoutExt,
        documentType: defaultDocumentType,
        status: 'pending',
        progress: 0
      })
    }

    setFiles(prev => [...prev, ...newFiles])
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const updateFileField = (id: string, field: keyof FileUploadItem, value: any) => {
    setFiles(prev => prev.map(f => 
      f.id === id ? { ...f, [field]: value } : f
    ))
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadSingleFile = async (fileItem: FileUploadItem): Promise<void> => {
    try {
      // Update status to uploading
      updateFileField(fileItem.id, 'status', 'uploading')
      updateFileField(fileItem.id, 'progress', 20)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(7)
      const fileExt = fileItem.file.name.split('.').pop()
      const fileName = `${timestamp}-${randomId}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to Supabase storage
      updateFileField(fileItem.id, 'progress', 40)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('audio-files')
        .upload(filePath, fileItem.file)

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('audio-files')
        .getPublicUrl(filePath)

      // Create transcription record
      updateFileField(fileItem.id, 'progress', 60)
      const { data: transcription, error: dbError } = await supabase
        .from('transcriptions')
        .insert({
          user_id: user.id,
          file_name: fileItem.file.name,
          doctor_name: fileItem.doctorName,
          patient_name: fileItem.patientName,
          document_type: fileItem.documentType,
          audio_url: publicUrl,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (dbError) throw dbError

      // Send to n8n webhook for processing
      updateFileField(fileItem.id, 'status', 'processing')
      updateFileField(fileItem.id, 'progress', 80)
      
      const webhookPayload = {
        uploadId: transcription.id,
        doctorName: fileItem.doctorName,
        patientName: fileItem.patientName,
        documentType: fileItem.documentType,
        fileName: fileItem.file.name,
        audioUrl: publicUrl,
        source: 'bulk-upload',
        callbackUrl: `${window.location.origin}/api/transcription-result-v2`
      }

      // Use the n8n cloud webhook URL from environment variables
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://project6.app.n8n.cloud/webhook/medical-transcribe-v2'
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Source': 'bulk-upload'
        },
        body: JSON.stringify(webhookPayload)
      })

      if (!webhookResponse.ok) {
        console.error('Webhook failed:', await webhookResponse.text())
        // Don't throw error, transcription will process eventually
      }

      // Mark as completed
      updateFileField(fileItem.id, 'status', 'completed')
      updateFileField(fileItem.id, 'progress', 100)
      updateFileField(fileItem.id, 'transcriptionId', transcription.id)

    } catch (error) {
      console.error(`Failed to upload ${fileItem.file.name}:`, error)
      updateFileField(fileItem.id, 'status', 'failed')
      updateFileField(fileItem.id, 'error', error instanceof Error ? error.message : 'Upload failed')
      throw error
    }
  }

  const startBulkUpload = async () => {
    if (files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to upload',
        variant: 'destructive'
      })
      return
    }

    // Validate all files have required fields
    const invalidFiles = files.filter(f => !f.doctorName || !f.patientName || !f.documentType)
    if (invalidFiles.length > 0) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields for each file',
        variant: 'destructive'
      })
      return
    }

    setIsProcessing(true)
    abortControllerRef.current = new AbortController()

    let successCount = 0
    let failCount = 0

    for (let i = 0; i < files.length; i++) {
      if (abortControllerRef.current?.signal.aborted) break
      
      const file = files[i]
      if (file.status === 'completed') continue

      setCurrentProcessingIndex(i)
      
      try {
        await uploadSingleFile(file)
        successCount++
      } catch (error) {
        failCount++
      }
    }

    setIsProcessing(false)
    setCurrentProcessingIndex(-1)

    // Show summary
    toast({
      title: 'Bulk upload complete',
      description: `${successCount} files uploaded successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
      variant: failCount > 0 ? 'destructive' : 'default'
    })

    if (successCount > 0 && onComplete) {
      onComplete()
    }
  }

  const cancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsProcessing(false)
    setCurrentProcessingIndex(-1)
  }

  const retryFailed = async () => {
    const failedFiles = files.filter(f => f.status === 'failed')
    if (failedFiles.length === 0) return

    // Reset failed files to pending
    failedFiles.forEach(f => {
      updateFileField(f.id, 'status', 'pending')
      updateFileField(f.id, 'progress', 0)
      updateFileField(f.id, 'error', undefined)
    })

    await startBulkUpload()
  }

  const completedCount = files.filter(f => f.status === 'completed').length
  const failedCount = files.filter(f => f.status === 'failed').length
  const totalProgress = files.length > 0 
    ? Math.round(files.reduce((acc, f) => acc + f.progress, 0) / files.length)
    : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bulk Upload Transcriptions</h2>
            <p className="text-sm text-gray-600 mt-1">Upload multiple audio files for transcription</p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* File Selection */}
          <div className="mb-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Label htmlFor="defaultDoctor">Default Doctor Name</Label>
                <Input
                  id="defaultDoctor"
                  value={defaultDoctorName}
                  onChange={(e) => setDefaultDoctorName(e.target.value)}
                  placeholder="Dr. Smith"
                  disabled={isProcessing}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="defaultType">Default Document Type</Label>
                <Select
                  value={defaultDocumentType}
                  onValueChange={setDefaultDocumentType}
                  disabled={isProcessing}
                >
                  <SelectTrigger id="defaultType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div
              onClick={() => !isProcessing && fileInputRef.current?.click()}
              className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors ${
                isProcessing ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 font-medium">Click to select audio files</p>
              <p className="text-sm text-gray-500 mt-1">MP3, WAV, M4A, OGG (max 100MB each)</p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
              />
            </div>
          </div>

          {/* Files List */}
          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-gray-900">
                  Files ({files.length})
                  {completedCount > 0 && (
                    <span className="ml-2 text-sm text-green-600">
                      {completedCount} completed
                    </span>
                  )}
                  {failedCount > 0 && (
                    <span className="ml-2 text-sm text-red-600">
                      {failedCount} failed
                    </span>
                  )}
                </h3>
                {failedCount > 0 && !isProcessing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retryFailed}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry Failed
                  </Button>
                )}
              </div>

              {files.map((file, index) => (
                <div
                  key={file.id}
                  className={`border rounded-lg p-4 ${
                    file.status === 'failed' ? 'border-red-300 bg-red-50' :
                    file.status === 'completed' ? 'border-green-300 bg-green-50' :
                    file.status === 'processing' || file.status === 'uploading' ? 'border-blue-300 bg-blue-50' :
                    'border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <FileAudio className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 truncate">
                          {file.file.name}
                        </p>
                        <div className="flex items-center gap-2">
                          {file.status === 'completed' && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {file.status === 'failed' && (
                            <AlertCircle className="w-5 h-5 text-red-600" />
                          )}
                          {(file.status === 'uploading' || file.status === 'processing') && (
                            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                          )}
                          {!isProcessing && file.status !== 'completed' && (
                            <button
                              onClick={() => removeFile(file.id)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {file.status !== 'completed' && (
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={file.doctorName}
                            onChange={(e) => updateFileField(file.id, 'doctorName', e.target.value)}
                            placeholder="Doctor name"
                            disabled={isProcessing}
                            className="h-8 text-sm"
                          />
                          <Input
                            value={file.patientName}
                            onChange={(e) => updateFileField(file.id, 'patientName', e.target.value)}
                            placeholder="Patient name"
                            disabled={isProcessing}
                            className="h-8 text-sm"
                          />
                          <Select
                            value={file.documentType}
                            onValueChange={(value) => updateFileField(file.id, 'documentType', value)}
                            disabled={isProcessing}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {documentTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {(file.status === 'uploading' || file.status === 'processing') && (
                        <Progress value={file.progress} className="h-2" />
                      )}

                      {file.error && (
                        <p className="text-sm text-red-600">{file.error}</p>
                      )}

                      {file.status === 'completed' && (
                        <p className="text-sm text-gray-600">
                          Dr. {file.doctorName} • {file.patientName} • {
                            documentTypes.find(t => t.value === file.documentType)?.label
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isProcessing && (
                <>
                  <Progress value={totalProgress} className="w-32" />
                  <span className="text-sm text-gray-600">
                    Processing {currentProcessingIndex + 1} of {files.length}
                  </span>
                </>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={isProcessing ? cancelUpload : onClose}
                disabled={isProcessing && currentProcessingIndex === -1}
              >
                {isProcessing ? 'Cancel' : 'Close'}
              </Button>
              <Button
                onClick={startBulkUpload}
                disabled={files.length === 0 || isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Start Upload ({files.length} files)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
