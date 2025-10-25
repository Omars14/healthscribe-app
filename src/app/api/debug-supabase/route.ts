import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/**
 * Debug endpoint to diagnose Supabase connectivity issues
 * Tests both ANON and SERVICE_ROLE keys
 * Verifies table access and environment setup
 * 
 * Usage: GET /api/debug-supabase
 * Returns diagnostic information about Supabase setup
 */
export async function GET(request: Request) {
  const checks: any = {
    timestamp: new Date().toISOString(),
    env: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      urls: {
        supabase: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓' : '✗',
        n8nWebhook: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ? '✓' : '✗'
      }
    },
    connections: {} as any,
    tables: {} as any,
    errors: [] as string[]
  }

  try {
    // Verify environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      checks.errors.push('NEXT_PUBLIC_SUPABASE_URL not set')
      return NextResponse.json(checks, { status: 500 })
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      checks.errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY not set')
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      checks.errors.push('SUPABASE_SERVICE_ROLE_KEY not set (required for API routes)')
    }

    // Test with ANON key (client-side)
    try {
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
      )
      
      const { error: anonError, count: anonCount } = await anonClient
        .from('transcriptions')
        .select('count', { count: 'exact', head: true })
        .limit(1)
      
      checks.connections.anonKey = anonError 
        ? { status: 'ERROR', message: anonError.message, code: anonError.code }
        : { status: 'OK', message: 'Connected and authenticated' }
    } catch (err: any) {
      checks.connections.anonKey = { status: 'EXCEPTION', message: err.message }
      checks.errors.push(`ANON key test failed: ${err.message}`)
    }

    // Test with SERVICE key (server-side)
    try {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )
      
      const { error: serviceError, count: serviceCount } = await serviceClient
        .from('transcriptions')
        .select('count', { count: 'exact', head: true })
        .limit(1)
      
      checks.connections.serviceKey = serviceError
        ? { status: 'ERROR', message: serviceError.message, code: serviceError.code }
        : { status: 'OK', message: 'Connected and authenticated' }
    } catch (err: any) {
      checks.connections.serviceKey = { status: 'EXCEPTION', message: err.message }
      checks.errors.push(`SERVICE key test failed: ${err.message}`)
    }

    // Test user_profiles table access
    try {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )

      const { error: profileError, count: profileCount } = await serviceClient
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .limit(1)
      
      checks.tables.user_profiles = profileError
        ? { status: 'ERROR', message: profileError.message, code: profileError.code }
        : { status: 'OK', message: `Table exists and accessible (${profileCount} rows)` }
    } catch (err: any) {
      checks.tables.user_profiles = { status: 'EXCEPTION', message: err.message }
      checks.errors.push(`user_profiles table test failed: ${err.message}`)
    }

    // Test transcriptions table
    try {
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )

      const { error: transError, count: transCount } = await serviceClient
        .from('transcriptions')
        .select('*', { count: 'exact', head: true })
        .limit(1)
      
      checks.tables.transcriptions = transError
        ? { status: 'ERROR', message: transError.message, code: transError.code }
        : { status: 'OK', message: `Table exists and accessible (${transCount} rows)` }
    } catch (err: any) {
      checks.tables.transcriptions = { status: 'EXCEPTION', message: err.message }
      checks.errors.push(`transcriptions table test failed: ${err.message}`)
    }

    // Test workspace-transcriptions endpoint internally
    try {
      const testUserId = '4e298b89-8579-46fc-8c3c-69bb024a5ac3' // Test UUID
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY || ''
      )

      const { data, error: queryError } = await serviceClient
        .from('transcriptions')
        .select('*')
        .eq('user_id', testUserId)
        .limit(1)
      
      checks.tables.workspace_query = queryError
        ? { status: 'ERROR', message: queryError.message }
        : { status: 'OK', message: `Query executed, found ${data?.length || 0} transcriptions` }
    } catch (err: any) {
      checks.tables.workspace_query = { status: 'EXCEPTION', message: err.message }
      checks.errors.push(`Workspace query test failed: ${err.message}`)
    }

    // Overall status
    checks.status = checks.errors.length === 0 ? 'HEALTHY' : 'DEGRADED'

  } catch (err: any) {
    checks.status = 'CRITICAL'
    checks.errors.push(`Global error: ${err.message}`)
    return NextResponse.json(checks, { status: 500 })
  }

  const statusCode = checks.status === 'HEALTHY' ? 200 : checks.status === 'CRITICAL' ? 500 : 200

  return NextResponse.json(checks, { status: statusCode })
}
