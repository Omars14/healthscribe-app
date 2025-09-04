// Test script to verify API environment variables
const fetch = require('node-fetch');

async function testApiEnv() {
  try {
    console.log('Testing API environment variables...\n');
    
    // Test the test-env endpoint
    const response = await fetch('http://localhost:3000/api/test-env');
    const data = await response.json();
    
    console.log('API Environment Variables:');
    console.log('========================');
    console.log('N8N_WEBHOOK_URL:', data.n8nWebhookUrl || 'NOT SET');
    console.log('NEXT_PUBLIC_N8N_WEBHOOK_URL:', data.nextPublicN8nWebhookUrl || 'NOT SET');
    console.log('\nResolved webhook URL:', data.resolvedWebhookUrl);
    
    if (data.n8nWebhookUrl && data.n8nWebhookUrl.includes('ngrok')) {
      console.log('\n✅ N8N_WEBHOOK_URL is correctly configured with ngrok URL');
    } else if (data.nextPublicN8nWebhookUrl && data.nextPublicN8nWebhookUrl.includes('ngrok')) {
      console.log('\n⚠️  NEXT_PUBLIC_N8N_WEBHOOK_URL is set but N8N_WEBHOOK_URL is not');
      console.log('   API routes should use N8N_WEBHOOK_URL (without NEXT_PUBLIC_ prefix)');
    } else {
      console.log('\n❌ No ngrok webhook URL found in environment variables');
    }
    
    // Test the medical transcription endpoint health check
    console.log('\n\nTesting medical transcription API...');
    const medicalResponse = await fetch('http://localhost:3000/api/transcribe-medical');
    const medicalData = await medicalResponse.json();
    
    console.log('Medical Transcription API Status:', medicalData.status);
    console.log('Version:', medicalData.version);
    console.log('Features:', JSON.stringify(medicalData.features, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error.message);
    console.error('\nMake sure the Next.js development server is running on port 3000');
  }
}

testApiEnv();
