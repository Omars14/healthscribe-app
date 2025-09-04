'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MedicalTranscriptionForm } from '@/components/medical-transcription-form'
import { MedicalTranscriptionReview } from '@/components/medical-transcription-review'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileAudio, History, Upload, Settings } from 'lucide-react'

export default function MedicalTranscriptionPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'review'>('upload')
  const [selectedTranscriptionId, setSelectedTranscriptionId] = useState<string | null>(null)
  const router = useRouter()

  const handleUploadSuccess = (transcriptionId: string) => {
    setSelectedTranscriptionId(transcriptionId)
    setActiveTab('review')
    
    // Optionally navigate to dedicated review page
    // router.push(`/medical-transcription/${transcriptionId}`)
  }

  const handleSave = (finalText: string) => {
    console.log('Final text saved:', finalText.substring(0, 100) + '...')
  }

  const handleExport = (format: 'pdf' | 'docx' | 'txt') => {
    console.log(`Exporting as ${format}`)
    // Implement actual export logic here
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Medical Transcription System</h1>
        <p className="text-muted-foreground mt-2">
          Upload audio for AI-powered medical transcription with professional formatting
        </p>
      </div>

      {!selectedTranscriptionId ? (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Upload Area */}
          <div className="lg:col-span-2">
            <MedicalTranscriptionForm onSubmitSuccess={handleUploadSuccess} />
          </div>

          {/* Quick Actions Sidebar */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/transcriptions')}
                >
                  <History className="mr-2 h-4 w-4" />
                  View All Transcriptions
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/dashboard')}
                >
                  <FileAudio className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/settings')}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Processing Status</CardTitle>
                <CardDescription>
                  Current system performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Average Time</span>
                      <span className="font-medium">~45 seconds</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AI Models</span>
                      <span className="font-medium text-green-600">Online</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Formats Available</span>
                      <span className="font-medium">8 Types</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Speak clearly and avoid background noise</li>
                  <li>• State patient and doctor names at the beginning</li>
                  <li>• Use medical terminology consistently</li>
                  <li>• Review [?] marked text carefully</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedTranscriptionId(null)
                setActiveTab('upload')
              }}
            >
              <Upload className="mr-2 h-4 w-4" />
              New Transcription
            </Button>
          </div>
          
          <MedicalTranscriptionReview
            transcriptionId={selectedTranscriptionId}
            onSave={handleSave}
            onExport={handleExport}
          />
        </div>
      )}
    </div>
  )
}
