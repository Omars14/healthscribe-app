'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const { resetPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await resetPassword(email)

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <CardDescription>
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Next steps:</p>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the password reset link</li>
                <li>Enter your new password</li>
                <li>Sign in with your new credentials</li>
              </ol>
            </div>
            
            <Button asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Forgot password?</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we&apos;ll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending reset link...
                </>
              ) : (
                'Send reset link'
              )}
            </Button>

            <Button variant="outline" asChild className="w-full">
              <Link href="/login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to login
              </Link>
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}