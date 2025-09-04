import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_N8N_WEBHOOK_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'NOT SET',
      N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL || 'NOT SET',
      NEXT_PUBLIC_WEBHOOK_URL: process.env.NEXT_PUBLIC_WEBHOOK_URL || 'NOT SET',
      NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL || 'NOT SET',
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT SET',
      hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    timestamp: new Date().toISOString()
  })
}
