'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle, Copy, ExternalLink } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminSetupPage() {
  const [email, setEmail] = useState('omars14@gmail.com')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [projectInfo, setProjectInfo] = useState<any>(null)

  useEffect(() => {
    // Get project info
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const projectId = url.split('//')[1]?.split('.')[0] || 'yaznemrwbingjwqutbvb'
    setProjectInfo({
      url: url,
      projectId: projectId,
      dashboardUrl: `https://supabase.com/dashboard/project/${projectId}`
    })
  }, [])

  const handleSignUp = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Dr. Omar'
          }
        }
      })

      if (error) throw error

      setMessage(`✅ User created successfully! Check ${email} for confirmation email.`)
      
      // Try to auto-confirm (this only works if email confirmations are disabled)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (!signInError) {
        setMessage(prev => prev + '\n✅ User auto-confirmed and ready to use!')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="w-full max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Admin Setup - New Supabase Project</CardTitle>
            <CardDescription>
              Quick setup for your new Supabase project at {projectInfo?.projectId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Project Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Project Info</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <span>Project URL:</span>
                  <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{projectInfo?.url}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Project ID:</span>
                  <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">{projectInfo?.projectId}</code>
                </div>
                <div>
                  <a 
                    href={projectInfo?.dashboardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    Open Supabase Dashboard <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Create User Form */}
            <div className="space-y-4">
              <h3 className="font-semibold">Create Your User Account</h3>
              
              {message && (
                <div className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-3 rounded-lg flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm whitespace-pre-line">{message}</span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="omars14@gmail.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Choose a secure password"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              </div>

              <Button 
                onClick={handleSignUp} 
                disabled={loading || !password || password.length < 6}
                className="w-full"
              >
                {loading ? 'Creating...' : 'Create User Account'}
              </Button>
            </div>

            {/* Alternative Methods */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Alternative Methods</h3>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Option 1: Use Supabase Dashboard</p>
                <ol className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>1. Go to your <a href={`${projectInfo?.dashboardUrl}/auth/users`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Auth Users page</a></li>
                  <li>2. Click "Add user" → "Create new user"</li>
                  <li>3. Enter email and password</li>
                  <li>4. Check "Auto Confirm Email"</li>
                </ol>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Option 2: Use the Sign Up Page</p>
                <p className="text-sm text-muted-foreground">
                  Go to <a href="/signup" className="text-blue-600 hover:underline">/signup</a> and create your account there.
                </p>
              </div>
            </div>

            {/* SQL Commands */}
            <div className="border-t pt-4 space-y-3">
              <h3 className="font-semibold">Useful SQL Commands</h3>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Run these in your SQL Editor:</p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <code className="text-xs flex-1">
                      -- Check if user exists<br/>
                      SELECT id, email, email_confirmed_at<br/>
                      FROM auth.users<br/>
                      WHERE email = 'omars14@gmail.com';
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard("SELECT id, email, email_confirmed_at FROM auth.users WHERE email = 'omars14@gmail.com';")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
