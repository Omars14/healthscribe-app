import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      hostname: process.env.HOSTNAME,
      // Check if static files exist
      staticDirExists: fs.existsSync(path.join(process.cwd(), '.next', 'static')),
      publicDirExists: fs.existsSync(path.join(process.cwd(), 'public')),
      serverJsExists: fs.existsSync(path.join(process.cwd(), 'server.js')),
      // List some static files
      staticFiles: [],
      // Next.js build info
      buildId: '',
    }

    // Try to list static files
    try {
      const staticDir = path.join(process.cwd(), '.next', 'static')
      if (fs.existsSync(staticDir)) {
        const files = fs.readdirSync(staticDir)
        debugInfo.staticFiles = files.slice(0, 10) // First 10 files
      }
    } catch (err) {
      debugInfo.staticFiles = [`Error reading static files: ${err.message}`]
    }

    // Try to read build ID
    try {
      const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID')
      if (fs.existsSync(buildIdPath)) {
        debugInfo.buildId = fs.readFileSync(buildIdPath, 'utf8').trim()
      }
    } catch (err) {
      debugInfo.buildId = `Error reading BUILD_ID: ${err.message}`
    }

    return NextResponse.json(debugInfo, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json; charset=utf-8'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Debug endpoint failed',
        message: error.message,
        timestamp: new Date().toISOString()
      }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    )
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
  })
}