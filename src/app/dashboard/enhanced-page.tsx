'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CardSkeleton } from '@/components/ui/card-skeleton'
import { motion } from 'framer-motion'
import { 
  Upload, 
  FileAudio, 
  Activity, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Mic,
  Users,
  Calendar,
  ArrowRight,
  Zap,
  BarChart3,
  PieChart,
  FileText,
  Play
} from 'lucide-react'
import Link from 'next/link'
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar,
  PieChart as RePieChart, 
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { format } from 'date-fns'

// Sample data for charts
const weeklyData = [
  { day: 'Mon', transcriptions: 12, avgTime: 45 },
  { day: 'Tue', transcriptions: 19, avgTime: 38 },
  { day: 'Wed', transcriptions: 15, avgTime: 42 },
  { day: 'Thu', transcriptions: 25, avgTime: 35 },
  { day: 'Fri', transcriptions: 22, avgTime: 40 },
  { day: 'Sat', transcriptions: 8, avgTime: 48 },
  { day: 'Sun', transcriptions: 5, avgTime: 52 },
]

const documentTypes = [
  { name: 'Consultation', value: 45, color: '#3b82f6' },
  { name: 'Surgery Report', value: 30, color: '#10b981' },
  { name: 'Progress Note', value: 15, color: '#f59e0b' },
  { name: 'Discharge', value: 10, color: '#8b5cf6' },
]

const recentActivity = [
  {
    id: 1,
    fileName: 'Patient_Johnson_Consult.mp3',
    doctor: 'Dr. Smith',
    patient: 'Johnson, M',
    status: 'completed',
    time: '2 minutes ago',
    duration: '45s'
  },
  {
    id: 2,
    fileName: 'Surgery_Report_Williams.m4a',
    doctor: 'Dr. Chen',
    patient: 'Williams, K',
    status: 'processing',
    time: '15 minutes ago',
    duration: '--'
  },
  {
    id: 3,
    fileName: 'Discharge_Summary_Brown.wav',
    doctor: 'Dr. Patel',
    patient: 'Brown, A',
    status: 'completed',
    time: '1 hour ago',
    duration: '38s'
  },
  {
    id: 4,
    fileName: 'Progress_Note_Davis.mp3',
    doctor: 'Dr. Smith',
    patient: 'Davis, J',
    status: 'completed',
    time: '2 hours ago',
    duration: '52s'
  }
]

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

