// Check all transcriptions in the database
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

async function checkAllTranscriptions() {
  console.log('🔍 Checking ALL transcriptions...\n')
  
  // Get all transcriptions
  const { data: transcriptions, error } = await supabase
    .from('transcriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20)
  
  if (error) {
    console.error('❌ Error fetching transcriptions:', error)
    return
  }
  
  console.log(`Found ${transcriptions?.length || 0} total transcription(s)\n`)
  
  if (transcriptions && transcriptions.length > 0) {
    transcriptions.forEach((t, index) => {
      console.log(`${index + 1}. Transcription ${t.id}`)
      console.log(`   Created: ${new Date(t.created_at).toLocaleString()}`)
      console.log(`   Status: ${t.status || 'N/A'}`)
      console.log(`   File: ${t.file_name}`)
      console.log(`   Size: ${t.file_size ? (t.file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown'}`)
      console.log(`   Doctor: ${t.doctor_name}`)
      console.log(`   Patient: ${t.patient_name}`)
      console.log(`   Audio URL: ${t.audio_url ? '✅ Present' : '❌ Missing'}`)
      if (t.audio_url) {
        console.log(`   URL: ${t.audio_url.substring(0, 100)}...`)
      }
      console.log(`   Transcription: ${t.transcription_text ? 'Available' : 'Not yet available'}`)
      console.log('')
    })
  }
  
  // Check specific transcription ID from the error
  console.log('\n📋 Checking specific transcription: a0998835-0ba7-4d6d-8a5f-1862ead85012')
  const { data: specificTx, error: specificError } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('id', 'a0998835-0ba7-4d6d-8a5f-1862ead85012')
    .single()
  
  if (specificError) {
    console.error('Error finding specific transcription:', specificError)
  } else if (specificTx) {
    console.log('Found it!')
    console.log(JSON.stringify(specificTx, null, 2))
  }
  
  // Check storage files
  console.log('\n🗄️ Checking storage bucket for recent files...')
  const { data: files, error: storageError } = await supabase.storage
    .from('audio-files')
    .list('625d7540-ab35-4fee-8817-6d0b32644869', {
      limit: 5,
      sortBy: { column: 'created_at', order: 'desc' }
    })
  
  if (storageError) {
    console.error('❌ Error checking storage:', storageError)
  } else if (files && files.length > 0) {
    console.log(`Found ${files.length} file(s) for user 625d7540-ab35-4fee-8817-6d0b32644869:`)
    files.forEach(f => {
      console.log(`  - ${f.name}`)
    })
  } else {
    console.log('No files found for this user')
  }
  
  // Check if user_profiles table exists
  console.log('\n👤 Checking user_profiles table...')
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
  
  if (profileError) {
    if (profileError.code === '42P01') {
      console.error('❌ user_profiles table does not exist!')
      console.log('Run the fix-user-profiles.sql script in Supabase SQL editor')
    } else {
      console.error('Error checking user_profiles:', profileError)
    }
  } else {
    console.log('✅ user_profiles table exists')
  }
}

checkAllTranscriptions().catch(console.error)
