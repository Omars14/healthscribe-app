'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function AuthDebugPage() {
  const { user, session, userProfile, loading } = useAuth()
  const [serverProfile, setServerProfile] = useState(null)
  const [serverError, setServerError] = useState(null)
  const [clientProfile, setClientProfile] = useState(null)
  const [clientError, setClientError] = useState(null)

  // Test server-side profile fetch
  const testServerProfile = async () => {
    if (!session?.access_token) return
    
    try {
      const response = await fetch('/api/admin/check-user-role', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setServerProfile(data)
        setServerError(null)
      } else {
        const error = await response.json()
        setServerError(error)
        setServerProfile(null)
      }
    } catch (error) {
      setServerError({ error: error.message })
      setServerProfile(null)
    }
  }

  // Test client-side profile fetch
  const testClientProfile = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (error) {
        setClientError(error)
        setClientProfile(null)
      } else {
        setClientProfile(data)
        setClientError(null)
      }
    } catch (error) {
      setClientError({ message: error.message })
      setClientProfile(null)
    }
  }

  useEffect(() => {
    if (session && user) {
      testServerProfile()
      testClientProfile()
    }
  }, [session, user])

  const styles = {
    container: { padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' },
    section: { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', margin: '15px 0' },
    success: { backgroundColor: '#d4edda', borderColor: '#c3e6cb' },
    error: { backgroundColor: '#f8d7da', borderColor: '#f5c6cb' },
    warning: { backgroundColor: '#fff3cd', borderColor: '#ffeaa7' },
    code: { backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', fontSize: '12px', overflow: 'auto' }
  }

  return (
    <div style={styles.container}>
      <h1>🔍 Authentication Debug Tool</h1>
      <p>Comprehensive authentication state analysis for omars14@gmail.com</p>

      {/* Auth Context State */}
      <div style={{...styles.section, ...(user ? styles.success : styles.error)}}>
        <h2>🔐 Auth Context State</h2>
        <div style={styles.code}>
          <strong>Loading:</strong> {loading ? 'Yes' : 'No'}<br/>
          <strong>User:</strong> {user ? user.email : 'None'}<br/>
          <strong>User ID:</strong> {user?.id || 'None'}<br/>
          <strong>Session:</strong> {session ? 'Active' : 'None'}<br/>
          <strong>Access Token:</strong> {session?.access_token ? 'Present' : 'Missing'}<br/>
          <strong>Profile from Context:</strong> {userProfile ? JSON.stringify(userProfile, null, 2) : 'None'}
        </div>
      </div>

      {/* Server-side Profile Check */}
      <div style={{...styles.section, ...(serverProfile ? styles.success : serverError ? styles.error : styles.warning)}}>
        <h2>🖥️ Server-side Profile Check</h2>
        <button 
          onClick={testServerProfile} 
          style={{padding: '8px 16px', marginBottom: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px'}}
        >
          Test Server Profile
        </button>
        <div style={styles.code}>
          {serverProfile ? (
            <>
              <strong>✅ Server Profile:</strong><br/>
              {JSON.stringify(serverProfile, null, 2)}
            </>
          ) : serverError ? (
            <>
              <strong>❌ Server Error:</strong><br/>
              {JSON.stringify(serverError, null, 2)}
            </>
          ) : (
            <strong>⏳ Click button to test server profile</strong>
          )}
        </div>
      </div>

      {/* Client-side Profile Check */}
      <div style={{...styles.section, ...(clientProfile ? styles.success : clientError ? styles.error : styles.warning)}}>
        <h2>💻 Client-side Profile Check</h2>
        <button 
          onClick={testClientProfile}
          style={{padding: '8px 16px', marginBottom: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px'}}
        >
          Test Client Profile
        </button>
        <div style={styles.code}>
          {clientProfile ? (
            <>
              <strong>✅ Client Profile:</strong><br/>
              {JSON.stringify(clientProfile, null, 2)}
            </>
          ) : clientError ? (
            <>
              <strong>❌ Client Error:</strong><br/>
              {JSON.stringify(clientError, null, 2)}
            </>
          ) : (
            <strong>⏳ Click button to test client profile</strong>
          )}
        </div>
      </div>

      {/* Expected vs Actual */}
      <div style={styles.section}>
        <h2>🎯 Expected vs Actual</h2>
        <div style={styles.code}>
          <strong>Expected Email:</strong> omars14@gmail.com<br/>
          <strong>Actual Email:</strong> {user?.email || 'Not found'}<br/>
          <strong>Expected Role:</strong> admin<br/>
          <strong>Actual Role:</strong> {userProfile?.role || serverProfile?.role || clientProfile?.role || 'Not found'}<br/>
          <strong>Match Status:</strong> {
            user?.email === 'omars14@gmail.com' && 
            (userProfile?.role === 'admin' || serverProfile?.role === 'admin' || clientProfile?.role === 'admin')
            ? '✅ Perfect Match' 
            : '❌ Mismatch Detected'
          }
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.section}>
        <h2>🚀 Quick Actions</h2>
        <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
          <a href="/dashboard" style={{padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '4px'}}>
            Back to Dashboard
          </a>
          <a href="/admin-direct" style={{padding: '8px 16px', backgroundColor: '#dc3545', color: 'white', textDecoration: 'none', borderRadius: '4px'}}>
            Direct Admin Access
          </a>
          <a href="/login" style={{padding: '8px 16px', backgroundColor: '#ffc107', color: 'black', textDecoration: 'none', borderRadius: '4px'}}>
            Re-login
          </a>
          <button 
            onClick={() => window.location.reload()}
            style={{padding: '8px 16px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px'}}
          >
            Refresh Page
          </button>
        </div>
      </div>

      {/* Troubleshooting Steps */}
      <div style={styles.section}>
        <h2>🔧 Troubleshooting Steps</h2>
        <ol style={{lineHeight: '1.6'}}>
          <li><strong>Check Login:</strong> Make sure you're logged in as omars14@gmail.com</li>
          <li><strong>Verify Profile:</strong> Server profile should show role: "admin"</li>
          <li><strong>Clear Cache:</strong> Try refreshing or clearing browser cache</li>
          <li><strong>Re-login:</strong> Sign out and sign back in</li>
          <li><strong>Database Check:</strong> Verify user_profiles table has correct role</li>
        </ol>
      </div>
    </div>
  )
}
