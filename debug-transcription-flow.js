const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debugFlow() {
  console.log('🔍 DEBUGGING TRANSCRIPTION FLOW\n');
  console.log('========================================');
  
  // 1. Check environment
  console.log('1. ENVIRONMENT VARIABLES:');
  console.log('   N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL || 'NOT SET');
  console.log('   NEXT_PUBLIC_URL:', process.env.NEXT_PUBLIC_URL || 'NOT SET');
  console.log('');
  
  // 2. Check n8n webhook
  console.log('2. TESTING N8N WEBHOOK:');
  const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://c88c474cb8e3.ngrok-free.app/webhook/medical-transcribe-v2';
  console.log('   URL:', webhookUrl);
  
  try {
    const testPayload = {
      id: "debug-test-123",
      audioUrl: "https://yaznemrwbingjwqutbvb.supabase.co/storage/v1/object/public/audio-files/test.mp3",
      fileName: "test.mp3",
      doctorName: "Debug Doctor",
      patientName: "Debug Patient",
      documentType: "consultation",
      callbackUrl: "http://localhost:3000/api/transcription-result-v2"
    };
    
    console.log('   Sending test payload...');
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });
    
    const responseText = await response.text();
    console.log('   Response Status:', response.status);
    console.log('   Response:', responseText.substring(0, 200));
  } catch (error) {
    console.log('   ❌ ERROR:', error.message);
  }
  console.log('');
  
  // 3. Check recent transcriptions
  console.log('3. RECENT TRANSCRIPTIONS:');
  const { data: transcriptions, error } = await supabase
    .from('transcriptions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
  
  if (transcriptions) {
    for (const t of transcriptions) {
      console.log(`   ID: ${t.id}`);
      console.log(`   Status: ${t.status}`);
      console.log(`   Created: ${new Date(t.created_at).toLocaleTimeString()}`);
      console.log(`   Error: ${t.error || 'None'}`);
      console.log('   ---');
    }
  }
  console.log('');
  
  // 4. Test the API endpoint
  console.log('4. TESTING API ENDPOINT:');
  try {
    const apiResponse = await fetch('http://localhost:3000/api/transcribe-medical');
    const apiData = await apiResponse.json();
    console.log('   Health Check:', apiData.status);
    console.log('   Version:', apiData.version);
  } catch (error) {
    console.log('   ❌ API Error:', error.message);
  }
  console.log('');
  
  // 5. Check if n8n is actually running
  console.log('5. N8N STATUS:');
  try {
    const n8nResponse = await fetch('http://localhost:5678/webhook/medical-transcribe-v2', {
      method: 'GET'
    });
    const n8nText = await n8nResponse.text();
    console.log('   n8n Response:', n8nText.substring(0, 100));
  } catch (error) {
    console.log('   ❌ n8n not accessible locally:', error.message);
  }
  
  console.log('\n========================================');
  console.log('DIAGNOSIS:');
  
  // Provide diagnosis
  if (!process.env.N8N_WEBHOOK_URL) {
    console.log('❌ N8N_WEBHOOK_URL not set in environment');
  } else if (!process.env.N8N_WEBHOOK_URL.includes('ngrok')) {
    console.log('⚠️  N8N_WEBHOOK_URL not using ngrok URL');
  } else {
    console.log('✅ Environment variables look correct');
  }
}

debugFlow().catch(console.error);
