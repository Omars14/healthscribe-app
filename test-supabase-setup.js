require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase Setup...\n');
  
  // 1. Check storage buckets
  console.log('1. Checking Storage Buckets:');
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error.message);
    } else {
      console.log('✅ Storage buckets found:', buckets.map(b => b.name).join(', '));
      
      // Check if audio-files bucket exists
      const audioBucket = buckets.find(b => b.name === 'audio-files');
      if (audioBucket) {
        console.log('✅ audio-files bucket exists');
        console.log('   Public:', audioBucket.public);
      } else {
        console.log('⚠️ audio-files bucket not found - creating...');
        
        // Create audio-files bucket
        const { data: newBucket, error: createError } = await supabase.storage.createBucket('audio-files', {
          public: true,
          fileSizeLimit: 104857600, // 100MB
          allowedMimeTypes: ['audio/*']
        });
        
        if (createError) {
          console.error('❌ Error creating bucket:', createError.message);
        } else {
          console.log('✅ Created audio-files bucket');
        }
      }
    }
  } catch (err) {
    console.error('❌ Storage check failed:', err.message);
  }
  
  console.log('\n2. Checking Database Tables:');
  try {
    // Check transcriptions table
    const { data: transcriptions, error: transError } = await supabase
      .from('transcriptions')
      .select('id')
      .limit(1);
    
    if (transError) {
      console.error('❌ transcriptions table error:', transError.message);
    } else {
      console.log('✅ transcriptions table exists');
    }
    
    // Check document_templates table
    const { data: templates, error: templError } = await supabase
      .from('document_templates')
      .select('document_type, display_name')
      .eq('is_active', true);
    
    if (templError) {
      console.error('❌ document_templates table error:', templError.message);
    } else {
      console.log('✅ document_templates table exists');
      console.log('   Active templates:', templates.length);
      if (templates.length === 0) {
        console.log('⚠️ No active templates found - inserting defaults...');
        
        const defaultTemplates = [
          { 
            document_type: 'consultation', 
            display_name: 'Consultation Note',
            formatting_instructions: 'Format as standard consultation note with chief complaint, HPI, exam, assessment, and plan',
            is_active: true
          },
          { 
            document_type: 'surgery_report', 
            display_name: 'Surgery Report',
            formatting_instructions: 'Format as operative report with pre/post-op diagnosis, procedure, findings, and technique',
            is_active: true
          },
          { 
            document_type: 'discharge_summary', 
            display_name: 'Discharge Summary',
            formatting_instructions: 'Format with admission/discharge dates, diagnoses, hospital course, and discharge instructions',
            is_active: true
          },
          { 
            document_type: 'progress_note', 
            display_name: 'Progress Note',
            formatting_instructions: 'Format in SOAP note structure',
            is_active: true
          }
        ];
        
        const { error: insertError } = await supabase
          .from('document_templates')
          .insert(defaultTemplates);
        
        if (insertError) {
          console.error('❌ Error inserting templates:', insertError.message);
        } else {
          console.log('✅ Inserted default templates');
        }
      }
    }
  } catch (err) {
    console.error('❌ Database check failed:', err.message);
  }
  
  console.log('\n3. Checking Authentication:');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.log('⚠️ No authenticated user (using service role key)');
    } else {
      console.log('✅ Authenticated as:', user.email);
    }
  } catch (err) {
    console.error('❌ Auth check failed:', err.message);
  }
  
  console.log('\n4. Checking Webhook Configuration:');
  console.log('   N8N_WEBHOOK_URL:', process.env.N8N_WEBHOOK_URL);
  console.log('   NEXT_PUBLIC_URL:', process.env.NEXT_PUBLIC_URL);
  console.log('   Callback URL:', `${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/transcription-result-v2`);
  
  console.log('\n✅ Setup check complete!');
}

checkSupabaseSetup().catch(console.error);
