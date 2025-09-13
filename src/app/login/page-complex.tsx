'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')
  const { signIn, user, session } = useAuth()
  const router = useRouter()

  // Auto-redirect if already logged in
  useEffect(() => {
    if (user && session) {
      console.log('🔧 Login: User already logged in, redirecting...')
      router.push('/dashboard')
    }
  }, [user, session, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setDebugInfo('Starting login process...')

    try {
      console.log('🔧 Login: Attempting login for:', email)
      setDebugInfo('Calling signIn function...')

      // Create timeout with proper cleanup
      let timeoutId: NodeJS.Timeout
      const loginPromise = signIn(email, password)
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Login timeout after 15 seconds')), 15000)
      })

      const result = await Promise.race([loginPromise, timeoutPromise]) as any
      
      // Clear timeout immediately when we get a result
      clearTimeout(timeoutId!)

      if (result?.error) {
        console.error('❌ Login: Sign in error:', result.error)
        setError(result.error.message)
        setDebugInfo(`Error: ${result.error.message}`)
      } else {
        console.log('✅ Login: Sign in successful!')
        setDebugInfo('Login successful! AuthContext will handle redirect...')
        // AuthContext now handles the redirect, so we don't need to do it here
      }
    } catch (error: any) {
      console.error('❌ Login: Unexpected error:', error)
      setError(error.message || 'Login failed')
      setDebugInfo(`Unexpected error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEmergencyLogin = async () => {
    setDebugInfo('Attempting emergency direct login...')
    
    try {
      // Direct Supabase login bypass
      const { supabase } = await import('@/lib/supabase')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email || 'omars14@gmail.com',
        password: password
      })

      if (error) throw error

      setDebugInfo('Emergency login successful!')
      window.location.href = '/dashboard'
    } catch (error: any) {
      setError('Emergency login failed: ' + error.message)
      setDebugInfo('Emergency login failed: ' + error.message)
    }
  }

  const clearAndRetry = () => {
    setError('')
    setLoading(false)
    setDebugInfo('')
    
    // Clear any stuck state
    localStorage.clear()
    sessionStorage.clear()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <CardDescription className="text-center">
            Enhanced login with timeout protection
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Debug Info */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <strong>Debug:</strong> {debugInfo}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in... (10s timeout)
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            {/* Emergency Actions */}
            {(loading || error) && (
              <div className="space-y-2 pt-2 border-t">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={clearAndRetry}
                  disabled={loading}
                >
                  Clear & Retry
                </Button>
                
                <Button 
                  type="button" 
                  variant="destructive" 
                  size="sm" 
                  className="w-full"
                  onClick={handleEmergencyLogin}
                  disabled={loading}
                >
                  🚨 Emergency Login
                </Button>
              </div>
            )}

            <div className="text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>

            {/* Quick Links */}
            <div className="text-center text-xs space-y-1 pt-2 border-t">
              <div>
                <Link href="/auth-reset" className="text-gray-500 hover:underline">
                  🔧 Auth Reset Tool
                </Link>
                {' | '}
                <Link href="/admin-direct" className="text-gray-500 hover:underline">
                  🚨 Direct Admin
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
