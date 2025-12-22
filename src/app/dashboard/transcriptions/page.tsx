'use client'

// Force dynamic rendering - no static generation
export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  FileAudio, 
  Search, 
  Filter,
  Download,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  User,
  Send,
  Eye,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { supabase } from '@/lib/supabase' // Re-enabled for direct client-side queries
import { formatFileSize, formatDuration } from '@/lib/transcription-service'

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
  duration?: number
  review_status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed' | null
  review_id?: string | null
  is_final?: boolean
}

export default function TranscriptionsPage() {
  const { user, session } = useAuth()
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [filteredTranscriptions, setFilteredTranscriptions] = useState<Transcription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [doctorFilter, setDoctorFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)
  const [processingCount, setProcessingCount] = useState(0)
  const itemsPerPage = 10

  // Initial fetch when user loads
  useEffect(() => {
    if (user?.id) {
      fetchTranscriptions()
    }
  }, [user?.id])

  // SUPABASE REALTIME: Subscribe to database changes for instant updates
  useEffect(() => {
    if (!user?.id || !supabase) return

    console.log('📡 Transcriptions: Setting up Supabase Realtime subscription')

    const channel = supabase
      .channel('transcriptions-page-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'transcriptions',
          filter: `user_id=eq.${user.id}`
        },
        (payload: { eventType: string; new: Record<string, any>; old: Record<string, any> }) => {
          console.log('📡 Transcriptions: Realtime event:', payload.eventType)
          
          if (payload.eventType === 'INSERT') {
            // Add new transcription to the list
            const newItem = payload.new as any
            const hasText = newItem.transcription_text && newItem.transcription_text.trim().length > 0
            setTranscriptions(prev => [{
              ...newItem,
              status: hasText ? 'completed' : (newItem.status || 'pending')
            }, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // Update existing transcription
            const updatedItem = payload.new as any
            const hasText = updatedItem.transcription_text && updatedItem.transcription_text.trim().length > 0
            setTranscriptions(prev => prev.map(t => 
              t.id === updatedItem.id 
                ? { ...t, ...updatedItem, status: hasText ? 'completed' : (updatedItem.status || t.status) }
                : t
            ))
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted transcription
            const deletedId = payload.old?.id
            if (deletedId) {
              setTranscriptions(prev => prev.filter(t => t.id !== deletedId))
            }
          }
        }
      )
      .subscribe((status: string) => {
        console.log('📡 Transcriptions: Realtime subscription status:', status)
      })

    return () => {
      console.log('📡 Transcriptions: Cleaning up Realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // FALLBACK: Auto-refresh when there are processing items
  useEffect(() => {
    if (processingCount === 0) return

    console.log('🔄 Transcriptions: Starting auto-refresh for', processingCount, 'processing items')
    
    const refreshInterval = setInterval(() => {
      fetchTranscriptions(true) // Silent refresh
    }, 5000) // Check every 5 seconds

    return () => {
      clearInterval(refreshInterval)
    }
  }, [processingCount])

  useEffect(() => {
    applyFilters()
  }, [transcriptions, searchTerm, statusFilter, dateFilter, doctorFilter, typeFilter])

  const fetchTranscriptions = async (silent = false) => {
    try {
      if (!silent) {
        console.log('🚀 Fetching transcriptions...')
      }
      
      if (!user?.id) {
        console.log('❌ No authenticated user found')
        setTranscriptions([])
        setLoading(false)
        return
      }
      
      if (!silent) {
        setRefreshing(true)
      }
      
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Supabase error:', error)
        throw error
      }

      // Add computed status based on transcription_text
      let processing = 0
      const transcriptionsWithStatus = (data || []).map((t: any) => {
        const hasText = t.transcription_text && t.transcription_text.trim() !== ''
        const computedStatus = hasText ? 'completed' : (t.status || 'pending')
        
        if (computedStatus === 'pending' || computedStatus === 'in_progress') {
          processing++
        }
        
        return {
          ...t,
          status: computedStatus
        }
      })
      
      setProcessingCount(processing)
      
      if (!silent) {
        console.log('✅ Fetched transcriptions:', transcriptionsWithStatus.length, 'records,', processing, 'processing')
      }
      setTranscriptions(transcriptionsWithStatus)
    } catch (error) {
      console.error('❌ Error fetching transcriptions:', error)
      if (!silent) {
        setTranscriptions([])
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...transcriptions]

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.doctor_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.transcription_text?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          filtered = filtered.filter(t => new Date(t.created_at) >= filterDate)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          filtered = filtered.filter(t => new Date(t.created_at) >= filterDate)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          filtered = filtered.filter(t => new Date(t.created_at) >= filterDate)
          break
      }
    }

    // Doctor filter
    if (doctorFilter !== 'all') {
      filtered = filtered.filter(t => t.doctor_name === doctorFilter)
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(t => t.document_type === typeFilter)
    }

    setFilteredTranscriptions(filtered)
    setCurrentPage(1)
  }

  const getUniqueValues = (key: keyof Transcription) => {
    return Array.from(new Set(transcriptions.map(t => t[key]))).filter(Boolean)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const exportTranscription = (transcription: Transcription, format: 'txt' | 'json') => {
    const content = format === 'json' 
      ? JSON.stringify(transcription, null, 2)
      : `Transcription: ${transcription.file_name}
Doctor: ${transcription.doctor_name}
Patient: ${transcription.patient_name}
Type: ${transcription.document_type}
Date: ${new Date(transcription.created_at).toLocaleString()}
Status: ${transcription.status}

Transcription Text:
${transcription.transcription_text}`

    const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${transcription.file_name.replace(/\.[^/.]+$/, '')}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const requestReview = async (transcriptionId: string) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcription_id: transcriptionId,
          notes: 'Please review this transcription for accuracy',
          priority: 0
        })
      })

      if (response.ok) {
        alert('Review request sent successfully!')
        fetchTranscriptions() // Refresh the list
      } else {
        const error = await response.json()
        alert(`Failed to send review request: ${error.error}`)
      }
    } catch (error) {
      console.error('Error requesting review:', error)
      alert('Failed to send review request')
    }
  }

  const getReviewBadge = (reviewStatus: string | null | undefined) => {
    if (!reviewStatus) return null
    
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_review: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[reviewStatus] || 'bg-gray-100 text-gray-800'}`}>
        {reviewStatus.replace('_', ' ')}
      </span>
    )
  }

  // Pagination
  const totalPages = Math.ceil(filteredTranscriptions.length / itemsPerPage)
  const paginatedTranscriptions = filteredTranscriptions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transcriptions...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Transcription History</h1>
          <p className="text-muted-foreground mt-1">
            Manage and review all your transcriptions
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {processingCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-md text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{processingCount} processing...</span>
            </div>
          )}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={() => fetchTranscriptions()} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{transcriptions.length}</p>
              </div>
              <FileAudio className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {transcriptions.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {transcriptions.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold">
                  {transcriptions.filter(t => {
                    const date = new Date(t.created_at)
                    const weekAgo = new Date()
                    weekAgo.setDate(weekAgo.getDate() - 7)
                    return date >= weekAgo
                  }).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="in_progress">In Progress</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Date Range</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Doctor</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={doctorFilter}
                  onChange={(e) => setDoctorFilter(e.target.value)}
                >
                  <option value="all">All Doctors</option>
                  {getUniqueValues('doctor_name').map(doctor => (
                    <option key={doctor as string} value={doctor as string}>
                      {doctor as string}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Document Type</Label>
                <select
                  className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  {getUniqueValues('document_type').map(type => (
                    <option key={type as string} value={type as string}>
                      {type as string}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by file name, doctor, patient, or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Transcriptions Table */}
      <Card>
        <CardContent className="p-0">
          {transcriptions.length === 0 ? (
            <div className="p-12 text-center">
              <FileAudio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Transcriptions Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first audio file to get started with transcriptions.
              </p>
              <Button 
                onClick={() => window.location.href = '/dashboard'}
                variant="default"
              >
                Go to Dashboard
              </Button>
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left p-4">File</th>
                  <th className="text-left p-4">Doctor</th>
                  <th className="text-left p-4">Patient</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Size</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTranscriptions.map((transcription) => (
                  <tr key={transcription.id} className="border-b hover:bg-muted/30">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <FileAudio className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{transcription.file_name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {transcription.doctor_name}
                      </div>
                    </td>
                    <td className="p-4">{transcription.patient_name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {transcription.document_type}
                      </span>
                    </td>
                    <td className="p-4 text-sm">
                      {new Date(transcription.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          {getStatusIcon(transcription.status)}
                          <span className="text-sm capitalize">{transcription.status}</span>
                        </div>
                        {transcription.review_status && getReviewBadge(transcription.review_status)}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {formatFileSize(transcription.file_size)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {transcription.status === 'completed' && !transcription.review_status && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => requestReview(transcription.id)}
                            title="Request Review"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => exportTranscription(transcription, 'txt')}
                          disabled={transcription.status !== 'completed'}
                          title="Export as Text"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => exportTranscription(transcription, 'json')}
                          title="Export as JSON"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}

          {/* Pagination - only show if there are transcriptions */}
          {transcriptions.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredTranscriptions.length)} of{' '}
              {filteredTranscriptions.length} results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
