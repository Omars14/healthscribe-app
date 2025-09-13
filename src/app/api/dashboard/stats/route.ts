import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization header' },
        { status: 401 }
      )
    }

    // Create Supabase client with service role for full access
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get current user from session
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      )
    }

    // Get user's transcriptions
    const { data: transcriptions, error: transError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (transError) {
      console.error('Error fetching transcriptions:', transError)
      return NextResponse.json(
        { error: 'Failed to fetch transcriptions' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const total = transcriptions?.length || 0

    // Count by status
    const processing = transcriptions?.filter(t => t.status === 'processing' || t.status === 'in_progress').length || 0
    const completed = transcriptions?.filter(t => t.status === 'completed').length || 0
    const failed = transcriptions?.filter(t => t.status === 'failed').length || 0

    // Today's transcriptions
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayCount = transcriptions?.filter(t => {
      const createdAt = new Date(t.created_at)
      return createdAt >= today
    }).length || 0

    // Calculate average processing time for completed transcriptions
    const completedTranscriptions = transcriptions?.filter(t => t.status === 'completed' && t.duration) || []
    const avgTime = completedTranscriptions.length > 0
      ? Math.round(completedTranscriptions.reduce((sum, t) => sum + (t.duration || 0), 0) / completedTranscriptions.length)
      : 0

    // Calculate success rate
    const totalProcessed = completed + failed
    const successRate = totalProcessed > 0 ? Math.round((completed / totalProcessed) * 100 * 10) / 10 : 100

    // Calculate weekly growth
    const lastWeek = new Date()
    lastWeek.setDate(lastWeek.getDate() - 7)
    const thisWeekCount = transcriptions?.filter(t => new Date(t.created_at) >= lastWeek).length || 0

    const weekBefore = new Date(lastWeek)
    weekBefore.setDate(weekBefore.getDate() - 7)
    const lastWeekCount = transcriptions?.filter(t => {
      const date = new Date(t.created_at)
      return date >= weekBefore && date < lastWeek
    }).length || 0

    const weeklyGrowth = lastWeekCount > 0 ? Math.round(((thisWeekCount - lastWeekCount) / lastWeekCount) * 100 * 10) / 10 : 0

    // Generate weekly data (last 7 days)
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      const dayTranscriptions = transcriptions?.filter(t => {
        const createdAt = new Date(t.created_at)
        return createdAt >= dayStart && createdAt <= dayEnd
      }) || []

      const avgTimeForDay = dayTranscriptions.filter(t => t.duration).length > 0
        ? Math.round(dayTranscriptions.filter(t => t.duration).reduce((sum, t) => sum + (t.duration || 0), 0) / dayTranscriptions.filter(t => t.duration).length)
        : 0

      weeklyData.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        transcriptions: dayTranscriptions.length,
        avgTime: avgTimeForDay
      })
    }

    // Helper function to format document type names
    const formatDocumentType = (type: string): string => {
      return type
        .split('_') // Split by underscore
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize each word
        .join(' ') // Join with space
    }

    // Generate document type distribution
    const documentTypeCount = {}
    transcriptions?.forEach(t => {
      const type = t.document_type || 'Consultation'
      const formattedType = formatDocumentType(type)
      documentTypeCount[formattedType] = (documentTypeCount[formattedType] || 0) + 1
    })

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
    const documentTypes = Object.entries(documentTypeCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length]
    }))

    // Generate recent activity (last 5 transcriptions)
    const recentActivity = transcriptions?.slice(0, 5).map(t => ({
      id: t.id,
      fileName: t.file_name,
      doctor: 'Medical Staff', // Default since doctor_name may not exist
      patient: 'Patient', // Default since patient_name may not exist
      status: t.status || 'pending',
      time: formatTimeAgo(new Date(t.created_at)),
      duration: t.duration ? `${Math.round(t.duration)}s` : '--'
    })) || []

    console.log('📊 Dashboard API: Recent activity generated:', recentActivity.length, 'items')

    return NextResponse.json({
      stats: {
        total,
        processing,
        today: todayCount,
        avgTime,
        weeklyGrowth,
        successRate
      },
      weeklyData,
      documentTypes,
      recentActivity
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins} minutes ago`
  if (diffHours < 24) return `${diffHours} hours ago`
  if (diffDays < 7) return `${diffDays} days ago`

  return date.toLocaleDateString()
}
