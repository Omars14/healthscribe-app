'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UserProfile, UserRole } from '@/types/review'

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: Error | null }>
  updateUserRole: (userId: string, role: UserRole) => Promise<{ error: Error | null }>
  assignEditor: (transcriptionistId: string, editorId: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Silently ignore 406 errors (PostgREST content negotiation issues)
        if (error.message?.includes('406') || error.code === '406') {
          console.log('⚠️ User profile fetch returned 406 - non-critical, continuing...')
          return
        }
        
        // If profile doesn't exist, create one
        if (error.code === 'PGRST116') {
          // Use the current user from state instead of making another API call
          if (user) {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                id: userId,
                email: user.email!,
                full_name: user.user_metadata?.name || null,
                role: 'transcriptionist'
              })
              .select()
              .single()

            if (!createError && newProfile) {
              setUserProfile(newProfile as UserProfile)
            }
          }
        } else {
          console.warn('User profile fetch error:', error.message)
        }
      } else if (data) {
        setUserProfile(data as UserProfile)
      }
    } catch (error) {
      // Suppress 406 errors in console
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (!errorMessage.includes('406')) {
        console.error('Error fetching user profile:', error)
      }
    }
  }

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔐 Auth state change:', _event, 'User ID:', session?.user?.id)
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchUserProfile(session.user.id)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      router.push('/dashboard')
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://healthscribepro.vercel.app'}/login`,
        },
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      // Always use production URL for password reset redirects
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? 'https://healthscribe.pro/reset-password'
        : `${window.location.origin}/reset-password`
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)

      if (error) throw error

      // Refresh profile if updating current user
      if (userId === user?.id) {
        await fetchUserProfile(userId)
      }

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const assignEditor = async (transcriptionistId: string, editorId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ assigned_editor_id: editorId })
        .eq('id', transcriptionistId)

      if (error) throw error

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }

  const value = {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserRole,
    assignEditor,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
