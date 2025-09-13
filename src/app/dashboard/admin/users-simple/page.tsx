'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  email: string
  role: string
  is_active: boolean
  created_at: string
  total_transcriptions?: number
  total_hours?: number
}

export default function SimpleAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔧 Simple Admin: Fetching users...')

      const response = await fetch('/api/admin/users?limit=10')
      console.log('🔧 Simple Admin: Response status:', response.status)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('🔧 Simple Admin: Data received:', data)

      if (data.users) {
        setUsers(data.users)
        console.log('✅ Simple Admin: Users loaded:', data.users.length)
      } else {
        throw new Error('No users data in response')
      }
    } catch (error) {
      console.error('❌ Simple Admin: Error:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <Users className="h-8 w-8 text-primary" />
                Simple Admin - Users
              </h1>
              <p className="text-muted-foreground mt-1">
                Direct access to user management (bypassing complex auth)
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard/admin/users">
                <Button variant="outline">
                  Full Admin Panel
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
              <Button onClick={fetchUsers} variant="outline" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle>User List</CardTitle>
            <CardDescription>
              Simple view of all users in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin mr-4" />
                <span>Loading users...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-8 text-red-600">
                <AlertCircle className="h-8 w-8 mr-4" />
                <div>
                  <p className="font-semibold">Error loading users</p>
                  <p className="text-sm">{error}</p>
                  <Button 
                    onClick={fetchUsers} 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center p-8">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{user.email}</h3>
                        <p className="text-sm text-muted-foreground">ID: {user.id}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role}
                        </Badge>
                        <Badge variant={user.is_active ? 'default' : 'destructive'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <p>Transcriptions: {user.total_transcriptions || 0}</p>
                      <p>Total Hours: {user.total_hours || 0}</p>
                      <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card className="mt-6 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              <p><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
              <p><strong>Users Loaded:</strong> {users.length}</p>
              <p><strong>Loading State:</strong> {loading ? 'Yes' : 'No'}</p>
              <p><strong>Error State:</strong> {error || 'None'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