export default function EnhancedDashboardPage() {
  const { user, session, userProfile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    processing: 0,
    today: 0,
    avgTime: 0,
    weeklyGrowth: 0,
    successRate: 0
  })
  const [realWeeklyData, setRealWeeklyData] = useState([])
  const [realDocumentTypes, setRealDocumentTypes] = useState([])
  const [realRecentActivity, setRealRecentActivity] = useState([])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)

      // Get auth token from AuthContext
      if (!session) {
        console.error('No session available')
        setLoading(false)
        return
      }

      const response = await fetch('/api/dashboard/stats', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        console.error('Failed to fetch dashboard stats:', response.statusText)
        setLoading(false)
        return
      }

      const data = await response.json()

      console.log('📊 Dashboard: Received data:', {
        stats: data.stats,
        recentActivityCount: data.recentActivity?.length || 0,
        sampleActivity: data.recentActivity?.[0]
      })

      // Update stats
      setStats(data.stats)

      // Update chart data
      setRealWeeklyData(data.weeklyData)
      setRealDocumentTypes(data.documentTypes)
      setRealRecentActivity(data.recentActivity)

    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchDashboardStats()
    }
  }, [session])

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Debug info for development */}
      {process.env.NODE_ENV === 'development' && userProfile && (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 text-xs">
          <strong>DEBUG:</strong> User: {userProfile.email} | Role: {userProfile.role} | ID: {userProfile.id}
        </div>
      )}
      
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
      {/* Welcome Section with Gradient */}
      <motion.div variants={item} className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 p-8 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-blue-100 text-lg mb-6">
            {format(new Date(), "EEEE, MMMM do")} • Your workspace is ready
          </p>
          <div className="flex gap-4">
            <Link href="/dashboard/transcriptionist-workspace">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                <Mic className="mr-2 h-5 w-5" />
                Start Transcribing
              </Button>
            </Link>
            <Link href="/dashboard/transcriptions">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 hover:text-blue-700 font-bold shadow-lg border-2 border-white">
                <FileAudio className="mr-2 h-5 w-5" />
                View All
              </Button>
            </Link>
            {userProfile?.role === 'admin' && (
              <Link href="/dashboard/admin/users">
                <Button size="lg" className="bg-red-600 text-white hover:bg-red-700 font-bold shadow-lg">
                  <Users className="mr-2 h-5 w-5" />
                  Admin Panel
                </Button>
              </Link>
            )}
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white rounded-full opacity-5"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white rounded-full opacity-5"></div>
      </motion.div>

      {/* Stats Cards with Loading State */}
      <motion.div variants={item} className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Transcriptions</CardTitle>
                <FileAudio className="h-5 w-5 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">+{stats.weeklyGrowth}%</span>
                  <span className="ml-1">from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing Now</CardTitle>
                <Activity className="h-5 w-5 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.processing}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Zap className="h-3 w-3 text-yellow-500 mr-1" />
                  <span>Real-time processing</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Today&apos;s Count</CardTitle>
                <Calendar className="h-5 w-5 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.today}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Clock className="h-3 w-3 text-gray-500 mr-1" />
                  <span>Last 24 hours</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Processing</CardTitle>
                <Clock className="h-5 w-5 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.avgTime}s</div>
                <div className="flex items-center text-xs text-muted-foreground mt-2">
                  <Badge variant="outline" className="text-xs">
                    {stats.successRate}% success rate
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </motion.div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Weekly Trend Chart */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Weekly Trend</CardTitle>
                  <CardDescription>Transcription volume and processing time</CardDescription>
                </div>
                <Badge variant="secondary">Last 7 days</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={realWeeklyData.length > 0 ? realWeeklyData : weeklyData}>
                  <defs>
                    <linearGradient id="colorTranscriptions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTime" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="transcriptions"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorTranscriptions)"
                    name="Transcriptions"
                  />
                  <Area
                    type="monotone"
                    dataKey="avgTime"
                    stroke="#10b981"
                    fillOpacity={1}
                    fill="url(#colorTime)"
                    name="Avg Time (s)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Document Types Pie Chart */}
        <motion.div variants={item}>
          <Card>
            <CardHeader>
              <CardTitle>Document Types</CardTitle>
              <CardDescription>Distribution of transcriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <RePieChart>
                  <Pie
                    data={realDocumentTypes.length > 0 ? realDocumentTypes : documentTypes}
                    cx="50%"
                    cy="45%"
                    labelLine={false}
                    label={false}
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {(realDocumentTypes.length > 0 ? realDocumentTypes : documentTypes).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => [`${value} transcriptions`, name]}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value, entry) => (
                      <span style={{ color: entry.color, fontSize: '14px', fontWeight: '500' }}>
                        {value}
                      </span>
                    )}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest transcription updates</CardDescription>
              </div>
              <Link href="/dashboard/transcriptions">
                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-semibold">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(realRecentActivity.length > 0 ? realRecentActivity : recentActivity).map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {activity.doctor.split(' ').length > 1
                          ? activity.doctor.split(' ')[1][0]?.toUpperCase()
                          : activity.doctor[0]?.toUpperCase() || 'M'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{activity.fileName}</p>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{activity.doctor}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <span>{activity.patient}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <span>{activity.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {activity.status === 'completed' && (
                      <Badge variant="outline" className="font-mono">
                        <Clock className="mr-1 h-3 w-3" />
                        {activity.duration}
                      </Badge>
                    )}
                    {activity.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                        <span className="text-sm text-muted-foreground">Processing...</span>
                      </div>
                    )}
                    <Button variant="ghost" size="icon">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item} className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Upload className="h-8 w-8 text-blue-500" />
              <Badge variant="secondary">Quick</Badge>
            </div>
            <CardTitle className="mt-4">Upload Audio</CardTitle>
            <CardDescription>Start a new transcription</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/transcriptionist-workspace">
              <Button className="w-full">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <BarChart3 className="h-8 w-8 text-green-500" />
              <Badge variant="secondary">Analytics</Badge>
            </div>
            <CardTitle className="mt-4">View Analytics</CardTitle>
            <CardDescription>Detailed insights and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/analytics">
              <Button className="w-full" variant="outline">
                Explore
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all hover:scale-105 cursor-pointer">
          <CardHeader>
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-purple-500" />
              <Badge variant="secondary">Pro</Badge>
            </div>
            <CardTitle className="mt-4">Team Settings</CardTitle>
            <CardDescription>Manage users and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/settings">
              <Button className="w-full" variant="outline">
                Configure
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
