'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Play, Pause, Download, Copy, Check, Volume2, Loader2 } from 'lucide-react'

interface TranscriptionData {
  id: string
  file_name: string
  doctor_name: string
  patient_name: string
  document_type: string
  transcription_text: string
  audio_url: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  created_at: string
  processed_at?: string
  error?: string
}

interface TranscriptionPlayerProps {
  transcription: TranscriptionData
  onRefresh?: () => void
}

export default function TranscriptionPlayer({ transcription, onRefresh }: TranscriptionPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [copied, setCopied] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlayPause = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const copyToClipboard = async () => {
    if (transcription.transcription_text) {
      await navigator.clipboard.writeText(transcription.transcription_text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const downloadTranscription = () => {
    const element = document.createElement('a')
    const file = new Blob([transcription.transcription_text || ''], { type: 'text/plain' })
    element.href = URL.createObjectURL(file)
    element.download = `${transcription.file_name.replace(/\.[^/.]+$/, '')}_transcription.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const downloadAudio = () => {
    if (transcription.audio_url) {
      const element = document.createElement('a')
      element.href = transcription.audio_url
      element.download = transcription.file_name
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  const getStatusColor = () => {
    switch (transcription.status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{transcription.file_name}</h2>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p><span className="font-semibold">Doctor:</span> {transcription.doctor_name}</p>
              <p><span className="font-semibold">Patient:</span> {transcription.patient_name}</p>
              <p><span className="font-semibold">Type:</span> {transcription.document_type}</p>
              <p><span className="font-semibold">Date:</span> {new Date(transcription.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {transcription.status}
            </span>
            {transcription.status === 'processing' && onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Refresh status"
              >
                <Loader2 className="w-5 h-5 animate-spin" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Audio Player */}
      {transcription.audio_url && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={togglePlayPause}
              className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              disabled={!transcription.audio_url}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #2563eb ${(currentTime / duration) * 100}%, #e5e7eb ${(currentTime / duration) * 100}%)`
                  }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <button
              onClick={downloadAudio}
              className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              title="Download audio"
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
          
          <audio
            ref={audioRef}
            src={transcription.audio_url}
            preload="metadata"
          />
        </div>
      )}

      {/* Transcription Text */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Transcription</h3>
          {transcription.transcription_text && (
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={downloadTranscription}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 min-h-[200px]">
          {transcription.status === 'completed' && transcription.transcription_text ? (
            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
              {transcription.transcription_text}
            </p>
          ) : transcription.status === 'processing' ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-3" />
                <p className="text-gray-600">Transcription in progress...</p>
                <p className="text-sm text-gray-500 mt-1">This may take a few moments</p>
              </div>
            </div>
          ) : transcription.status === 'failed' ? (
            <div className="text-center text-red-600 py-8">
              <p className="font-semibold">Transcription failed</p>
              {transcription.error && (
                <p className="text-sm mt-2 text-red-500">{transcription.error}</p>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <p>Waiting to start transcription...</p>
            </div>
          )}
        </div>
      </div>

      {/* Processing Time */}
      {transcription.processed_at && (
        <div className="text-sm text-gray-500 text-right">
          Processed at: {new Date(transcription.processed_at).toLocaleString()}
        </div>
      )}
    </div>
  )
}
