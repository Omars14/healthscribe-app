'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

// EMERGENCY BYPASS - No authentication, no layout, just the admin content
export default function EmergencyAdminUsersPage() {
  const { user, session, userProfile } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    console.log('🚨 EMERGENCY ADMIN: Starting...')
    console.log('🚨 User:', user?.email)
    console.log('🚨 Session:', !!session)
    console.log('🚨 Profile:', userProfile)

    // Direct API call without any auth checks
    fetch('/api/admin/users?limit=10')
      .then(response => {
        console.log('🚨 API Response:', response.status)
        return response.json()
      })
      .then(data => {
        console.log('🚨 API Data:', data)
        setUsers(data.users || [])
        setLoading(false)
      })
      .catch(error => {
        console.error('🚨 API Error:', error)
        setError(error.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial' }}>
        <h1>🚨 EMERGENCY ADMIN ACCESS</h1>
        <p>Loading users...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial', color: 'red' }}>
        <h1>🚨 EMERGENCY ADMIN ACCESS</h1>
        <p>Error: {error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1 style={{ color: 'red' }}>🚨 EMERGENCY ADMIN ACCESS</h1>
      <p>This is a bypass page with no authentication checks.</p>
      
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <strong>Debug Info:</strong><br/>
        User: {user?.email || 'None'}<br/>
        Session: {session ? 'Active' : 'None'}<br/>
        Profile Role: {userProfile?.role || 'None'}<br/>
        Users Loaded: {users.length}
      </div>

      <h2>Users ({users.length})</h2>
      {users.map(user => (
        <div key={user.id} style={{ 
          border: '1px solid #ccc', 
          margin: '10px 0', 
          padding: '10px',
          backgroundColor: user.role === 'admin' ? '#ffe6e6' : '#f9f9f9'
        }}>
          <strong>{user.email}</strong> ({user.role})
          <br/>
          <small>
            ID: {user.id}<br/>
            Transcriptions: {user.total_transcriptions || 0}<br/>
            Hours: {user.total_hours || 0}<br/>
            Active: {user.is_active ? 'Yes' : 'No'}
          </small>
        </div>
      ))}

      <div style={{ marginTop: '20px' }}>
        <button onClick={() => window.location.href = '/dashboard'}>
          Back to Dashboard
        </button>
        <button onClick={() => window.location.href = '/dashboard/admin/users'} style={{ marginLeft: '10px' }}>
          Try Normal Admin Page
        </button>
      </div>
    </div>
  )
}
