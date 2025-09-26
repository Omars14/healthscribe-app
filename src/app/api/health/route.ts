import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'healthscribe-dashboard',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    }

    return NextResponse.json(healthData, { status: 200 })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: 'Health check failed' 
      }, 
      { status: 500 }
    )
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, { status: 200 })
}