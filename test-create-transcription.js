// Test creating a transcription record directly
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCreateTranscription() {
  console.log('🧪 Testing transcription creation...\n')
  
  // First, check if the table exists
  const { data: tableCheck, error: tableError } = await supabase
    .from('transcriptions')
    .select('*')
    .limit(1)
  
  if (tableError) {
    console.error('❌ Error accessing transcriptions table:', tableError)
    if (tableError.code === '42P01') {
      console.log('\n⚠️ The transcriptions table does not exist!')
      console.log('Please run the database setup SQL in Supabase')
    }
    return
  }
  
  console.log('✅ Transcriptions table exists\n')
  
  // Try to create a test transcription
  const testData = {
    file_name: 'test-audio.mp3',
    doctor_name: 'Dr. Test',
    patient_name: 'Test Patient',
    document_type: 'consultation',
    status: 'pending',
    file_size: 1024000, // 1MB
    transcription_text: '',
    audio_url: 'https://yaznemrwbingjwqutbvb.supabase.co/storage/v1/object/public/audio-files/test.mp3',
    user_id: '625d7540-ab35-4fee-8817-6d0b32644869',
    created_at: new Date().toISOString()
  }
  
  console.log('Attempting to insert:', testData)
  
  const { data, error } = await supabase
    .from('transcriptions')
    .insert(testData)
    .select()
    .single()
  
  if (error) {
    console.error('❌ Error creating transcription:', error)
    
    // Try without status column
    if (error.message?.includes('status')) {
      console.log('\n🔄 Retrying without status column...')
      delete testData.status
      
      const { data: retryData, error: retryError } = await supabase
        .from('transcriptions')
        .insert(testData)
        .select()
        .single()
      
      if (retryError) {
        console.error('❌ Retry also failed:', retryError)
      } else {
        console.log('✅ Created successfully without status column!')
        console.log('Transcription ID:', retryData.id)
      }
    }
  } else {
    console.log('✅ Transcription created successfully!')
    console.log('Transcription ID:', data.id)
    console.log(JSON.stringify(data, null, 2))
  }
  
  // Check n8n webhook
  console.log('\n🔔 Checking n8n webhook configuration...')
  const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || process.env.N8N_WEBHOOK_URL
  if (webhookUrl) {
    console.log('Webhook URL configured:', webhookUrl)
    
    // Try to ping it
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      })
      console.log('Webhook response status:', response.status)
    } catch (e) {
      console.error('Cannot reach webhook:', e.message)
    }
  } else {
    console.log('⚠️ No n8n webhook URL configured in environment variables!')
  }
}

testCreateTranscription().catch(console.error)
