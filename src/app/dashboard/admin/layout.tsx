'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Users,
  FileAudio,
  Shield,
  ArrowLeft,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { session } = useAuth()
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log('🔧 Admin Layout: Starting admin check...')
      
      // Enhanced localhost detection
      const isLocalhost = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname.includes('localhost') ||
         window.location.port === '3000' ||
         window.location.port === '3001' ||
         window.location.port === '3002')

      if (isLocalhost) {
        console.log('🔧 Admin Layout: Localhost detected - bypassing admin check')
        setIsAdmin(true)
        setLoading(false)
        return
      }

      // Emergency timeout for admin check
      const timeout = setTimeout(() => {
        console.log('🚨 Admin Layout: Timeout reached - forcing admin access for development')
        if (isLocalhost || process.env.NODE_ENV === 'development') {
          setIsAdmin(true)
          setLoading(false)
        }
      }, 2000)

      if (!session) {
        console.log('🔧 Admin Layout: No session - redirecting to login')
        router.push('/login')
        return
      }

      try {
        console.log('🔧 Admin Layout: Making API call to check admin role...')
        const response = await fetch('/api/admin/check-user-role', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        console.log('🔧 Admin Layout: API response status:', response.status)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.log('🔧 Admin Layout: API error:', errorData)
          throw new Error(`Access denied: ${errorData.error || response.statusText}`)
        }

        const data = await response.json()
        console.log('🔧 Admin Layout: API response data:', data)
        
        if (data.role === 'admin') {
          console.log('✅ Admin Layout: Admin access confirmed')
          setIsAdmin(true)
        } else {
          console.log('❌ Admin Layout: User is not admin:', data.role)
          toast.error('Admin access required')
          router.push('/dashboard')
        }
      } catch (error) {
        console.error('❌ Admin Layout: Admin check failed:', error)
        toast.error(`Failed to verify admin access: ${error instanceof Error ? error.message : 'Unknown error'}`)
        router.push('/dashboard')
      } finally {
        clearTimeout(timeout)
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [session, router])

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Verifying admin access...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-600" />
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </div>

          {/* Admin Navigation */}
          <div className="mt-4 flex gap-2">
            <Link href="/dashboard/admin/users">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                Manage Users
              </Button>
            </Link>
            <Link href="/dashboard/admin/transcriptions">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileAudio className="h-4 w-4" />
                All Transcriptions
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4">
        {children}
      </main>
    </div>
  )
}

