import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || 'https://project6.app.n8n.cloud/webhook/medical-transcribe-v2'
    
    console.log('Testing n8n webhook connectivity...')
    console.log('URL:', N8N_WEBHOOK_URL)
    console.log('Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? 'YES' : 'NO',
      N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL ? 'SET' : 'NOT SET'
    })
    
    // Try a simple POST request with minimal payload
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      source: 'vercel-test'
    }
    
    console.log('Sending test request...')
    const startTime = Date.now()
    
    try {
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
        // Add a shorter timeout for testing
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })
      
      const endTime = Date.now()
      const responseTime = endTime - startTime
      
      console.log(`Response received in ${responseTime}ms`)
      console.log('Status:', response.status)
      console.log('Status Text:', response.statusText)
      console.log('Headers:', Object.fromEntries(response.headers.entries()))
      
      let responseBody = ''
      try {
        responseBody = await response.text()
        console.log('Response body:', responseBody.substring(0, 500))
      } catch (e) {
        console.log('Could not read response body:', e)
      }
      
      return NextResponse.json({
        success: true,
        reachable: true,
        status: response.status,
        statusText: response.statusText,
        responseTime: `${responseTime}ms`,
        responseBody: responseBody.substring(0, 500),
        webhookUrl: N8N_WEBHOOK_URL,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL ? 'YES' : 'NO'
        }
      })
      
    } catch (fetchError: any) {
      console.error('Fetch error:', {
        name: fetchError.name,
        message: fetchError.message,
        code: fetchError.code,
        cause: fetchError.cause,
        stack: fetchError.stack
      })
      
      return NextResponse.json({
        success: false,
        reachable: false,
        error: {
          name: fetchError.name,
          message: fetchError.message,
          code: fetchError.code,
          type: fetchError.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR'
        },
        webhookUrl: N8N_WEBHOOK_URL,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL ? 'YES' : 'NO'
        }
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  console.log('🔄 Direct n8n webhook test...')
  
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL
  
  if (!webhookUrl) {
    return NextResponse.json({
      error: 'N8N webhook URL not configured'
    }, { status: 500 })
  }
  
  try {
    const payload = await request.json()
    
    console.log('📡 Calling n8n directly at:', webhookUrl)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const responseText = await response.text()
    console.log('📨 Direct response:', response.status, responseText)
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      response: responseText,
      webhookUrl
    })
  } catch (error) {
    console.error('❌ Direct test failed:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      webhookUrl
    }, { status: 500 })
  }
}
