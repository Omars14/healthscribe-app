'use client'

import { useState, useEffect } from 'react'

// COMPLETELY ISOLATED ADMIN PAGE - NO DASHBOARD LAYOUT, NO AUTH CONTEXT
export default function DirectAdminPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    console.log('🔥 DIRECT ADMIN: Starting - completely isolated from dashboard layout')
    setDebugInfo('Starting direct API call...')

    // Direct fetch without any auth checks
    const fetchUsers = async () => {
      try {
        console.log('🔥 DIRECT ADMIN: Making API call...')
        setDebugInfo('Making API call to /api/admin/users...')
        
        const response = await fetch('/api/admin/users?limit=15', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        console.log('🔥 DIRECT ADMIN: Response status:', response.status)
        setDebugInfo(`API response: ${response.status} ${response.statusText}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()
        console.log('🔥 DIRECT ADMIN: Data received:', data)
        setDebugInfo(`Success! Loaded ${data.users?.length || 0} users`)

        setUsers(data.users || [])
        setError(null)
      } catch (err) {
        console.error('🔥 DIRECT ADMIN: Error:', err)
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMessage)
        setDebugInfo(`Error: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // Pure HTML/CSS styling - no external dependencies
  const styles = {
    container: {
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      backgroundColor: '#dc2626',
      color: 'white',
      padding: '20px',
      borderRadius: '8px',
      marginBottom: '20px'
    },
    debugBox: {
      backgroundColor: '#fef3c7',
      border: '1px solid #f59e0b',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '20px',
      fontSize: '14px'
    },
    userCard: {
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '10px',
      backgroundColor: '#f9fafb'
    },
    adminCard: {
      backgroundColor: '#fee2e2',
      border: '1px solid #dc2626'
    },
    button: {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '10px 20px',
      borderRadius: '6px',
      cursor: 'pointer',
      marginRight: '10px',
      textDecoration: 'none',
      display: 'inline-block'
    },
    loadingSpinner: {
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      animation: 'spin 2s linear infinite',
      margin: '20px auto'
    }
  }

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>🔥 DIRECT ADMIN ACCESS</h1>
          <p>Bypassing ALL dashboard layouts and auth contexts</p>
        </div>
        
        <div style={styles.debugBox}>
          <strong>Debug:</strong> {debugInfo}
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={styles.loadingSpinner}></div>
          <p>Loading users directly from API...</p>
        </div>

        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h1>🔥 DIRECT ADMIN ACCESS</h1>
          <p>Bypassing ALL dashboard layouts and auth contexts</p>
        </div>
        
        <div style={{ ...styles.debugBox, backgroundColor: '#fee2e2', borderColor: '#dc2626' }}>
          <strong>Error:</strong> {error}
        </div>

        <button 
          style={styles.button}
          onClick={() => window.location.reload()}
        >
          🔄 Retry
        </button>
        
        <a 
          href="/dashboard" 
          style={styles.button}
        >
          🏠 Back to Dashboard
        </a>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1>🔥 DIRECT ADMIN ACCESS</h1>
        <p>Successfully bypassed dashboard layout! Total users: {users.length}</p>
      </div>
      
      <div style={styles.debugBox}>
        <strong>Success:</strong> {debugInfo}<br/>
        <strong>Environment:</strong> {process.env.NODE_ENV}<br/>
        <strong>URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'N/A'}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          style={styles.button}
          onClick={() => window.location.reload()}
        >
          🔄 Refresh Data
        </button>
        
        <a 
          href="/dashboard" 
          style={styles.button}
        >
          🏠 Back to Dashboard
        </a>
        
        <a 
          href="/dashboard/admin/users" 
          style={styles.button}
        >
          🛠️ Try Normal Admin
        </a>
      </div>

      <h2>👥 All Users ({users.length})</h2>
      
      {users.map((user, index) => (
        <div 
          key={user.id} 
          style={{
            ...styles.userCard,
            ...(user.role === 'admin' ? styles.adminCard : {})
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ margin: '0 0 5px 0', color: user.role === 'admin' ? '#dc2626' : '#374151' }}>
                {user.email} {user.role === 'admin' && '👑'}
              </h3>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#6b7280' }}>
                ID: {user.id}
              </p>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span style={{
                backgroundColor: user.role === 'admin' ? '#dc2626' : '#6b7280',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                textTransform: 'uppercase'
              }}>
                {user.role}
              </span>
              <br/>
              <span style={{
                backgroundColor: user.is_active ? '#10b981' : '#ef4444',
                color: 'white',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                marginTop: '4px',
                display: 'inline-block'
              }}>
                {user.is_active ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
          </div>
          
          <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
              <div>📝 <strong>{user.total_transcriptions || 0}</strong> transcriptions</div>
              <div>⏱️ <strong>{user.total_hours || 0}</strong> hours</div>
              <div>📅 {new Date(user.created_at).toLocaleDateString()}</div>
            </div>
            {user.full_name && (
              <div style={{ marginTop: '5px' }}>
                👤 <strong>Name:</strong> {user.full_name}
              </div>
            )}
          </div>
        </div>
      ))}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
        <h3>🔧 Technical Notes</h3>
        <ul style={{ fontSize: '14px', color: '#6b7280' }}>
          <li>This page completely bypasses the dashboard layout system</li>
          <li>No authentication context or route guards</li>
          <li>Direct API access without session tokens</li>
          <li>Pure HTML/CSS with inline styles</li>
          <li>Should work even if dashboard auth is broken</li>
        </ul>
      </div>
    </div>
  )
}
