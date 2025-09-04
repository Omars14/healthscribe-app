// Test script to check recent transcriptions in Supabase
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

async function checkRecentTranscriptions() {
  console.log('🔍 Checking recent transcriptions...\n')
  
  // Get transcriptions from the last 24 hours
  const since = new Date()
  since.setHours(since.getHours() - 24)
  
  const { data: transcriptions, error } = await supabase
    .from('transcriptions')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(10)
  
  if (error) {
    console.error('❌ Error fetching transcriptions:', error)
    return
  }
  
  if (!transcriptions || transcriptions.length === 0) {
    console.log('No transcriptions found in the last 24 hours')
    return
  }
  
  console.log(`Found ${transcriptions.length} recent transcription(s):\n`)
  
  transcriptions.forEach((t, index) => {
    console.log(`${index + 1}. Transcription ${t.id}`)
    console.log(`   Created: ${new Date(t.created_at).toLocaleString()}`)
    console.log(`   Status: ${t.status || 'N/A'}`)
    console.log(`   File: ${t.file_name}`)
    console.log(`   Size: ${(t.file_size / 1024 / 1024).toFixed(2)} MB`)
    console.log(`   Doctor: ${t.doctor_name}`)
    console.log(`   Patient: ${t.patient_name}`)
    console.log(`   Audio URL: ${t.audio_url ? '✅ Present' : '❌ Missing'}`)
    console.log(`   Transcription: ${t.transcription_text ? `${t.transcription_text.substring(0, 50)}...` : 'Not yet available'}`)
    console.log('')
  })
  
  // Check storage bucket
  console.log('\n🗄️ Checking storage bucket...')
  const { data: files, error: storageError } = await supabase.storage
    .from('audio-files')
    .list('', {
      limit: 5,
      sortBy: { column: 'created_at', order: 'desc' }
    })
  
  if (storageError) {
    console.error('❌ Error checking storage:', storageError)
  } else if (files && files.length > 0) {
    console.log(`Found ${files.length} recent file(s) in storage:`)
    files.forEach(f => {
      console.log(`  - ${f.name} (${(f.metadata?.size / 1024 / 1024).toFixed(2)} MB)`)
    })
  } else {
    console.log('No files found in storage')
  }
}

checkRecentTranscriptions().catch(console.error)
