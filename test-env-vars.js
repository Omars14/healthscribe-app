// Test if environment variables are loaded correctly
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '.env.local') })

console.log('🔍 Checking environment variables...\n')

// Check Supabase URLs
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')

// Check keys
console.log('\nKeys:')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set (first 20 chars: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20) + '...)' : '❌ Missing')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set (first 20 chars: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...)' : '❌ Missing')

// Check webhook
console.log('\nWebhook:')
console.log('N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL ? '✅ ' + process.env.N8N_WEBHOOK_URL : '❌ Missing')
console.log('NEXT_PUBLIC_N8N_WEBHOOK_URL:', process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL ? '✅ ' + process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL : '❌ Missing')

// Test creating Supabase client with service role
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('\n📊 Testing Supabase connection with service role key...')
  
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
  
  // Try to insert with service role (should bypass RLS)
  const testData = {
    file_name: 'env-test.mp3',
    doctor_name: 'Dr. Env Test',
    patient_name: 'Env Patient',
    document_type: 'consultation',
    transcription_text: '',
    audio_url: 'https://test.com/test.mp3',
    user_id: '625d7540-ab35-4fee-8817-6d0b32644869',
    created_at: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('transcriptions')
    .insert(testData)
    .select()
    .single()
  
  if (error) {
    console.error('❌ Failed to insert with service role:', error.message)
    console.log('This suggests RLS is still blocking or the service role key is invalid')
  } else {
    console.log('✅ Successfully inserted with service role!')
    console.log('Record ID:', data.id)
    
    // Clean up
    await supabase
      .from('transcriptions')
      .delete()
      .eq('id', data.id)
    console.log('🧹 Test record cleaned up')
  }
} else {
  console.log('\n⚠️ Cannot test - missing SUPABASE_URL or SERVICE_ROLE_KEY')
}

// Check if we need to add SUPABASE_SERVICE_KEY (without _ROLE)
if (!process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_KEY) {
  console.log('\n💡 Found SUPABASE_SERVICE_KEY but not SUPABASE_SERVICE_ROLE_KEY')
  console.log('You might need to rename it in your .env.local file')
}
