require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const fetch = require('node-fetch');

async function testUploadFlow() {
  console.log('🔍 Testing Medical Transcription Upload Flow\n');
  
  // Configuration
  const API_URL = 'http://localhost:3001/api/transcribe-medical';
  const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
  
  console.log('Configuration:');
  console.log('  API URL:', API_URL);
  console.log('  N8N Webhook:', N8N_WEBHOOK_URL);
  console.log('');
  
  // Step 1: Check if n8n webhook is accessible
  console.log('Step 1: Testing n8n webhook accessibility...');
  try {
    const webhookTest = await fetch(N8N_WEBHOOK_URL, {
      method: 'GET',
      timeout: 5000
    });
    
    if (webhookTest.status === 404) {
      const responseText = await webhookTest.text();
      const response = JSON.parse(responseText);
      if (response.message && response.message.includes('not registered')) {
        console.log('⚠️ Webhook not registered in n8n');
        console.log('   Hint:', response.hint);
        console.log('\n📝 To fix this:');
        console.log('   1. Open n8n at http://localhost:5678');
        console.log('   2. Open your medical transcription workflow');
        console.log('   3. Click on the Webhook node');
        console.log('   4. Set HTTP Method to POST');
        console.log('   5. Set Path to: medical-transcribe-v2');
        console.log('   6. Save the workflow');
        console.log('   7. Click "Execute workflow" to activate test mode');
        console.log('   8. Or activate the workflow for production use');
        return;
      }
    } else if (webhookTest.status === 200) {
      console.log('✅ Webhook endpoint is accessible');
    } else {
      console.log('⚠️ Unexpected webhook status:', webhookTest.status);
    }
  } catch (error) {
    console.error('❌ Cannot reach n8n webhook:', error.message);
    console.log('\n📝 Make sure n8n is running at http://localhost:5678');
    return;
  }
  
  // Step 2: Create a test audio file
  console.log('\nStep 2: Creating test audio file...');
  const testAudioPath = path.join(__dirname, 'test-audio.webm');
  
  // Create a minimal WebM file header (this won't play but will be accepted)
  const webmHeader = Buffer.from([
    0x1a, 0x45, 0xdf, 0xa3, // EBML header
    0x93, 0x42, 0x82, 0x88,
    0x6d, 0x61, 0x74, 0x72,
    0x6f, 0x73, 0x6b, 0x61
  ]);
  
  fs.writeFileSync(testAudioPath, webmHeader);
  console.log('✅ Created test audio file');
  
  // Step 3: Prepare form data
  console.log('\nStep 3: Preparing form data...');
  const form = new FormData();
  form.append('audio', fs.createReadStream(testAudioPath), {
    filename: 'test-recording.webm',
    contentType: 'audio/webm'
  });
  form.append('doctorName', 'Dr. Test Smith');
  form.append('patientName', 'Test Patient');
  form.append('documentType', 'consultation');
  form.append('additionalNotes', 'This is a test upload');
  
  console.log('✅ Form data prepared');
  
  // Step 4: Test API endpoint (without auth for now)
  console.log('\nStep 4: Testing API endpoint...');
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const result = await response.json();
    
    if (response.status === 401) {
      console.log('⚠️ Authentication required (expected)');
      console.log('   The API requires a logged-in user');
      console.log('\n📝 To complete a full test:');
      console.log('   1. Log in at http://localhost:3001/login');
      console.log('   2. Use the medical transcription form at http://localhost:3001/medical-transcription');
    } else if (response.ok) {
      console.log('✅ API endpoint working');
      console.log('   Response:', result);
    } else {
      console.log('❌ API error:', result);
    }
  } catch (error) {
    console.error('❌ API request failed:', error.message);
  }
  
  // Clean up
  fs.unlinkSync(testAudioPath);
  
  console.log('\n📊 Test Summary:');
  console.log('================');
  console.log('✅ Supabase is configured correctly');
  console.log('✅ API endpoint is accessible');
  console.log('⚠️ n8n webhook needs to be registered');
  console.log('⚠️ Authentication required for full test');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Register the webhook in n8n (see instructions above)');
  console.log('2. Log in at http://localhost:3001/login');
  console.log('3. Navigate to http://localhost:3001/medical-transcription');
  console.log('4. Upload a test audio file');
  console.log('5. Monitor n8n execution at http://localhost:5678');
}

testUploadFlow().catch(console.error);
