'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Play,
  Edit3,
  MessageSquare,
  ChevronRight,
  Users,
  TrendingUp,
  Calendar,
  Filter
} from 'lucide-react'
import { Review, ReviewStatus } from '@/types/review'
import { format } from 'date-fns'
import Link from 'next/link'

export default function EditorDashboard() {
  const { user, userProfile } = useAuth()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<'all' | ReviewStatus>('all')
  const [stats, setStats] = useState({
    pending: 0,
    inReview: 0,
    completed: 0,
    todayCount: 0
  })

  useEffect(() => {
    // Check if user is an editor
    if (userProfile && userProfile.role !== 'editor' && userProfile.role !== 'admin') {
      router.push('/dashboard')
    }
  }, [userProfile, router])

  useEffect(() => {
    fetchReviews()
  }, [])

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews')
      if (response.ok) {
        const data = await response.json()
        setReviews(data.reviews || [])
        calculateStats(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (reviewList: Review[]) => {
    const today = new Date().toDateString()
    setStats({
      pending: reviewList.filter(r => r.status === 'pending').length,
      inReview: reviewList.filter(r => r.status === 'in_review').length,
      completed: reviewList.filter(r => r.status === 'completed' || r.status === 'approved').length,
      todayCount: reviewList.filter(r => new Date(r.requested_at).toDateString() === today).length
    })
  }

  const updateReviewStatus = async (reviewId: string, status: ReviewStatus) => {
    try {
      const response = await fetch('/api/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, status })
      })

      if (response.ok) {
        fetchReviews() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating review:', error)
    }
  }

  const getStatusColor = (status: ReviewStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'in_review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 2:
        return <Badge className="bg-red-500 text-white">Urgent</Badge>
      case 1:
        return <Badge className="bg-orange-500 text-white">High</Badge>
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  const filteredReviews = selectedStatus === 'all' 
    ? reviews 
    : reviews.filter(r => r.status === selectedStatus)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Editor Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Review and edit transcriptions from your team
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          <Users className="mr-2 h-4 w-4" />
          Editor
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting your review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Review</CardTitle>
            <Edit3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inReview}</div>
            <p className="text-xs text-muted-foreground">Currently editing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">Reviews completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Reviews</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayCount}</div>
            <p className="text-xs text-muted-foreground">Received today</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Review Queue</CardTitle>
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('all')}
              >
                All
              </Button>
              <Button
                variant={selectedStatus === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('pending')}
              >
                Pending
              </Button>
              <Button
                variant={selectedStatus === 'in_review' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('in_review')}
              >
                In Review
              </Button>
              <Button
                variant={selectedStatus === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedStatus('completed')}
              >
                Completed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {filteredReviews.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No reviews found in this category
                </div>
              ) : (
                filteredReviews.map((review) => (
                  <Card key={review.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className={getStatusColor(review.status)}>
                              {review.status.replace('_', ' ')}
                            </Badge>
                            {getPriorityBadge(review.priority)}
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(review.requested_at), 'MMM dd, yyyy h:mm a')}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-lg mb-1">
                            {review.transcription?.file_name || 'Untitled Transcription'}
                          </h3>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              <span>From: {review.requester?.full_name || review.requester?.email}</span>
                            </div>
                            {review.transcription?.doctor_name && (
                              <div className="flex items-center gap-1">
                                <FileText className="h-3 w-3" />
                                <span>Dr. {review.transcription.doctor_name}</span>
                              </div>
                            )}
                          </div>

                          {review.notes && (
                            <div className="bg-muted/50 rounded-lg p-3 mb-3">
                              <p className="text-sm">
                                <span className="font-medium">Notes:</span> {review.notes}
                              </p>
                            </div>
                          )}

                          <div className="flex gap-2">
                            {review.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateReviewStatus(review.id, 'in_review')}
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Start Review
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateReviewStatus(review.id, 'rejected')}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {(review.status === 'in_review' || review.status === 'pending') && (
                              <Link href={`/dashboard/editor/review/${review.id}`}>
                                <Button size="sm" variant={review.status === 'in_review' ? 'default' : 'outline'}>
                                  <Edit3 className="mr-2 h-4 w-4" />
                                  {review.status === 'in_review' ? 'Continue Editing' : 'Edit'}
                                </Button>
                              </Link>
                            )}

                            {review.status === 'completed' && (
                              <Link href={`/dashboard/editor/review/${review.id}`}>
                                <Button size="sm" variant="outline">
                                  View Details
                                  <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>

                        {/* Time tracking */}
                        <div className="text-right ml-4">
                          {review.started_at && !review.completed_at && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>In progress</span>
                            </div>
                          )}
                          {review.completed_at && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <CheckCircle className="h-4 w-4" />
                              <span>Completed</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
