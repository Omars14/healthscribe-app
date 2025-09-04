'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function TestDBPage() {
  const [transcriptions, setTranscriptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const fetchAllTranscriptions = async () => {
    setLoading(true)
    setError('')
    
    try {
      // First, try to fetch ALL transcriptions (no filter)
      const { data: allData, error: allError } = await supabase
        .from('transcriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (allError) {
        setError(`Error fetching all: ${allError.message}`)
      } else {
        console.log('All transcriptions:', allData)
        setTranscriptions(allData || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserTranscriptions = async () => {
    if (!user) {
      setError('No user logged in')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) {
        setError(`Error fetching user records: ${error.message}`)
      } else {
        console.log('User transcriptions:', data)
        setTranscriptions(data || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const checkSpecificRecord = async () => {
    setLoading(true)
    setError('')
    
    try {
      const { data, error } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', 'c56215df-17b3-4b6e-93f3-a3ab545edf4b')
        .single()
      
      if (error) {
        setError(`Error fetching specific record: ${error.message}`)
      } else {
        console.log('Specific record:', data)
        setTranscriptions(data ? [data] : [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllTranscriptions()
  }, [])

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Database Test</CardTitle>
          <CardDescription>
            Testing Supabase connection and data retrieval
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Current User: {user ? `${user.email} (${user.id})` : 'Not logged in'}
            </p>
            <p className="text-sm text-muted-foreground">
              Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchAllTranscriptions} disabled={loading}>
              Fetch All Records
            </Button>
            <Button onClick={fetchUserTranscriptions} disabled={loading || !user}>
              Fetch My Records
            </Button>
            <Button onClick={checkSpecificRecord} disabled={loading}>
              Check Latest Upload
            </Button>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold">Results ({transcriptions.length} records):</h3>
            {loading ? (
              <p>Loading...</p>
            ) : transcriptions.length === 0 ? (
              <p className="text-muted-foreground">No records found</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {transcriptions.map((t, i) => (
                  <div key={t.id || i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <strong>ID:</strong> {t.id}
                      </div>
                      <div>
                        <strong>User ID:</strong> {t.user_id || 'null'}
                      </div>
                      <div>
                        <strong>File:</strong> {t.file_name}
                      </div>
                      <div>
                        <strong>Status:</strong> {t.status || 'no status'}
                      </div>
                      <div>
                        <strong>Doctor:</strong> {t.doctor_name}
                      </div>
                      <div>
                        <strong>Patient:</strong> {t.patient_name}
                      </div>
                      <div className="col-span-2">
                        <strong>Created:</strong> {new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Check browser console for detailed data</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
