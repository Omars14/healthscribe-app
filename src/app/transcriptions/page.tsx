'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-client'
import { useAuth } from '@/contexts/AuthContext'
import TranscriptionPlayer from '@/components/TranscriptionPlayer'
import { BulkUploadModal } from '@/components/bulk-upload-modal'
import { Loader2, Search, Filter, RefreshCw, Trash2, AlertTriangle, Upload } from 'lucide-react'

// Force dynamic rendering - no static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

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

export default function TranscriptionsPage() {
  const { session } = useAuth()
  const [transcriptions, setTranscriptions] = useState<TranscriptionData[]>([])
  const [selectedTranscription, setSelectedTranscription] = useState<TranscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showBulkUpload, setShowBulkUpload] = useState(false)

  const fetchTranscriptions = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      let query = supabase
        .from('transcriptions')
        .select('*')
        .order('created_at', { ascending: false })
      
      // If user is authenticated, fetch only their transcriptions
      if (user) {
        query = query.eq('user_id', user.id)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Error fetching transcriptions:', error)
        return
      }
      
      setTranscriptions(data || [])
    } catch (error) {
      console.error('Failed to fetch transcriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTranscriptions()
    
    // Set up real-time subscription (only once, not dependent on selectedTranscription)
    const subscription = supabase
      .channel('transcriptions_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'transcriptions' 
        },
        (payload) => {
          console.log('Real-time update:', payload)
          
          if (payload.eventType === 'INSERT') {
            setTranscriptions(prev => [payload.new as TranscriptionData, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setTranscriptions(prev => 
              prev.map(t => t.id === payload.new.id ? payload.new as TranscriptionData : t)
            )
            // Update selected transcription if it's the one being updated (using current state)
            setSelectedTranscription(current => 
              current?.id === payload.new.id ? payload.new as TranscriptionData : current
            )
          } else if (payload.eventType === 'DELETE') {
            setTranscriptions(prev => prev.filter(t => t.id !== payload.old.id))
            setSelectedTranscription(current => 
              current?.id === payload.old.id ? null : current
            )
          }
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, []) // No dependencies - subscription should only be set up once

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTranscriptions()
    setRefreshing(false)
  }

  const handleRefreshSingle = async (id: string) => {
    const { data, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', id)
      .single()
    
    if (data && !error) {
      setTranscriptions(prev => 
        prev.map(t => t.id === id ? data : t)
      )
      if (selectedTranscription?.id === id) {
        setSelectedTranscription(data)
      }
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
      
      // Show success message (assuming you have a toast or notification system)
      console.log('Transcription deleted successfully')
    } catch (error) {
      console.error('Failed to delete transcription:', error)
      alert('Failed to delete transcription. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredTranscriptions = transcriptions.filter(t => {
    const matchesSearch = searchTerm === '' || 
      t.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.document_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.transcription_text && t.transcription_text.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Transcriptions</h1>
          <p className="text-gray-600">View and manage your audio transcriptions</p>
        </div>
        <button
          onClick={() => setShowBulkUpload(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Bulk Upload
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search transcriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transcriptions List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            Files ({filteredTranscriptions.length})
          </h2>
          
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            {filteredTranscriptions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No transcriptions found</p>
              </div>
            ) : (
              filteredTranscriptions.map((transcription) => (
                <div
                  key={transcription.id}
                  className={`relative group rounded-lg border transition-all ${
                    selectedTranscription?.id === transcription.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => setSelectedTranscription(transcription)}
                    className="w-full text-left p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900 truncate pr-2">
                        {transcription.file_name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        transcription.status === 'completed' ? 'bg-green-100 text-green-700' :
                        transcription.status === 'processing' ? 'bg-blue-100 text-blue-700' :
                        transcription.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {transcription.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p className="truncate">Dr. {transcription.doctor_name}</p>
                      <p className="truncate">Patient: {transcription.patient_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transcription.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(transcription.id)
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity bg-white shadow-sm hover:bg-red-50 hover:text-red-600"
                    title="Delete transcription"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {/* Delete confirmation dialog */}
                  {showDeleteConfirm === transcription.id && (
                    <div className="absolute inset-0 bg-white rounded-lg border-2 border-red-500 p-4 z-10 flex flex-col justify-center">
                      <div className="flex items-center mb-3 text-red-600">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        <span className="font-semibold">Delete Transcription?</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">
                        This will permanently delete the transcription and audio file.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(transcription.id)
                          }}
                          disabled={deletingId === transcription.id}
                          className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          {deletingId === transcription.id ? (
                            <span className="flex items-center justify-center">
                              <Loader2 className="w-3 h-3 animate-spin mr-1" />
                              Deleting...
                            </span>
                          ) : (
                            'Delete'
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowDeleteConfirm(null)
                          }}
                          className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Transcription Details */}
        <div className="lg:col-span-2">
          {selectedTranscription ? (
            <TranscriptionPlayer 
              transcription={selectedTranscription}
              onRefresh={() => handleRefreshSingle(selectedTranscription.id)}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-12 text-center">
              <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">Select a transcription to view details</p>
              <p className="text-gray-500 text-sm mt-2">
                Choose from the list on the left to see transcription text and play audio
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onComplete={() => {
          setShowBulkUpload(false)
          fetchTranscriptions()
        }}
      />
    </div>
  )
}
