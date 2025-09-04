/**
 * Comprehensive Test Script for Vercel → Ngrok → n8n Flow
 * Run this after redeploying Vercel to verify everything works
 */

const NGROK_URL = 'https://c88c474cb8e3.ngrok-free.app';
const VERCEL_URL = 'https://dashboard-next-1t9x8x6bq-omar-salems-projects-e9d8c3df.vercel.app';

console.log('========================================');
console.log('🧪 TESTING VERCEL → NGROK → N8N FLOW');
console.log('========================================\n');

// Test 1: Check if ngrok is accessible
async function testNgrokAccess() {
  console.log('TEST 1: Checking ngrok accessibility...');
  try {
    const response = await fetch(NGROK_URL, { method: 'GET' });
    if (response.ok || response.status === 404) {
      console.log('✅ Ngrok is accessible from internet');
      return true;
    } else {
      console.log('❌ Ngrok returned unexpected status:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot reach ngrok:', error.message);
    return false;
  }
}

// Test 2: Send test webhook directly to ngrok
async function testDirectWebhook() {
  console.log('\nTEST 2: Sending test webhook directly to ngrok...');
  
  const testPayload = {
    id: `test-${Date.now()}`,
    audioUrl: 'https://xvwqaeqgomnlqjedtbjp.supabase.co/storage/v1/object/public/audio-files/test.webm',
    fileName: 'test.webm',
    doctorName: 'Test Doctor',
    patientName: 'Test Patient',
    documentType: 'consultation',
    callbackUrl: 'https://webhook.site/test', // Using webhook.site for testing
    userId: 'test-user'
  };

  try {
    const response = await fetch(`${NGROK_URL}/webhook/medical-transcribe-v2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    const text = await response.text();
    
    if (response.ok) {
      console.log('✅ Ngrok webhook accepted the request');
      console.log('   Response:', text.substring(0, 100));
      return true;
    } else if (text.includes('Error in workflow')) {
      console.log('⚠️  N8n received webhook but workflow has errors');
      console.log('   Check n8n Executions tab for details');
      return true; // Webhook reached n8n, that's good
    } else {
      console.log('❌ Webhook failed:', response.status, text);
      return false;
    }
  } catch (error) {
    console.log('❌ Failed to send webhook:', error.message);
    return false;
  }
}

// Test 3: Check what Vercel will use
async function checkVercelConfig() {
  console.log('\nTEST 3: Checking Vercel configuration...');
  console.log('Expected N8N_WEBHOOK_URL:', `${NGROK_URL}/webhook/medical-transcribe-v2`);
  console.log('\n⚠️  MANUAL CHECK REQUIRED:');
  console.log('1. Go to Vercel Dashboard');
  console.log('2. Check Settings → Environment Variables');
  console.log('3. Verify N8N_WEBHOOK_URL is set correctly');
  console.log('4. If you just updated it, REDEPLOY!');
}

// Run all tests
async function runAllTests() {
  const ngrokOk = await testNgrokAccess();
  if (!ngrokOk) {
    console.log('\n❌ NGROK IS NOT ACCESSIBLE - Check if it\'s running');
    return;
  }

  const webhookOk = await testDirectWebhook();
  if (!webhookOk) {
    console.log('\n❌ WEBHOOK FAILED - Check n8n is running');
    return;
  }

  await checkVercelConfig();

  console.log('\n========================================');
  console.log('📊 SUMMARY');
  console.log('========================================');
  console.log('✅ Ngrok is running and accessible');
  console.log('✅ N8n is receiving webhooks');
  console.log('');
  console.log('Next steps:');
  console.log('1. Ensure Vercel env var is set to:', `${NGROK_URL}/webhook/medical-transcribe-v2`);
  console.log('2. Redeploy Vercel if you haven\'t already');
  console.log('3. Test upload on Vercel site');
  console.log('');
  console.log('If uploads still fail after redeployment:');
  console.log('- Check Vercel Function Logs for errors');
  console.log('- Verify the N8N_WEBHOOK_URL in Vercel dashboard');
}

// Execute tests
runAllTests().catch(console.error);
