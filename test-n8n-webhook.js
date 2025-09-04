const fetch = require('node-fetch');

async function testN8nWebhook() {
  console.log('🚀 Testing n8n Webhook...\n');
  
  // Sample base64 audio (very small test audio)
  const testBase64Audio = "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
  
  const webhookUrl = 'http://localhost:5678/webhook-test/medical-transcribe-v2';
  
  const testPayload = {
    id: `test-${Date.now()}`,
    transcriptionId: `trans-${Date.now()}`,
    audio: testBase64Audio,
    format: 'wav',
    fileName: 'test-audio.wav',
    doctorName: 'Dr. John Smith',
    patientName: 'Jane Doe',
    documentType: 'consultation',
    additionalNotes: 'This is a test transcription request',
    audioUrl: 'https://example.com/test-audio.wav',
    fileSize: 1024,
    userId: 'test-user-123',
    callbackUrl: 'http://localhost:3000/api/transcription-result-v2',
    language: 'en'
  };
  
  console.log('📦 Webhook URL:', webhookUrl);
  console.log('📝 Test Payload:');
  console.log('  - Transcription ID:', testPayload.transcriptionId);
  console.log('  - Doctor:', testPayload.doctorName);
  console.log('  - Patient:', testPayload.patientName);
  console.log('  - Document Type:', testPayload.documentType);
  console.log('  - Language:', testPayload.language);
  console.log('');
  
  try {
    console.log('📤 Sending request to n8n webhook...');
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log('📨 Response Status:', response.status, response.statusText);
    
    if (response.ok) {
      const responseData = await response.text();
      console.log('✅ SUCCESS! Webhook triggered successfully');
      console.log('\n📋 Response from n8n:');
      try {
        const jsonResponse = JSON.parse(responseData);
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch {
        console.log(responseData);
      }
      
      console.log('\n✨ Next Steps:');
      console.log('1. Check the n8n editor - you should see the execution');
      console.log('2. Click on each node to see the data flow');
      console.log('3. Check for any errors in the nodes');
      console.log('4. If using OpenAI/Gemini, make sure credentials are configured');
    } else {
      const errorText = await response.text();
      console.log('❌ Webhook returned an error');
      console.log('Error Response:', errorText);
      
      if (response.status === 404) {
        console.log('\n⚠️  Webhook not found! Make sure to:');
        console.log('1. Open n8n at http://localhost:5678');
        console.log('2. Open your workflow');
        console.log('3. Click on the Webhook node');
        console.log('4. Click "Listen For Test Event"');
        console.log('5. Then run this test again');
      }
    }
  } catch (error) {
    console.error('❌ Error calling webhook:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n⚠️  Cannot connect to n8n!');
      console.log('Make sure n8n is running at http://localhost:5678');
    }
  }
  
  console.log('\n📊 Test complete!');
}

// Run the test
testN8nWebhook().catch(console.error);
