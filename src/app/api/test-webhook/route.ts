import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('[WEBHOOK TEST] Starting test...')
  
  const testUrl = 'https://webhook.site/59e6b7d0-1234-4567-8901-abcdef123456'
  const ngrokUrl = process.env.N8N_WEBHOOK_URL || 'NOT SET'
  
  console.log('[WEBHOOK TEST] N8N_WEBHOOK_URL from env:', ngrokUrl)
  
  // Test 1: Try webhook.site
  try {
    console.log('[WEBHOOK TEST] Attempting webhook.site call...')
    const webhookSiteResponse = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'from vercel', timestamp: new Date().toISOString() })
    })
    console.log('[WEBHOOK TEST] webhook.site status:', webhookSiteResponse.status)
  } catch (error) {
    console.error('[WEBHOOK TEST] webhook.site error:', error)
  }
  
  // Test 2: Try ngrok if set
  if (ngrokUrl !== 'NOT SET') {
    try {
      console.log('[WEBHOOK TEST] Attempting ngrok call to:', ngrokUrl)
      const ngrokResponse = await fetch(ngrokUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: 'from vercel direct test', timestamp: new Date().toISOString() })
      })
      console.log('[WEBHOOK TEST] ngrok status:', ngrokResponse.status)
      const text = await ngrokResponse.text()
      console.log('[WEBHOOK TEST] ngrok response:', text.substring(0, 200))
    } catch (error) {
      console.error('[WEBHOOK TEST] ngrok error:', error)
    }
  }
  
  return NextResponse.json({
    message: 'Test completed - check Vercel Function Logs',
    ngrokUrl: ngrokUrl,
    timestamp: new Date().toISOString()
  })
}

export async function GET() {
  const ngrokUrl = process.env.N8N_WEBHOOK_URL || 'NOT SET'
  return NextResponse.json({
    N8N_WEBHOOK_URL: ngrokUrl,
    expected: 'https://c88c474cb8e3.ngrok-free.app/webhook/medical-transcribe-v2',
    isCorrect: ngrokUrl === 'https://c88c474cb8e3.ngrok-free.app/webhook/medical-transcribe-v2'
  })
}
