require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRecentUploads() {
  console.log('📊 Checking Recent Upload Attempts\n');
  console.log('='.repeat(50));
  
  try {
    // Get recent transcriptions
    const { data: transcriptions, error } = await supabase
      .from('transcriptions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching transcriptions:', error);
      return;
    }
    
    if (!transcriptions || transcriptions.length === 0) {
      console.log('No transcriptions found');
      return;
    }
    
    console.log(`Found ${transcriptions.length} recent transcription(s):\n`);
    
    transcriptions.forEach((t, index) => {
      console.log(`${index + 1}. Transcription ID: ${t.id}`);
      console.log('   Status:', t.status === 'failed' ? `❌ ${t.status}` : 
                              t.status === 'completed' ? `✅ ${t.status}` : 
                              `⏳ ${t.status}`);
      console.log('   File:', t.file_name);
      console.log('   Doctor:', t.doctor_name);
      console.log('   Patient:', t.patient_name);
      console.log('   Type:', t.document_type);
      console.log('   Created:', new Date(t.created_at).toLocaleString());
      console.log('   Audio URL:', t.audio_url ? '✅ Present' : '❌ Missing');
      console.log('   Transcription:', t.transcription_text ? 
                  `✅ ${t.transcription_text.substring(0, 50)}...` : '❌ Empty');
      if (t.error) {
        console.log('   Error:', t.error);
      }
      console.log('   ' + '-'.repeat(45));
    });
    
    // Summary
    const statusCounts = transcriptions.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\n📈 Status Summary:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    
    // Check if n8n webhook issue
    const failedWithWebhook = transcriptions.filter(t => 
      t.status === 'failed' && 
      (t.error?.includes('webhook') || t.error?.includes('n8n'))
    );
    
    if (failedWithWebhook.length > 0) {
      console.log('\n⚠️  ISSUE DETECTED: n8n webhook not configured!');
      console.log('   All recent failures are due to webhook not being registered.');
      console.log('\n📝 TO FIX:');
      console.log('   1. Open n8n at http://localhost:5678');
      console.log('   2. Create/open your medical transcription workflow');
      console.log('   3. Add a Webhook node with:');
      console.log('      - HTTP Method: POST');
      console.log('      - Path: medical-transcribe-v2');
      console.log('   4. Either:');
      console.log('      a) Click "Execute Workflow" for one-time test');
      console.log('      b) Activate the workflow for continuous operation');
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkRecentUploads().catch(console.error);
