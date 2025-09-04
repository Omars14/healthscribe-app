'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  FileAudio,
  Users,
  Calendar,
  Activity,
  PieChart,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatFileSize } from '@/lib/transcription-service'

interface Analytics {
  totalTranscriptions: number
  completedTranscriptions: number
  averageProcessingTime: number
  totalAudioDuration: number
  totalFileSize: number
  transcriptionsByDay: { date: string; count: number }[]
  transcriptionsByDoctor: { doctor: string; count: number }[]
  transcriptionsByType: { type: string; count: number }[]
  transcriptionsByStatus: { status: string; count: number }[]
  recentActivity: {
    date: string
    count: number
    completed: number
  }[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      const { data: transcriptions, error } = await supabase
        .from('transcriptions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      if (transcriptions) {
        // Calculate date range
        const now = new Date()
        const startDate = new Date()
        
        switch (timeRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7)
            break
          case 'month':
            startDate.setMonth(now.getMonth() - 1)
            break
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1)
            break
        }

        const filteredTranscriptions = timeRange === 'all' 
          ? transcriptions 
          : transcriptions.filter(t => new Date(t.created_at) >= startDate)

        // Calculate analytics
        const totalTranscriptions = filteredTranscriptions.length
        const completedTranscriptions = filteredTranscriptions.filter(t => t.status === 'completed').length
        const totalFileSize = filteredTranscriptions.reduce((sum, t) => sum + (t.file_size || 0), 0)
        
        // Group by day
        const transcriptionsByDay: { [key: string]: number } = {}
        filteredTranscriptions.forEach(t => {
          const date = new Date(t.created_at).toLocaleDateString()
          transcriptionsByDay[date] = (transcriptionsByDay[date] || 0) + 1
        })

        // Group by doctor
        const transcriptionsByDoctor: { [key: string]: number } = {}
        filteredTranscriptions.forEach(t => {
          if (t.doctor_name) {
            transcriptionsByDoctor[t.doctor_name] = (transcriptionsByDoctor[t.doctor_name] || 0) + 1
          }
        })

        // Group by type
        const transcriptionsByType: { [key: string]: number } = {}
        filteredTranscriptions.forEach(t => {
          if (t.document_type) {
            transcriptionsByType[t.document_type] = (transcriptionsByType[t.document_type] || 0) + 1
          }
        })

        // Group by status
        const transcriptionsByStatus: { [key: string]: number } = {}
        filteredTranscriptions.forEach(t => {
          transcriptionsByStatus[t.status] = (transcriptionsByStatus[t.status] || 0) + 1
        })

        // Recent activity (last 7 days)
        const recentActivity: Analytics['recentActivity'] = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          date.setHours(0, 0, 0, 0)
          
          const nextDate = new Date(date)
          nextDate.setDate(nextDate.getDate() + 1)
          
          const dayTranscriptions = transcriptions.filter(t => {
            const tDate = new Date(t.created_at)
            return tDate >= date && tDate < nextDate
          })
          
          recentActivity.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            count: dayTranscriptions.length,
            completed: dayTranscriptions.filter(t => t.status === 'completed').length
          })
        }

        setAnalytics({
          totalTranscriptions,
          completedTranscriptions,
          averageProcessingTime: 45, // Mock data - would calculate from actual timestamps
          totalAudioDuration: totalTranscriptions * 180, // Mock data - would calculate from actual durations
          totalFileSize,
          transcriptionsByDay: Object.entries(transcriptionsByDay).map(([date, count]) => ({ date, count })),
          transcriptionsByDoctor: Object.entries(transcriptionsByDoctor).map(([doctor, count]) => ({ doctor, count })),
          transcriptionsByType: Object.entries(transcriptionsByType).map(([type, count]) => ({ type, count })),
          transcriptionsByStatus: Object.entries(transcriptionsByStatus).map(([status, count]) => ({ status, count })),
          recentActivity
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getComparisonIcon = (current: number, previous: number) => {
    if (current > previous) return <ArrowUp className="h-4 w-4 text-green-500" />
    if (current < previous) return <ArrowDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-gray-400" />
  }

  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Track your transcription metrics and performance
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-4 py-2 rounded-md border border-input bg-background"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Transcriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{analytics.totalTranscriptions}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  +12% from last period
                </p>
              </div>
              <FileAudio className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">
                  {analytics.totalTranscriptions > 0 
                    ? Math.round((analytics.completedTranscriptions / analytics.totalTranscriptions) * 100)
                    : 0}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {analytics.completedTranscriptions} completed
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg. Processing Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{analytics.averageProcessingTime}s</p>
                <p className="text-xs text-muted-foreground mt-1">
                  -5% faster
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{formatFileSize(analytics.totalFileSize)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Across all files
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Transcription volume over the last 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {analytics.recentActivity.map((day, index) => {
              const maxCount = Math.max(...analytics.recentActivity.map(d => d.count))
              const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0
              const completedHeight = maxCount > 0 ? (day.completed / maxCount) * 100 : 0
              
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex flex-col justify-end h-48 relative">
                    <div 
                      className="bg-primary/20 rounded-t"
                      style={{ height: `${height}%` }}
                    >
                      <div 
                        className="bg-primary rounded-t"
                        style={{ height: `${(completedHeight / height) * 100}%` }}
                      />
                    </div>
                    {day.count > 0 && (
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">
                        {day.count}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{day.date}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* By Doctor */}
        <Card>
          <CardHeader>
            <CardTitle>By Doctor</CardTitle>
            <CardDescription>Top transcribing doctors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.transcriptionsByDoctor.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{item.doctor}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* By Type */}
        <Card>
          <CardHeader>
            <CardTitle>By Document Type</CardTitle>
            <CardDescription>Distribution of document types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.transcriptionsByType.map((item, index) => {
                const total = analytics.transcriptionsByType.reduce((sum, t) => sum + t.count, 0)
                const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0
                
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{item.type}</span>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* By Status */}
        <Card>
          <CardHeader>
            <CardTitle>By Status</CardTitle>
            <CardDescription>Current status distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.transcriptionsByStatus.map((item, index) => {
                const colors: { [key: string]: string } = {
                  completed: 'bg-green-500',
                  in_progress: 'bg-yellow-500',
                  pending: 'bg-gray-400',
                  failed: 'bg-red-500'
                }
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-3 w-3 rounded-full ${colors[item.status] || 'bg-gray-400'}`} />
                      <span className="text-sm font-medium capitalize">{item.status.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
