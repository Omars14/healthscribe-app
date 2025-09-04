const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Configuration
const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL;
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

console.log('🧪 Testing n8n Integration\n');
console.log('━'.repeat(60));
console.log('n8n Webhook URL:', N8N_WEBHOOK_URL);
console.log('API URL:', API_URL);
console.log('━'.repeat(60) + '\n');

async function testWebhook() {
  if (!N8N_WEBHOOK_URL) {
    console.error('❌ N8N_WEBHOOK_URL not configured in .env.local');
    return;
  }

  // Test 1: Check if n8n webhook is accessible
  console.log('📡 Test 1: Checking n8n webhook accessibility...');
  try {
    const testPayload = {
      body: {
        uploadId: 'test-' + Date.now(),
        fileName: 'test-audio.mp3',
        fileSize: 1024,
        fileType: 'audio/mp3',
        fileContent: 'SGVsbG8gV29ybGQh', // "Hello World!" in base64
        doctorName: 'Dr. Test',
        patientName: 'Test Patient',
        documentType: 'test',
        userId: 'test-user',
        uploadTime: new Date().toISOString(),
        storageProvider: 'supabase'
      }
    };

    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
      timeout: 10000
    });

    const responseText = await response.text();
    
    if (response.ok || responseText.includes('Workflow started')) {
      console.log('✅ n8n webhook is accessible and responsive');
      console.log('   Response:', responseText.substring(0, 100) + '...');
    } else {
      console.log('⚠️ n8n webhook returned:', response.status, response.statusText);
      console.log('   Response:', responseText.substring(0, 200));
    }
  } catch (error) {
    console.error('❌ Failed to reach n8n webhook:', error.message);
    console.log('   Make sure n8n is running and the webhook URL is correct');
  }

  // Test 2: Check if our callback endpoint is accessible
  console.log('\n📡 Test 2: Checking callback endpoint...');
  try {
    const healthResponse = await fetch(`${API_URL}/api/transcription-result-v2`);
    const healthData = await healthResponse.json();
    
    if (healthResponse.ok) {
      console.log('✅ Callback endpoint is accessible');
      console.log('   Response:', healthData);
    } else {
      console.log('⚠️ Callback endpoint returned:', healthResponse.status);
    }
  } catch (error) {
    console.error('❌ Failed to reach callback endpoint:', error.message);
    console.log('   Make sure your Next.js app is running (npm run dev)');
  }

  // Test 3: Check the workflow configuration
  console.log('\n📋 Test 3: Workflow configuration check...');
  console.log('Your n8n workflow should have:');
  console.log('  1. ✓ Webhook trigger at path: /upload');
  console.log('  2. ✓ OpenAI Whisper nodes configured with API key');
  console.log('  3. ✓ Callback to:', `${API_URL}/api/transcription-result-v2`);
  console.log('\nMake sure to update the callback URL in n8n if needed:');
  console.log(`  - For local testing: ${API_URL}/api/transcription-result-v2`);
  console.log(`  - For production: https://your-domain.com/api/transcription-result-v2`);
}

async function testFullFlow() {
  console.log('\n' + '━'.repeat(60));
  console.log('🔄 Test 4: Full integration test');
  console.log('━'.repeat(60) + '\n');
  
  console.log('Instructions for manual test:');
  console.log('1. Start your Next.js app: npm run dev');
  console.log('2. Make sure n8n is running with the workflow active');
  console.log('3. Go to http://localhost:3000');
  console.log('4. Sign up/login');
  console.log('5. Upload a small test audio file');
  console.log('6. Check the following:');
  console.log('   - File uploads successfully');
  console.log('   - Status changes to "processing"');
  console.log('   - n8n Executions tab shows the workflow ran');
  console.log('   - Transcription appears after processing');
  console.log('\n📌 Common issues:');
  console.log('   - If webhook fails: Check n8n is running and webhook URL is correct');
  console.log('   - If callback fails: Update the URL in n8n workflow to match your setup');
  console.log('   - If transcription fails: Check OpenAI API key in n8n credentials');
}

// Run tests
testWebhook().then(() => {
  testFullFlow();
  
  console.log('\n' + '═'.repeat(60));
  console.log('✨ Configuration Summary');
  console.log('═'.repeat(60));
  console.log('\n📝 Required environment variables in .env.local:');
  console.log('NEXT_PUBLIC_N8N_WEBHOOK_URL=' + (N8N_WEBHOOK_URL || '[NOT SET - REQUIRED]'));
  console.log('NEXT_PUBLIC_API_URL=' + (API_URL || 'http://localhost:3000'));
  
  console.log('\n📝 Required n8n workflow updates:');
  console.log('1. In the "Send Transcription Result" node:');
  console.log(`   URL: ${API_URL}/api/transcription-result-v2`);
  console.log('\n2. Make sure OpenAI credentials are configured');
  console.log('\n3. Ensure the workflow is active (not just saved)');
});
