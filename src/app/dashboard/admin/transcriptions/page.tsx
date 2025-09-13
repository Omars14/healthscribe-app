'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Search,
  Filter,
  RefreshCw,
  Play,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileAudio,
  User,
  Stethoscope,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { format } from 'date-fns'
import TranscriptionPlayer from '@/components/TranscriptionPlayer'

interface Transcription {
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
  duration?: number
  user: {
    email: string
    full_name?: string
  }
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

interface Filters {
  search: string
  searchBy: string
  status: string
  sortBy: string
  sortOrder: string
}

export default function AdminTranscriptionsPage() {
  const { session } = useAuth()
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTranscription, setSelectedTranscription] = useState<Transcription | null>(null)
  const [showPlayer, setShowPlayer] = useState(false)
  const [pagination, setPagination] = useState<PaginationData | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    searchBy: 'all',
    status: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc'
  })

  const fetchTranscriptions = useCallback(async () => {
    if (!session) return

    try {
      setLoading(true)

      const queryParams = new URLSearchParams({
        search: filters.search,
        searchBy: filters.searchBy,
        status: filters.status,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        page: pagination?.page.toString() || '1',
        limit: '20'
      })

      const response = await fetch(`/api/admin/transcriptions?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transcriptions')
      }

      const data = await response.json()
      setTranscriptions(data.transcriptions || [])
      setPagination(data.pagination)
      setFilters(data.filters)

    } catch (error) {
      console.error('Error fetching transcriptions:', error)
      toast.error('Failed to load transcriptions')
    } finally {
      setLoading(false)
    }
  }, [session, filters, pagination?.page])

  useEffect(() => {
    fetchTranscriptions()
  }, [fetchTranscriptions])

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }))
    setPagination(prev => prev ? { ...prev, page: 1 } : null)
  }

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => prev ? { ...prev, page: 1 } : null)
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => prev ? { ...prev, page } : null)
  }

  const handleSort = (field: string) => {
    const newOrder = filters.sortBy === field && filters.sortOrder === 'desc' ? 'asc' : 'desc'
    setFilters(prev => ({ ...prev, sortBy: field, sortOrder: newOrder }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return <ArrowUpDown className="h-4 w-4" />
    return filters.sortOrder === 'desc' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin - All Transcriptions</h1>
        <p className="text-muted-foreground">
          Monitor and manage all transcription outputs from typists
        </p>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transcriptions..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filters.searchBy} onValueChange={(value) => handleFilterChange('searchBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Search by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Fields</SelectItem>
                <SelectItem value="user">User Email</SelectItem>
                <SelectItem value="doctor">Doctor Name</SelectItem>
                <SelectItem value="file">File Name</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="file_name">File Name</SelectItem>
                <SelectItem value="doctor_name">Doctor Name</SelectItem>
                <SelectItem value="user_profiles.email">User Email</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={fetchTranscriptions}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      {pagination && (
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} transcriptions
          </p>
          <Badge variant="secondary">
            {pagination.totalPages} pages
          </Badge>
        </div>
      )}

      {/* Transcriptions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading transcriptions...</p>
            </div>
          ) : transcriptions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No transcriptions found</h3>
              <p className="text-muted-foreground">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('file_name')}
                        className="font-semibold"
                      >
                        File Name {getSortIcon('file_name')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('doctor_name')}
                        className="font-semibold"
                      >
                        Doctor {getSortIcon('doctor_name')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('user_profiles.email')}
                        className="font-semibold"
                      >
                        User {getSortIcon('user_profiles.email')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('status')}
                        className="font-semibold"
                      >
                        Status {getSortIcon('status')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSort('created_at')}
                        className="font-semibold"
                      >
                        Date {getSortIcon('created_at')}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transcriptions.map((transcription) => (
                    <tr key={transcription.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <FileAudio className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{transcription.file_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-4 w-4 text-muted-foreground" />
                          <span>{transcription.doctor_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{transcription.user.email}</div>
                            {transcription.user.full_name && (
                              <div className="text-sm text-muted-foreground">{transcription.user.full_name}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(transcription.status)}>
                          {transcription.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <div>{format(new Date(transcription.created_at), 'MMM dd, yyyy')}</div>
                          <div className="text-muted-foreground">{format(new Date(transcription.created_at), 'HH:mm')}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTranscription(transcription)
                              setShowPlayer(true)
                            }}
                            disabled={!transcription.audio_url || transcription.status !== 'completed'}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Listen
                          </Button>
                          {transcription.transcription_text && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedTranscription(transcription)
                                // Could add text preview modal here
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={!pagination.hasPrev}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Page {pagination.page} of {pagination.totalPages}
            </span>
          </div>

          <Button
            variant="outline"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={!pagination.hasNext}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Transcription Player Dialog */}
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              {selectedTranscription?.file_name}
            </DialogTitle>
            <DialogDescription>
              Transcription by {selectedTranscription?.user.email} • Doctor: {selectedTranscription?.doctor_name}
            </DialogDescription>
          </DialogHeader>

          {selectedTranscription && (
            <TranscriptionPlayer
              transcription={{
                ...selectedTranscription,
                error: undefined
              }}
              onRefresh={() => {
                setShowPlayer(false)
                fetchTranscriptions()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

