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
  refreshProfile: () => Promise<void>
  forceLogout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const router = useRouter()

  // Enhanced profile fetching with server-side fallback
  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<void> => {
    if (profileLoading && retryCount === 0) return // Prevent concurrent requests
    
    try {
      setProfileLoading(true)
      console.log('🔧 AuthContext: Fetching user profile for:', userId)

      // Try client-side first
      const { data: clientData, error: clientError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (clientData && !clientError) {
        console.log('✅ AuthContext: Profile loaded from client:', clientData)
        setUserProfile(clientData as UserProfile)
        return
      }

      console.log('⚠️ AuthContext: Client profile fetch failed:', clientError)

      // Fallback to server-side API if we have a session
      if (session?.access_token) {
        console.log('🔧 AuthContext: Trying server-side profile fetch...')
        const response = await fetch('/api/admin/check-user-role', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        if (response.ok) {
          const serverData = await response.json()
          console.log('✅ AuthContext: Profile loaded from server:', serverData)
          
          // Convert server response to UserProfile format
          const profileData: UserProfile = {
            id: userId,
            email: serverData.email,
            full_name: serverData.full_name,
            role: serverData.role as UserRole,
            is_active: serverData.is_active,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assigned_editor_id: null,
            last_active: null,
            metadata: {},
            specialty: 'non_radiology'
          }
          
          setUserProfile(profileData)
          return
        }
      }

      // If profile doesn't exist, create one (only for new users)
      if (clientError?.code === 'PGRST116' && retryCount === 0) {
        console.log('📝 AuthContext: Creating new user profile...')
        const { data: userData } = await supabase.auth.getUser()
        if (userData?.user) {
          const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
              id: userId,
              email: userData.user.email!,
              full_name: userData.user.user_metadata?.name || null,
              role: 'transcriptionist' as UserRole
            })
            .select()
            .single()

          if (!createError && newProfile) {
            console.log('✅ AuthContext: New profile created:', newProfile)
            setUserProfile(newProfile as UserProfile)
            return
          } else {
            console.error('❌ AuthContext: Failed to create profile:', createError)
          }
        }
      }

      // Retry once if first attempt failed
      if (retryCount === 0) {
        console.log('🔄 AuthContext: Retrying profile fetch...')
        setTimeout(() => fetchUserProfile(userId, 1), 1000)
        return
      }

      console.error('❌ AuthContext: All profile fetch attempts failed')
      
    } catch (error) {
      console.error('❌ AuthContext: Profile fetch error:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  // Force logout - clears all state and redirects
  const forceLogout = () => {
    console.log('🚨 AuthContext: Force logout initiated')
    setUser(null)
    setSession(null)
    setUserProfile(null)
    setLoading(false)
    
    // Clear localStorage
    localStorage.clear()
    sessionStorage.clear()
    
    // Clear supabase session
    supabase.auth.signOut().catch(console.error)
    
    router.push('/login')
  }

  // Enhanced session management
  useEffect(() => {
    let mounted = true
    
    const initializeAuth = async () => {
      try {
        console.log('🔧 AuthContext: Initializing authentication...')
        
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('❌ AuthContext: Session error:', error)
          if (mounted) {
            setLoading(false)
          }
          return
        }

        if (mounted) {
          console.log('🔧 AuthContext: Session state:', session ? 'Active' : 'None')
          setSession(session)
          setUser(session?.user ?? null)
          
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          }
          
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ AuthContext: Initialization error:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔧 AuthContext: Auth state change:', event, session ? 'Session Active' : 'No Session')
      
      if (mounted) {
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        } else {
          setUserProfile(null)
        }
        
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔧 AuthContext: Signing in user:', email)
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      console.log('✅ AuthContext: Sign in successful')
      
      // Return success first, then handle navigation
      const result = { error: null }
      
      // Navigate after a small delay to ensure state updates
      setTimeout(() => {
        router.push('/dashboard')
      }, 100)
      
      return result
    } catch (error) {
      console.error('❌ AuthContext: Sign in error:', error)
      return { error: error as Error }
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      console.log('🔧 AuthContext: Signing up user:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/login`,
        },
      })

      if (error) throw error

      console.log('✅ AuthContext: Sign up successful')
      return { error: null }
    } catch (error) {
      console.error('❌ AuthContext: Sign up error:', error)
      return { error: error as Error }
    }
  }

  const signOut = async () => {
    try {
      console.log('🔧 AuthContext: Signing out user...')
      setLoading(true)
      
      // Clear local state first
      setUser(null)
      setSession(null)
      setUserProfile(null)
      
      // Clear storage
      localStorage.clear()
      sessionStorage.clear()
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('⚠️ AuthContext: Supabase signOut error:', error)
        // Continue anyway - local state is cleared
      }

      console.log('✅ AuthContext: Sign out successful')
      router.push('/login')
    } catch (error) {
      console.error('❌ AuthContext: Sign out error:', error)
      // Force logout even if there's an error
      forceLogout()
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      console.log('🔧 AuthContext: Resetting password for:', email)
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      console.log('✅ AuthContext: Password reset email sent')
      return { error: null }
    } catch (error) {
      console.error('❌ AuthContext: Password reset error:', error)
      return { error: error as Error }
    }
  }

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      console.log('🔧 AuthContext: Updating user role:', userId, role)
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ role })
        .eq('id', userId)

      if (error) throw error

      // Refresh profile if updating current user
      if (userId === user?.id) {
        await fetchUserProfile(userId)
      }

      console.log('✅ AuthContext: User role updated')
      return { error: null }
    } catch (error) {
      console.error('❌ AuthContext: Update role error:', error)
      return { error: error as Error }
    }
  }

  const assignEditor = async (transcriptionistId: string, editorId: string) => {
    try {
      console.log('🔧 AuthContext: Assigning editor:', transcriptionistId, editorId)
      
      const { error } = await supabase
        .from('user_profiles')
        .update({ assigned_editor_id: editorId })
        .eq('id', transcriptionistId)

      if (error) throw error

      console.log('✅ AuthContext: Editor assigned')
      return { error: null }
    } catch (error) {
      console.error('❌ AuthContext: Assign editor error:', error)
      return { error: error as Error }
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      console.log('🔄 AuthContext: Refreshing user profile...')
      await fetchUserProfile(user.id)
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
    refreshProfile,
    forceLogout,
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
