'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Shield,
  User,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

export default function AdminDebugPage() {
  const { user, session, userProfile, loading } = useAuth()
  const [serverCheck, setServerCheck] = useState<any>(null)
  const [serverLoading, setServerLoading] = useState(false)

  const checkServerAdmin = async () => {
    if (!session?.access_token) {
      toast.error('No session token available')
      return
    }

    try {
      setServerLoading(true)
      const response = await fetch('/api/admin/check-user-role', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      const data = await response.json()
      setServerCheck({ response: response.ok, data })
      
      if (response.ok) {
        toast.success('Server admin check passed!')
      } else {
        toast.error('Server admin check failed!')
      }
    } catch (error) {
      console.error('Server check error:', error)
      setServerCheck({ error: error.message })
      toast.error('Server check failed!')
    } finally {
      setServerLoading(false)
    }
  }

  useEffect(() => {
    if (session && !loading) {
      checkServerAdmin()
    }
  }, [session, loading])

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3 text-red-800">
            <Shield className="h-8 w-8" />
            Admin Access Debug Tool
          </h1>
          <p className="text-muted-foreground mt-1">
            Diagnose admin access issues and test authentication flow
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Loading:</span>
                <Badge variant={loading ? 'destructive' : 'secondary'}>
                  {loading ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>User Session:</span>
                <Badge variant={user ? 'default' : 'destructive'}>
                  {user ? 'Active' : 'None'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>User Email:</span>
                <span className="text-sm font-mono">{user?.email || 'N/A'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>User ID:</span>
                <span className="text-xs font-mono">{user?.id || 'N/A'}</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Access Token:</span>
                <Badge variant={session?.access_token ? 'default' : 'destructive'}>
                  {session?.access_token ? 'Available' : 'Missing'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* User Profile Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                User Profile Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Profile Loaded:</span>
                <Badge variant={userProfile ? 'default' : 'destructive'}>
                  {userProfile ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              {userProfile && (
                <>
                  <div className="flex items-center justify-between">
                    <span>Email:</span>
                    <span className="text-sm font-mono">{userProfile.email}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Role:</span>
                    <Badge variant={userProfile.role === 'admin' ? 'default' : 'secondary'}>
                      {userProfile.role}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Active:</span>
                    <Badge variant={userProfile.is_active ? 'default' : 'destructive'}>
                      {userProfile.is_active ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Full Name:</span>
                    <span className="text-sm">{userProfile.full_name || 'Not set'}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Server-side Check */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Server Admin Check
              </CardTitle>
              <CardDescription>
                Verify admin access via API endpoint
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={checkServerAdmin}
                disabled={serverLoading || !session}
                className="w-full"
              >
                {serverLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Test Server Admin Check
              </Button>

              {serverCheck && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span>Response Status:</span>
                    <Badge variant={serverCheck.response ? 'default' : 'destructive'}>
                      {serverCheck.response ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  
                  {serverCheck.data && (
                    <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                      <pre>{JSON.stringify(serverCheck.data, null, 2)}</pre>
                    </div>
                  )}
                  
                  {serverCheck.error && (
                    <div className="bg-red-100 border border-red-300 text-red-800 p-3 rounded text-sm">
                      Error: {serverCheck.error}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/dashboard">
                <Button className="w-full" variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
              
              {userProfile?.role === 'admin' && (
                <>
                  <Link href="/dashboard/admin/users">
                    <Button className="w-full" variant="default">
                      Admin - User Management
                    </Button>
                  </Link>
                  
                  <Link href="/dashboard/admin/transcriptions">
                    <Button className="w-full" variant="default">
                      Admin - All Transcriptions
                    </Button>
                  </Link>
                </>
              )}
              
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Page
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Environment Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Environment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Environment:</strong> {process.env.NODE_ENV}
              </div>
              <div>
                <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.origin : 'N/A'}
              </div>
              <div>
                <strong>Port:</strong> {typeof window !== 'undefined' ? window.location.port : 'N/A'}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expected User Info */}
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Expected Admin User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-green-700">
              <p><strong>Email:</strong> omars14@gmail.com</p>
              <p><strong>Role:</strong> admin</p>
              <p><strong>Status:</strong> Should have full admin access</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
